// backend/src/modules/orders/order.controller.js
const Order = require('./order.model');
const prisma = require('../../config/db');
const { sequentialOnHttp } = require('../../utils/sequentialOnHttp');

/**
 * Fix 2: Auto-picks the first branch that has sufficient stock for ALL items in an online order.
 * Called when an ONLINE order arrives without an explicit branchId.
 *
 * @param {Array} items - Order items (each must have productId/id and quantity/qty)
 * @returns {number} branchId of the first branch with sufficient stock for every item
 * @throws {Error} If no branch can satisfy the full order
 */
const pickBranchForOnlineOrder = async (items) => {
  if (!items || items.length === 0) {
    throw new Error('Online order must contain at least one item.');
  }

  const branches = await prisma.branch.findMany({ select: { id: true } });

  for (const branch of branches) {
    let sufficient = true;

    for (const item of items) {
      const pId = item.productId || item.id;
      const qty  = Number(item.quantity || item.qty);

      // Check if this branch stocks the product in sufficient quantity
      const product = await prisma.product.findFirst({
        where: { id: pId, branchId: branch.id, stock_qty: { gte: qty } },
        select: { id: true }
      });

      if (!product) {
        sufficient = false;
        break;
      }
    }

    if (sufficient) return branch.id;
  }

  throw new Error('No branch has sufficient stock for all items in this order.');
};

exports.create = async (req, res) => {
  try {
    const customerId = req.user.role === 'CUSTOMER' ? req.user.id : (req.body.customerId || null);

    let { branchId, ...rest } = req.body;

    // Fix 2: Auto-assign branch for online orders that do not specify one
    if (rest.type === 'ONLINE' && !branchId) {
      branchId = await pickBranchForOnlineOrder(req.body.items || []);
    }

    const order = await Order.createOrder({ ...rest, branchId, customerId });
    res.status(201).json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const query = { ...req.query };
    // Enforce branchId for non-global owners
    if (['BRANCH_OWNER', 'BRANCH_MANAGER', 'EMPLOYEE'].includes(req.user.role)) {
      query.branchId = req.user.branchId;
    }
    const result = await Order.getOrders(query);
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/** Owner orders page — orders list + branch filter dropdown in one request. */
exports.getPageInit = async (req, res) => {
  try {
    const query = { ...req.query };
    if (['BRANCH_OWNER', 'BRANCH_MANAGER', 'EMPLOYEE'].includes(req.user.role)) {
      query.branchId = req.user.branchId;
    }

    const isOwner = req.user.role === 'COMPANY_OWNER';
    const [orders, branches] = await sequentialOnHttp([
      () => Order.getOrders(query),
      () =>
        isOwner
          ? prisma.branch.findMany({
              take: 100,
              select: { id: true, name: true },
              orderBy: { name: 'asc' },
            })
          : Promise.resolve([]),
    ]);

    res.json({
      orders,
      branches: isOwner ? { data: branches } : undefined,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/** Lightweight CSV export for owner settings (one DB query, no heavy includes). */
exports.exportCsv = async (req, res) => {
  try {
    if (req.user.role !== 'COMPANY_OWNER') {
      return res.status(403).json({ message: 'Only company owners can export all orders.' });
    }

    const orders = await prisma.order.findMany({
      take: 2000,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        total: true,
        status: true,
        branch: { select: { name: true } },
      },
    });

    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [
      'Order ID,Date,Total,Status,Branch',
      ...orders.map((o) =>
        [
          o.id,
          new Date(o.createdAt).toISOString().slice(0, 10),
          o.total,
          o.status,
          o.branch?.name || '',
        ]
          .map(escape)
          .join(',')
      ),
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="crown-eve-orders.csv"');
    res.send(lines.join('\n'));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getCount = async (req, res) => {
  try {
    const { branchId, status, type } = req.query;
    const count = await Order.countOrders({ 
      branchId: branchId ? Number(branchId) : undefined,
      status: status || undefined,
      type: type || undefined
    });
    res.json({ count });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const order = await Order.getOrderById(Number(req.params.id));
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Bug 6: Use optional chaining — order.customer may be null for walk-in or system orders
    if (req.user.role === 'CUSTOMER' && order.customer?.id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (['BRANCH_OWNER', 'BRANCH_MANAGER', 'EMPLOYEE'].includes(req.user.role)) {
      if (Number(order.branchId) !== Number(req.user.branchId)) {
        return res.status(403).json({ message: 'Access denied for this branch.' });
      }
    }

    res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getByCustomer = async (req, res) => {
  try {
    const customerId = Number(req.params.id);
    
    // Security check: Customers can only fetch their own orders
    if (req.user.role === 'CUSTOMER' && req.user.id !== customerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = await Order.getOrders({ ...req.query, customerId });
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const updated = await Order.updateOrder(Number(req.params.id), req.body);
    res.json({ message: 'Order updated successfully', order: updated });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getMine = async (req, res) => {
  try {
    const result = await Order.getOrders({ ...req.query, customerId: req.user.id });
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
