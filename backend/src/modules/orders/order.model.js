// backend/src/modules/orders/order.model.js
const prisma = require('../../config/db');
const { sequentialOnHttp } = require('../../utils/sequentialOnHttp');
const { runInTransaction } = require('../../config/transaction');
const { syncInventoryToPartsAndProducts } = require('../inventory/inventory.utils');
const { deductProductStockAtomic } = require('../inventory/stockMovement');
const { postSaleInvoiceLedger } = require('../../services/ledger.service');

const restoreStockRollbacks = async (rollbacks) => {
  for (const { productId, qty } of rollbacks) {
    try {
      await prisma.product.update({
        where: { id: productId },
        data: { stock_qty: { increment: qty } },
      });
    } catch {
      // best-effort undo when HTTP mode cannot roll back automatically
    }
  }
};

const createOrder = async (data) => {
  const {
    branchId, customerId, walkInCustomerId, bankId, total, type,
    payment_method, payment_status, payment_screenshot, transaction_id,
    tracking_id, customer_name, customer_phone, notes, items
  } = data;

  const stockRollbacks = [];

  try {
    return await runInTransaction(async (tx) => {
    // Fix 3: Idempotency guard — return the existing order if this transaction_id was already processed
    if (transaction_id) {
      const existingOrder = await tx.order.findFirst({ where: { transaction_id } });
      if (existingOrder) {
        return existingOrder;
      }
    }

    // 0. Atomically verify stock and deduct (raw SQL — updateMany fails on PrismaNeonHTTP)
    for (const item of items) {
      const pId = item.productId || item.id;
      const qtyRequested = Number(item.quantity || item.qty);
      await deductProductStockAtomic(tx, pId, qtyRequested);
      stockRollbacks.push({ productId: pId, qty: qtyRequested });
    }

    // 1. Create order + line items separately (nested create fails on PrismaNeonHTTP)
    const createdOrder = await tx.order.create({
      data: {
        branchId: Number(branchId),
        customerId: customerId || undefined,
        walkInCustomerId: walkInCustomerId || undefined,
        bankId: bankId || undefined,
        total: Number(total),
        type: type || 'POS',
        status: type === 'POS' ? 'COMPLETED' : 'PENDING',
        payment_method: payment_method || 'CASH',
        payment_status: payment_status || 'PENDING',
        payment_screenshot,
        transaction_id,
        tracking_id,
        customer_name,
        customer_phone,
        notes,
      },
    });

    for (const item of items) {
      await tx.orderItem.create({
        data: {
          orderId: createdOrder.id,
          productId: item.productId || item.id,
          quantity: Number(item.quantity || item.qty),
          price: Number(item.price),
        },
      });
    }

    const order = await tx.order.findUnique({
      where: { id: createdOrder.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                productParts: true,
                bikeDetail: true,
                partDetail: true,
              },
            },
          },
        },
        branch: { select: { id: true, name: true, location: true, phone: true, whatsapp: true } },
      },
    });

    // 2. Handle parts inventory for composite products (Bug 3 + Bug 5)
    //
    //    Standalone products (productParts.length === 0): stock_qty was already atomically
    //    decremented in Step 0. Nothing more to do here.
    //
    //    Composite products (productParts.length > 0): stock_qty was also decremented in
    //    Step 0, but syncInventoryToPartsAndProducts will recalculate and overwrite it from
    //    the parts inventory — parts are the single source of truth for composite stock.
    //    We do NOT do a second product.update decrement here (Bug 3 fix).
    for (const item of order.items) {
      if (!item.product) continue;

      const quantitySold = Number(item.quantity);

      // Only process parts deduction for composite products
      if (item.product.productParts && item.product.productParts.length > 0) {
        for (const productPart of item.product.productParts) {
          const qtyToDeduct = productPart.quantity * quantitySold;

          // Find the inventory record for this part at this branch
          const inv = await tx.inventory.findUnique({
            where: {
              branchId_partId: {
                branchId: Number(branchId),
                partId: Number(productPart.partId)
              }
            }
          });

          // Bug 5: Throw instead of silently creating negative stock — a missing inventory
          // record means the part was never stocked at this branch, which is a data error.
          if (!inv) {
            throw new Error(
              `Part ID ${productPart.partId} has no inventory record at branch ${branchId}. ` +
              `Stock the part before selling products that use it.`
            );
          }

          await tx.inventory.update({
            where: { id: inv.id },
            data: { stock: { decrement: qtyToDeduct } }
          });

          // Sync product.stock_qty back from parts inventory (parts are source of truth for composites)
          await syncInventoryToPartsAndProducts(tx, branchId, productPart.partId);
        }
      }
    }

    // 3. Handle Walk-in Customer Debit (Credit Sale) — updates outstanding balance
    if (order.walkInCustomerId) {
      await tx.walkInCustomer.update({
        where: { id: order.walkInCustomerId },
        data: { balance: { increment: Number(total) } }
      });

      await tx.walkInCustomerLedger.create({
        data: {
          customerId: order.walkInCustomerId,
          amount: Number(total),
          type: 'DEBIT',
          description: `Sale Invoice #${order.id} - ${type === 'POS' ? 'POS Terminal' : 'Online Order'}`,
          orderId: order.id
        }
      });
    } else if (bankId) {
      // 4. Update Bank Balance for non-walkin bank payments
      await tx.bank.update({
        where: { id: bankId },
        data: { current_balance: { increment: Number(total) } }
      });
    }

    // 5. Double-entry: DR Customer Account, CR Sales Account (pass tx — no nested $transaction)
    if (order.walkInCustomerId || customerId) {
      await postSaleInvoiceLedger(tx, {
        branchId,
        orderId: order.id,
        total: Number(total),
        walkInCustomerId: walkInCustomerId || null,
        customerId: customerId || null,
      });
    }

    return order;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });
  } catch (err) {
    if (stockRollbacks.length) {
      await restoreStockRollbacks(stockRollbacks);
    }
    throw err;
  }
};

