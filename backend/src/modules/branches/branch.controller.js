// backend/src/modules/branches/branch.controller.js
const prisma = require('../../config/db');
const { sequentialOnHttp } = require('../../utils/sequentialOnHttp');
const Branch = require('./branch.model');
const { runInTransaction } = require('../../config/transaction');
const { updateManySequential } = require('../../config/prismaHttp');
const { invalidateCatalogCache } = require('../../middleware/cache');

exports.getCount = async (req, res) => {
  try {
    const count = await prisma.branch.count();
    res.json({ count });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getTop = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    // For now, "top" means most orders, we can refine this
    const branches = await prisma.branch.findMany({
      take: Number(limit),
      include: {
        _count: { select: { orders: true } }
      },
      orderBy: { orders: { _count: 'desc' } }
    });
    res.json(branches);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getAvailable = async (req, res) => {
  try {
    const { slugs } = req.query; // Expecting comma separated slugs
    if (!slugs) return res.json([]);
    const slugList = slugs.split(',');

    const branches = await prisma.branch.findMany({
      where: {
        products: {
          some: {
            slug: { in: slugList },
            stock_qty: { gt: 0 }
          }
        }
      },
      include: {
        products: {
          where: {
            slug: { in: slugList },
            stock_qty: { gt: 0 }
          },
          select: { slug: true, name: true, stock_qty: true }
        }
      }
    });

    const results = branches.map(b => {
      const branchSlugs = b.products.map(p => p.slug);
      const missing = slugList.filter(s => !branchSlugs.includes(s));
      const available = slugList.filter(s => branchSlugs.includes(s));
      
      return {
        ...b,
        availability: {
          isFull: missing.length === 0,
          availableCount: available.length,
          totalRequested: slugList.length,
          missingSlugs: missing,
          availableSlugs: available
        }
      };
    });

    // Sort: Full availability first, then by available count
    results.sort((a, b) => {
      if (a.availability.isFull && !b.availability.isFull) return -1;
      if (!a.availability.isFull && b.availability.isFull) return 1;
      return b.availability.availableCount - a.availability.availableCount;
    });

    res.json(results);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await sequentialOnHttp([
      () =>
        prisma.branch.findMany({
          skip,
          take: limit,
          include: { _count: { select: { users: true, products: true } } },
          orderBy: { createdAt: 'desc' },
        }),
      () => prisma.branch.count(),
    ]);

    res.json({
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id: Number(req.params.id) },
      include: { users: { select: { id: true, name: true, role: true } } }
    });
    res.json(branch);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/** Branch settings page — branch detail + bank accounts in one request. */
exports.getSettingsBundle = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (req.user.role === 'BRANCH_OWNER' && req.user.branchId !== id) {
      return res.status(403).json({ message: 'You can only view your own branch settings' });
    }
    const [branch, banks] = await sequentialOnHttp([
      () =>
        prisma.branch.findUnique({
          where: { id },
          include: { users: { select: { id: true, name: true, role: true } } },
        }),
      () => prisma.bank.findMany({ where: { branchId: id } }),
    ]);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.json({ branch, banks });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getBanks = async (req, res) => {
  try {
    const banks = await prisma.bank.findMany({
      where: { branchId: Number(req.params.id) }
    });
    res.json(banks);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, location, phone, whatsapp } = req.body;
    if (!name?.trim() || !location?.trim()) {
      return res.status(400).json({ message: 'Branch name and location are required.' });
    }

    const branch = await Branch.createBranch({
      name: name.trim(),
      location: location.trim(),
      phone: phone?.trim() || null,
      whatsapp: whatsapp?.trim() || null,
    });

    invalidateCatalogCache();
    res.status(201).json(branch);
  } catch (e) {
    const isDuplicateId =
      e.code === 'P2002' || /Branch_pkey|unique constraint/i.test(e.message || '');
    res.status(500).json({
      message: isDuplicateId
        ? 'Could not assign a new branch ID. Please try again in a moment.'
        : e.message,
    });
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (req.user.role === 'BRANCH_OWNER' && req.user.branchId !== id) {
      return res.status(403).json({ message: "You can only update your own branch" });
    }
    const branch = await prisma.branch.update({
      where: { id },
      data: req.body
    });
    res.json(branch);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  try {
    await runInTransaction(async (tx) => {
      const [purchases, orders, products, services, walkInCustomers, accounts] =
        await sequentialOnHttp([
          () => tx.purchase.findMany({ where: { branchId: id }, select: { id: true } }),
          () => tx.order.findMany({ where: { branchId: id }, select: { id: true } }),
          () => tx.product.findMany({ where: { branchId: id }, select: { id: true } }),
          () => tx.service.findMany({ where: { branchId: id }, select: { id: true } }),
          () => tx.walkInCustomer.findMany({ where: { branchId: id }, select: { id: true } }),
          () => tx.account.findMany({ where: { branchId: id }, select: { id: true } }),
        ]);

      const purchaseIds = purchases.map((p) => p.id);
      const orderIds = orders.map((o) => o.id);
      const productIds = products.map((p) => p.id);
      const serviceIds = services.map((s) => s.id);
      const walkInCustomerIds = walkInCustomers.map((c) => c.id);
      const accountIds = accounts.map((a) => a.id);

      if (purchaseIds.length > 0) {
        await tx.purchaseItem.deleteMany({ where: { purchaseId: { in: purchaseIds } } });
      }
      if (orderIds.length > 0) {
        await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
      }
      if (productIds.length > 0) {
        await tx.orderItem.deleteMany({ where: { productId: { in: productIds } } });
        await tx.purchaseItem.deleteMany({ where: { productId: { in: productIds } } });
      }
      if (serviceIds.length > 0) {
        await tx.serviceBooking.deleteMany({ where: { serviceId: { in: serviceIds } } });
      }

      await tx.serviceBooking.deleteMany({ where: { branchId: id } });

      if (orderIds.length > 0) {
        await tx.walkInCustomerLedger.deleteMany({ where: { orderId: { in: orderIds } } });
      }
      if (walkInCustomerIds.length > 0) {
        await tx.walkInCustomerLedger.deleteMany({ where: { customerId: { in: walkInCustomerIds } } });
      }

      await tx.voucher.deleteMany({ where: { branchId: id } });

      if (accountIds.length > 0) {
        const ledgers = await tx.ledger.findMany({
          where: { accountId: { in: accountIds } },
          select: { id: true },
        });
        const ledgerIds = ledgers.map((l) => l.id);
        if (ledgerIds.length > 0) {
          await tx.ledgerEntry.deleteMany({ where: { ledgerId: { in: ledgerIds } } });
        }
        await tx.ledger.deleteMany({ where: { accountId: { in: accountIds } } });
        await updateManySequential(tx, tx.supplier, { accountId: { in: accountIds } }, { accountId: null });
        await updateManySequential(tx, tx.walkInCustomer, { accountId: { in: accountIds } }, { accountId: null });
      }

      await tx.order.deleteMany({ where: { branchId: id } });
      await tx.walkInCustomer.deleteMany({ where: { branchId: id } });
      await tx.purchase.deleteMany({ where: { branchId: id } });
      await tx.stockAdjustment.deleteMany({ where: { branchId: id } });
      await tx.inventory.deleteMany({ where: { branchId: id } });
      await tx.bank.deleteMany({ where: { branchId: id } });
      await tx.account.deleteMany({ where: { branchId: id } });
      await tx.accountCategory.deleteMany({ where: { branchId: id } });
      await tx.product.deleteMany({ where: { branchId: id } });
      await tx.service.deleteMany({ where: { branchId: id } });

      await updateManySequential(tx, tx.user, { branchId: id }, { branchId: null });

      await tx.branch.delete({ where: { id } });
    }, {
      timeout: 120000,
    });

    const stillExists = await prisma.branch.findUnique({
      where: { id },
      select: { id: true },
    });
    if (stillExists) {
      return res.status(500).json({
        message: 'Branch deletion did not complete. Please try again.',
      });
    }

    invalidateCatalogCache();
    res.json({ message: 'Branch deleted successfully' });
  } catch (e) {
    const logger = require('../../config/logger');
    logger.error('Branch Deletion Failed', { branchId: id, error: e.message, stack: e.stack });
    res.status(500).json({
      message: `Failed to delete branch: ${e.message}`,
    });
  }
};
