/**
 * Double-entry ledger helpers.
 * Every posting: one debit + one credit, equal amounts.
 */
const prisma = require('../config/db');
const { runInTransaction } = require('../config/transaction');

const isDebitNatureCategory = (catName) => {
  const n = (catName || '').toLowerCase();
  return (
    n.includes('bank') ||
    n.includes('cash') ||
    n.includes('asset') ||
    n.includes('expense') ||
    n.includes('customer') ||
    n.includes('purchase')
  );
};

const adjustBalance = (account, changeAmount, operationType) => {
  const catName = account.category?.name || '';
  const isDebitNature = isDebitNatureCategory(catName);
  let newBalance = account.current_balance;

  if (operationType === 'DEBIT') {
    newBalance = isDebitNature ? newBalance + changeAmount : newBalance - changeAmount;
  } else if (operationType === 'CREDIT') {
    newBalance = isDebitNature ? newBalance - changeAmount : newBalance + changeAmount;
  }
  return newBalance;
};

const getOrCreateCategory = async (tx, branchId, name, description) => {
  const bId = Number(branchId);
  let cat = await tx.accountCategory.findFirst({ where: { name, branchId: bId } });
  if (!cat) {
    cat = await tx.accountCategory.create({
      data: { name, description: description || `System ${name}`, branchId: bId },
    });
  }
  return cat;
};

const getOrCreateAccountWithLedger = async (tx, branchId, categoryName, accountName, categoryDescription) => {
  const bId = Number(branchId);
  const cat = await getOrCreateCategory(tx, bId, categoryName, categoryDescription);
  let account = await tx.account.findFirst({
    where: { categoryId: cat.id, account_name: accountName, branchId: bId },
    include: { category: true, ledger: true },
  });
  if (!account) {
    // No include on create — PrismaNeonHTTP treats create+include as a transaction
    const created = await tx.account.create({
      data: {
        categoryId: cat.id,
        account_name: accountName,
        branchId: bId,
        opening_balance: 0,
        current_balance: 0,
        status: 'ACTIVE',
      },
    });
    const ledger = await tx.ledger.create({
      data: { accountId: created.id, ledger_name: `${accountName} Ledger` },
    });
    account = { ...created, category: cat, ledger };
  } else if (!account.ledger) {
    const ledger = await tx.ledger.create({
      data: { accountId: account.id, ledger_name: `${accountName} Ledger` },
    });
    account = { ...account, ledger };
  }
  return account;
};

const postLedgerLine = async (tx, account, ledger, debit, credit, referenceType, description) => {
  if (!ledger) return;
  await tx.ledgerEntry.create({
    data: {
      ledgerId: ledger.id,
      debit,
      credit,
      reference_type: referenceType,
      description,
    },
  });
  if (debit > 0) {
    const newBal = adjustBalance(account, debit, 'DEBIT');
    await tx.account.update({ where: { id: account.id }, data: { current_balance: newBal } });
    account.current_balance = newBal;
  }
  if (credit > 0) {
    const newBal = adjustBalance(account, credit, 'CREDIT');
    await tx.account.update({ where: { id: account.id }, data: { current_balance: newBal } });
    account.current_balance = newBal;
  }
};

/** DR debitAccount, CR creditAccount */
const postDoubleEntry = async (
  tx,
  { branchId, debitAccountId, creditAccountId, amount, referenceType, description }
) => {
  const amt = Number(amount);
  if (!amt || amt <= 0) throw new Error('Ledger amount must be greater than zero.');

  const debitAcc = await tx.account.findUnique({
    where: { id: debitAccountId },
    include: { category: true, ledger: true },
  });
  const creditAcc = await tx.account.findUnique({
    where: { id: creditAccountId },
    include: { category: true, ledger: true },
  });

  if (!debitAcc?.ledger || !creditAcc?.ledger) {
    throw new Error('Debit or credit account ledger not found.');
  }

  await postLedgerLine(tx, debitAcc, debitAcc.ledger, amt, 0, referenceType, description);
  await postLedgerLine(tx, creditAcc, creditAcc.ledger, 0, amt, referenceType, description);
};

const getSalesAccount = (tx, branchId) =>
  getOrCreateAccountWithLedger(tx, branchId, 'REVENUE', 'Sales Account', 'Sales income');

const getPurchaseAccount = (tx, branchId) =>
  getOrCreateAccountWithLedger(tx, branchId, 'PURCHASE', 'Purchase Account', 'Purchases / inventory');

const ensureWalkInCustomerAccount = async (tx, walkInCustomerId, branchId) => {
  const walkIn = await tx.walkInCustomer.findUnique({ where: { id: walkInCustomerId } });
  if (!walkIn) throw new Error('Walk-in customer not found.');

  if (walkIn.accountId) {
    const account = await tx.account.findUnique({
      where: { id: walkIn.accountId },
      include: { category: true, ledger: true },
    });
    if (account?.ledger) return account;
  }

  const accName = `${walkIn.first_name} ${walkIn.last_name || ''}`.trim();
  const account = await getOrCreateAccountWithLedger(
    tx,
    branchId,
    'WALK-IN CUSTOMER',
    walkIn.phone ? `${accName} (${walkIn.phone})` : accName,
    'Walk-in customer receivable accounts'
  );

  await tx.walkInCustomer.update({
    where: { id: walkInCustomerId },
    data: { accountId: account.id },
  });
  return account;
};

