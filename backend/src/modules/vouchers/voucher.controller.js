// backend/src/modules/vouchers/voucher.controller.js
const prisma = require('../../config/db');
const { runInTransaction } = require('../../config/transaction');
const { sequentialOnHttp } = require('../../utils/sequentialOnHttp');

const computeNextVoucherNo = async (branchId, voucher_type) => {
  const rows = await prisma.$queryRaw`
    SELECT COALESCE(MAX(
      NULLIF(regexp_replace(voucher_no, '^[A-Z]+-', ''), '')::int
    ), 0)::int AS max_num
    FROM "Voucher"
    WHERE "branchId" = ${parseInt(branchId, 10)}
      AND voucher_type = ${voucher_type}
  `;
  return String((rows[0]?.max_num || 0) + 1);
};

// Get all vouchers (optionally filtered by branch and type)
exports.getAll = async (req, res) => {
  try {
    const { branchId, voucher_type, voucher_no } = req.query;
    const where = {};
    if (branchId) where.branchId = parseInt(branchId);
    if (voucher_type) where.voucher_type = voucher_type;
    
    if (voucher_no) {
      const prefix = voucher_type === 'PAYMENT' ? 'PV' : voucher_type === 'RECEIPT' ? 'RV' : 'JV';
      const exactVNo = voucher_no.toUpperCase().includes(prefix) ? voucher_no.toUpperCase() : `${prefix}-${voucher_no}`;
      where.voucher_no = exactVNo;
    }

    const vouchers = await prisma.voucher.findMany({
      where,
      include: {
        fromAccount: { include: { category: true } },
        toAccount: { include: { category: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ data: vouchers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get the next sequential voucher number
exports.getNextNo = async (req, res) => {
  try {
    const { branchId, voucher_type } = req.query;
    if (!branchId) {
      return res.status(400).json({ message: 'Branch ID is required.' });
    }
    if (!voucher_type) {
      return res.status(400).json({ message: 'Voucher type is required.' });
    }

    res.json({ nextNo: await computeNextVoucherNo(branchId, voucher_type) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new Voucher (Payment, Receipt, or Journal)
exports.create = async (req, res) => {
  try {
    const {
      voucher_type, // PAYMENT, RECEIPT, JOURNAL
      category,
      to_type,
      fromAccountId,
      toAccountId,
      amount,
      ref_no,
      description,
      branchId,
      date
    } = req.body;

    if (!voucher_type || !branchId || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Voucher type, branch ID, and positive amount are required.' });
    }

    if (!fromAccountId || !toAccountId) {
      return res.status(400).json({ message: 'Both Source and Destination accounts are required.' });
    }

    const amt = parseFloat(amount);

    // 1. Run database transaction to post voucher atomically
    const result = await runInTransaction(async (tx) => {
      // Fetch both accounts to update balances and get their categories
      const fromAcc = await tx.account.findUnique({
        where: { id: fromAccountId },
        include: { category: true, ledger: true }
      });
      const toAcc = await tx.account.findUnique({
        where: { id: toAccountId },
        include: { category: true, ledger: true }
      });

      if (!fromAcc || !toAcc) {
        throw new Error('One of the specified accounts does not exist.');
      }

      const prefix = voucher_type === 'PAYMENT' ? 'PV' : voucher_type === 'RECEIPT' ? 'RV' : 'JV';
      const nextNum = await computeNextVoucherNo(branchId, voucher_type);
      const voucher_no = `${prefix}-${nextNum}`;

      // 2. Create the Voucher record
      const voucher = await tx.voucher.create({
        data: {
          voucher_no,
          voucher_type,
          category,
          to_type,
          fromAccountId,
          toAccountId,
          amount: amt,
          ref_no,
          description,
          branchId: parseInt(branchId),
          date: date ? new Date(date) : undefined
        }
      });

      // 3. Post Ledger Entries & Update Live Balances
      // Helper function to update balance based on account type
      const adjustBalance = (account, changeAmount, operationType) => {
        const catName = account.category.name.toLowerCase();
        const isAssetOrExpense = 
          catName.includes('bank') ||
          catName.includes('cash') ||
          catName.includes('asset') ||
          catName.includes('expense') ||
          catName.includes('customer') ||
          catName.includes('purchase');

        let newBalance = account.current_balance;

        if (operationType === 'DEBIT') {
          // Debit increases Assets/Expenses, decreases Liabilities/Revenue/Equity
          newBalance = isAssetOrExpense ? newBalance + changeAmount : newBalance - changeAmount;
        } else if (operationType === 'CREDIT') {
          // Credit decreases Assets/Expenses, increases Liabilities/Revenue/Equity
          newBalance = isAssetOrExpense ? newBalance - changeAmount : newBalance + changeAmount;
        }

        return newBalance;
      };

      // Rules:
      // In payment/receipt/journal, fromAccount is CREDITED (gives money) and toAccount is DEBITED (receives money)
      
      // Update fromAccount (Credit Side)
      const fromNewBal = adjustBalance(fromAcc, amt, 'CREDIT');
      await tx.account.update({
        where: { id: fromAccountId },
        data: { current_balance: fromNewBal }
      });

      // Update toAccount (Debit Side)
      const toNewBal = adjustBalance(toAcc, amt, 'DEBIT');
      await tx.account.update({
        where: { id: toAccountId },
        data: { current_balance: toNewBal }
      });

      // Generate Auto-Descriptions
      const fromEntryDesc = `Paid to ${toAcc.account_name}${description ? ' - ' + description : ''}${ref_no ? ' (Ref: ' + ref_no + ')' : ''} [V#: ${voucher_no}]`;
      const toEntryDesc = `Received from ${fromAcc.account_name}${description ? ' - ' + description : ''}${ref_no ? ' (Ref: ' + ref_no + ')' : ''} [V#: ${voucher_no}]`;

      // Create LedgerEntry for fromAccount (Credit)
      if (fromAcc.ledger) {
        await tx.ledgerEntry.create({
          data: {
            ledgerId: fromAcc.ledger.id,
            debit: 0,
            credit: amt,
            reference_type: `${voucher_type}_VOUCHER`,
            description: fromEntryDesc,
            createdAt: date ? new Date(date) : undefined
          }
        });
      }

      // Create LedgerEntry for toAccount (Debit)
      if (toAcc.ledger) {
        await tx.ledgerEntry.create({
          data: {
            ledgerId: toAcc.ledger.id,
            debit: amt,
            credit: 0,
            reference_type: `${voucher_type}_VOUCHER`,
            description: toEntryDesc,
            createdAt: date ? new Date(date) : undefined
          }
        });
      }

      return voucher;
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a Voucher and Reverse Balances
exports.deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await runInTransaction(async (tx) => {
      // 1. Find Voucher
      const voucher = await tx.voucher.findUnique({
        where: { id },
        include: {
          fromAccount: { include: { category: true, ledger: true } },
          toAccount: { include: { category: true, ledger: true } }
        }
      });

      if (!voucher) throw new Error("Voucher not found.");

      const amt = voucher.amount;

      const adjustBalance = (account, changeAmount, operationType) => {
        const catName = account.category.name.toLowerCase();
        const isAssetOrExpense = 
          catName.includes('bank') ||
          catName.includes('cash') ||
          catName.includes('asset') ||
          catName.includes('expense') ||
          catName.includes('customer') ||
          catName.includes('purchase');

        let newBalance = account.current_balance;

        if (operationType === 'DEBIT') {
          newBalance = isAssetOrExpense ? newBalance + changeAmount : newBalance - changeAmount;
        } else if (operationType === 'CREDIT') {
          newBalance = isAssetOrExpense ? newBalance - changeAmount : newBalance + changeAmount;
        }

        return newBalance;
      };

      // 2. Reverse Balances globally using exact rules:
      // Original: fromAccount was CREDITED. Reversal: DEBIT it.
      if (voucher.fromAccount) {
        const fromNewBal = adjustBalance(voucher.fromAccount, amt, 'DEBIT');
        await tx.account.update({
          where: { id: voucher.fromAccountId },
          data: { current_balance: fromNewBal }
        });
      }

      // Original: toAccount was DEBITED. Reversal: CREDIT it.
      if (voucher.toAccount) {
        const toNewBal = adjustBalance(voucher.toAccount, amt, 'CREDIT');
        await tx.account.update({
          where: { id: voucher.toAccountId },
          data: { current_balance: toNewBal }
        });
      }

      // 3. Delete Associated Ledger Entries (using exact V# match inside description)
      await tx.ledgerEntry.deleteMany({
        where: {
          reference_type: `${voucher.voucher_type}_VOUCHER`,
          description: {
            contains: `[V#: ${voucher.voucher_no}]`
          }
        }
      });

      // 4. Delete the Voucher
      await tx.voucher.delete({
        where: { id }
      });

      return { message: "Voucher deleted and balances reversed successfully." };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** POS voucher tabs — categories, accounts, recent history, next number in one request. */
exports.getPageInit = async (req, res) => {
  try {
    const { branchId, voucher_type } = req.query;
    if (!branchId) return res.status(400).json({ message: 'Branch ID is required.' });
    if (!voucher_type) return res.status(400).json({ message: 'Voucher type is required.' });

    const bId = parseInt(branchId, 10);
    const [categories, accounts, history, nextNo] = await sequentialOnHttp([
      () =>
        prisma.accountCategory.findMany({
          where: { OR: [{ branchId: null }, { branchId: bId }] },
          orderBy: { name: 'asc' },
        }),
      () =>
        prisma.account.findMany({
          where: { branchId: bId },
          select: {
            id: true,
            categoryId: true,
            account_name: true,
            opening_balance: true,
            current_balance: true,
            status: true,
            branchId: true,
            category: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      () =>
        prisma.voucher.findMany({
          where: { branchId: bId, voucher_type },
          include: {
            fromAccount: { include: { category: true } },
            toAccount: { include: { category: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 40,
        }),
      () => computeNextVoucherNo(branchId, voucher_type),
    ]);

    res.json({
      categories: { data: categories },
      accounts: { data: accounts },
      history: { data: history },
      nextNo: { nextNo },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