const buildOrderSearchFilter = (search) => {
  const q = String(search || '').trim();
  if (!q) return {};

  const ref = q.replace(/^#/, '').trim();
  if (/^\d+$/.test(ref)) {
    return { id: Number(ref) };
  }

  return {
    OR: [
      { customer_name: { contains: q, mode: 'insensitive' } },
      { transaction_id: { contains: q, mode: 'insensitive' } },
      { customer: { name: { contains: q, mode: 'insensitive' } } },
      { walkInCustomer: { first_name: { contains: q, mode: 'insensitive' } } },
      { walkInCustomer: { last_name: { contains: q, mode: 'insensitive' } } },
    ],
  };
};

const getOrders = async ({ page = 1, limit = 20, branchId, status, type, customerId, search }) => {
  const skip = (page - 1) * limit;

  const where = {
    ...(branchId && { branchId: Number(branchId) }),
    ...(status && { status }),
    ...(type && { type }),
    ...(customerId && { customerId: String(customerId) }),
    ...buildOrderSearchFilter(search),
  };

  const [data, total] = await sequentialOnHttp([
    () =>
      prisma.order.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          payment_status: true,
          payment_screenshot: true,
          total: true,
          createdAt: true,
          type: true,
          payment_method: true,
          transaction_id: true,
          tracking_id: true,
          customer_name: true,
          customer_phone: true,
          customer: {
            select: { id: true, name: true, email: true },
          },
          walkInCustomer: {
            select: { id: true, first_name: true, last_name: true, phone: true, cnic: true },
          },
          branch: { select: { id: true, name: true } },
          items: {
            select: {
              quantity: true,
              price: true,
              product: { select: { name: true, product_type: true } },
            },
          },
        },
      }),
    () => prisma.order.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

const countOrders = (where) => prisma.order.count({ where });

const getOrderById = (id) => prisma.order.findUnique({ 
  where: { id }, 
  select: {
    id: true,
    status: true,
    payment_status: true,
    payment_screenshot: true,
    transaction_id: true,
    tracking_id: true,
    total: true,
    createdAt: true,
    branch: { 
      select: { 
        id: true, 
        name: true, 
        phone: true, 
        whatsapp: true, 
        location: true,
        banks: {
          select: { name: true, account_number: true, account_title: true },
          take: 1
        }
      } 
    },
    customer: { select: { id: true, name: true, email: true } },
    items: {
      select: {
        quantity: true,
        price: true,
        product: { select: { name: true, price: true } }
      }
    }
  }
});

const updateOrder = (id, data) => prisma.order.update({ 
  where: { id }, 
  data,
  select: { id: true, status: true, payment_status: true, tracking_id: true }
});

module.exports = { createOrder, getOrders, countOrders, getOrderById, updateOrder };
