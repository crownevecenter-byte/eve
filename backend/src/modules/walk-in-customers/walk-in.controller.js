const prisma = require('../../config/db');
const { sequentialOnHttp } = require('../../utils/sequentialOnHttp');
const { runInTransaction } = require('../../config/transaction');

exports.getAll = async (req, res) => {
  try {
    const { branchId, search, limit = '50', page = '1' } = req.query;
    const take = Math.min(Number(limit) || 50, 100);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const where = {
      ...(branchId ? { branchId: parseInt(branchId) } : {}),
      ...(search
        ? {
            OR: [
              { first_name: { contains: search, mode: 'insensitive' } },
              { last_name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { cnic: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [customers, total] = await sequentialOnHttp([
      () =>
        prisma.walkInCustomer.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            first_name: true,
            last_name: true,
            phone: true,
            cnic: true,
            email: true,
            balance: true,
            branchId: true,
            accountId: true,
            createdAt: true,
          },
        }),
      () => prisma.walkInCustomer.count({ where }),
    ]);

    res.json({
      data: customers,
      meta: { total, page: Number(page) || 1, limit: take, totalPages: Math.ceil(total / take) },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { first_name, last_name, cnic, phone, whatsapp, address, email, branchId } = req.body;
    
    if (!branchId) {
        return res.status(400).json({ message: 'Branch ID is required' });
    }

    const customer = await runInTransaction(async (tx) => {
      const cust = await tx.walkInCustomer.create({
        data: {
          first_name,
          last_name,
          cnic,
          phone,
          whatsapp,
          address,
          email,
          branchId: parseInt(branchId)
        }
      });

      let cat = await tx.accountCategory.findFirst({ 
        where: { name: 'WALK-IN CUSTOMER', branchId: parseInt(branchId) } 
      });
      
      if (!cat) {
        cat = await tx.accountCategory.create({ 
          data: { name: 'WALK-IN CUSTOMER', description: 'Walk-in customer receivable accounts', branchId: parseInt(branchId) } 
        });
      }

      const acc = await tx.account.create({
        data: {
          categoryId: cat.id,
          account_name: `${first_name} ${last_name} (${phone})`,
          current_balance: 0,
          branchId: parseInt(branchId),
        },
      });
      await tx.ledger.create({
        data: { accountId: acc.id, ledger_name: `${first_name} ${last_name} - Ledger` },
      });

      return await tx.walkInCustomer.update({
        where: { id: cust.id },
        data: { accountId: acc.id }
      });
    });

    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