const ensureOnlineCustomerAccount = async (tx, customerId, branchId) => {
  const user = await tx.user.findUnique({ where: { id: customerId } });
  if (!user) throw new Error('Online customer not found.');

  const accountName = `Online - ${user.name} (${user.email})`;
  const bId = Number(branchId);
  const cat = await getOrCreateCategory(tx, bId, 'ONLINE CUSTOMER', 'Online customer receivable accounts');

  let account = await tx.account.findFirst({
    where: { categoryId: cat.id, account_name: accountName, branchId: bId },
    include: { category: true, ledger: true },
  });

  if (!account) {
    account = await getOrCreateAccountWithLedger(
      tx,
      branchId,
      'ONLINE CUSTOMER',
      accountName,
      'Online customer receivable accounts'
    );
  }
  return account;
};

const ensureSupplierAccount = async (tx, supplierId, branchId) => {
  const supplier = await tx.supplier.findUnique({ where: { id: Number(supplierId) } });
  if (!supplier) throw new Error('Supplier not found.');

  if (supplier.accountId) {
    const account = await tx.account.findUnique({
      where: { id: supplier.accountId },
      include: { category: true, ledger: true },
    });
    if (account?.ledger) return account;
  }

  const account = await getOrCreateAccountWithLedger(
    tx,
    branchId,
    'SUPPLIER',
    `${supplier.name} (${supplier.contact})`,
    'Supplier payable accounts'
  );

  await tx.supplier.update({
    where: { id: supplier.id },
    data: { accountId: account.id },
  });
  return account;
};

/** Sales invoice: DR Customer Account, CR Sales Account */
const postSaleInvoiceLedger = async (tx, { branchId, orderId, total, walkInCustomerId, customerId }) => {
  const salesAccount = await getSalesAccount(tx, branchId);
  let customerAccount;

  if (walkInCustomerId) {
    customerAccount = await ensureWalkInCustomerAccount(tx, walkInCustomerId, branchId);
  } else if (customerId) {
    customerAccount = await ensureOnlineCustomerAccount(tx, customerId, branchId);
  } else {
    throw new Error('Customer is required for sales invoice accounting.');
  }

  const desc = `Sales Invoice #${orderId}`;
  await postDoubleEntry(tx, {
    branchId,
    debitAccountId: customerAccount.id,
    creditAccountId: salesAccount.id,
    amount: total,
    referenceType: 'SALE_INVOICE',
    description: desc,
  });
};

/** Purchase invoice: DR Purchase Account, CR Supplier Account */
const postPurchaseInvoiceLedger = async (tx, { branchId, purchaseId, total, supplierId }) => {
  const purchaseAccount = await getPurchaseAccount(tx, branchId);
  const supplierAccount = await ensureSupplierAccount(tx, supplierId, branchId);

  await postDoubleEntry(tx, {
    branchId,
    debitAccountId: purchaseAccount.id,
    creditAccountId: supplierAccount.id,
    amount: total,
    referenceType: 'PURCHASE_INVOICE',
    description: `Purchase Invoice #${purchaseId}`,
  });
};

const SYNC_BATCH_LIMIT = 40;

/** Heal missing ledgers for walk-ins, suppliers, and online customers (capped per run). */
const syncPartyLedgers = async (branchId) => {
  const bId = Number(branchId);
  const walkIns = await prisma.walkInCustomer.findMany({
    where: { branchId: bId },
    take: SYNC_BATCH_LIMIT,
    orderBy: { createdAt: 'desc' },
  });
  const suppliers = await prisma.supplier.findMany({
    take: SYNC_BATCH_LIMIT,
    orderBy: { id: 'asc' },
  });
  const onlineCustomers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    take: SYNC_BATCH_LIMIT,
    orderBy: { createdAt: 'desc' },
  });

  await runInTransaction(async (tx) => {
    for (const c of walkIns) {
      await ensureWalkInCustomerAccount(tx, c.id, bId);
    }
    for (const s of suppliers) {
      await ensureSupplierAccount(tx, s.id, bId);
    }
    for (const u of onlineCustomers) {
      await ensureOnlineCustomerAccount(tx, u.id, bId);
    }
    await getSalesAccount(tx, bId);
    await getPurchaseAccount(tx, bId);
  });

  return {
    synced: {
      walkIns: walkIns.length,
      suppliers: suppliers.length,
      customers: onlineCustomers.length,
    },
    capped: SYNC_BATCH_LIMIT,
  };
};

module.exports = {
  postDoubleEntry,
  postSaleInvoiceLedger,
  postPurchaseInvoiceLedger,
  ensureWalkInCustomerAccount,
  ensureOnlineCustomerAccount,
  ensureSupplierAccount,
  getSalesAccount,
  getPurchaseAccount,
  syncPartyLedgers,
  isDebitNatureCategory,
  adjustBalance,
};
