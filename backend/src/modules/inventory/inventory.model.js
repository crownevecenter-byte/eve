// backend/src/modules/inventory/inventory.model.js
const prisma = require('../../config/db');
const { sequentialOnHttp } = require('../../utils/sequentialOnHttp');
const { runInTransaction } = require('../../config/transaction');
const { syncInventoryToPartsAndProducts } = require('./inventory.utils');

const getBranchInventory = async ({ branchId, page = 1, limit = 20, type = "" }) => {
  // Bug 4 Fix: The old code applied skip/take to the parts query AND sliced the combined
  // [parts + bikes] array a second time, producing wrong results on every page beyond page 1.
  //
  // Correct approach:
  //   1. Count parts and bikes independently.
  //   2. Treat the page as a window [skip, skip+take) over the virtual combined list where
  //      parts occupy positions [0, partsTotal) and bikes follow at [partsTotal, total).
  //   3. Derive the exact sub-slice of each section that falls in the window, and only
  //      fetch those rows — no post-hoc array slice needed.
  const skip = (page - 1) * Number(limit);
  const take = Number(limit);
  const partWhere = { branchId: Number(branchId) };
  const bikeWhere = { branchId: Number(branchId), product_type: 'bike' };

  // Step 1: Count each section
  const [partsTotal, bikeTotal] = await sequentialOnHttp([
    () => (type === "" || type === "PART") ? prisma.inventory.count({ where: partWhere }) : Promise.resolve(0),
    () => (type === "" || type === "BIKE") ? prisma.product.count({ where: bikeWhere }) : Promise.resolve(0),
  ]);

  // Step 2: Calculate which rows of each section fall inside the requested page window.
  //
  //   Parts occupy virtual positions  [0,           partsTotal)
  //   Bikes occupy virtual positions  [partsTotal,  partsTotal + bikeTotal)
  //
  const partsSkip = Math.min(skip, partsTotal);
  const partsTake = Math.max(0, Math.min(partsTotal, skip + take) - partsSkip);

  const bikesSkip = Math.max(0, skip - partsTotal);
  const bikesTake = Math.max(0, Math.min(bikeTotal, skip + take - partsTotal) - bikesSkip);

  // Step 3: Fetch only the needed slices
  const [invData, bikes] = await sequentialOnHttp([
    () =>
      partsTake > 0
        ? prisma.inventory.findMany({
            where: partWhere,
            skip: partsSkip,
            take: partsTake,
            select: {
              id: true,
              stock: true,
              alertAt: true,
              part: {
                select: { id: true, name: true, category: true, price: true },
              },
            },
          })
        : Promise.resolve([]),
    () =>
      bikesTake > 0
        ? prisma.product.findMany({
            where: bikeWhere,
            skip: bikesSkip,
            take: bikesTake,
            select: {
              id: true,
              name: true,
              stock_qty: true,
            },
          })
        : Promise.resolve([]),
  ]);

  // Map bikes to the same shape as inventory records
  const bikeData = bikes.map(b => ({
    id: `bike_${b.id}`, // Virtual ID to distinguish from inventory records
    stock: b.stock_qty,
    alertAt: 2, // Default alert threshold for bikes
    isBike: true,
    part: {
      name: b.name,
      category: 'BIKE',
      id: b.id
    }
  }));

  // Parts come first in the combined list, bikes follow
  const combinedData = [...invData, ...bikeData];

  return {
    data: combinedData,
    meta: {
      total: partsTotal + bikeTotal,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil((partsTotal + bikeTotal) / take)
    }
  };
};

const updateStockById = async (id, data) => {
  // Check if it's a virtual bike ID
  if (typeof id === 'string' && id.startsWith('bike_')) {
    const productId = id.replace('bike_', '');
    return prisma.product.update({
      where: { id: productId },
      data: { stock_qty: Number(data.stock) },
      select: { id: true, stock_qty: true }
    }).then(p => ({ id: `bike_${p.id}`, stock: p.stock_qty }));
  }

  return runInTransaction(async (tx) => {
    // 1. Get current stock for adjustment calculation
    const currentInv = await tx.inventory.findUnique({
      where: { id: Number(id) },
      select: { stock: true, branchId: true, partId: true }
    });

    if (!currentInv) throw new Error("Inventory item not found");

    const nStock = Number(data.stock);
    const nAlert = Number(data.alertAt);
    const delta = nStock - currentInv.stock;

    // 2. Update the inventory stock
    const inventory = await tx.inventory.update({
      where: { id: Number(id) },
      data: {
        stock: nStock,
        alertAt: nAlert
      },
      select: { id: true, stock: true, alertAt: true, branchId: true, partId: true }
    });

    // 3. Log the adjustment if there was a change
    if (delta !== 0) {
      await tx.stockAdjustment.create({
        data: {
          branchId: inventory.branchId,
          partId: inventory.partId,
          quantity: delta,
          reason: "Manual Update"
        }
      });
    }

    // 4. Sync stocks to Parts and Products
    await syncInventoryToPartsAndProducts(tx, inventory.branchId, inventory.partId);

    return inventory;
  });
};

const getAlerts = (branchId, isGlobal = false) => {
  const where = isGlobal ? {} : { branchId: Number(branchId) };
  return prisma.inventory.findMany({
    where,
    select: {
      id: true,
      stock: true,
      alertAt: true,
      branch: { select: { name: true } },
      part: { select: { name: true } }
    }
  });
};

const getInventorySummary = async (branchId) => {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const bId = Number(branchId);

  // 1. Low Stock Count using Raw SQL for absolute precision
  // This avoids any issues with Prisma col-to-col comparison
  const lowStockResult = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count 
    FROM "Inventory" 
    WHERE "branchId" = ${bId} AND "stock" <= "alertAt"
  `;
  const lowStockCount = lowStockResult[0]?.count || 0;

  const [totalOutOrders, totalInPurchases, totalAdjustments] = await sequentialOnHttp([
    () =>
      prisma.orderItem.aggregate({
        where: { order: { branchId: bId } },
        _sum: { quantity: true },
      }),
    () =>
      prisma.purchaseItem.aggregate({
        where: { purchase: { branchId: bId } },
        _sum: { quantity: true },
      }),
    () =>
      prisma.stockAdjustment.aggregate({
        where: { branchId: bId },
        _sum: { quantity: true },
      }),
  ]);

  const totalOut = (totalOutOrders._sum.quantity || 0) + (totalAdjustments._sum.quantity < 0 ? Math.abs(totalAdjustments._sum.quantity) : 0);
  
  // To account for seeded products that don't have stock adjustment logs, we can calculate total in as:
  // Current Stock On Hand + Total Sold
  const currentStock = await prisma.inventory.aggregate({
    where: { branchId: bId },
    _sum: { stock: true }
  });
  
  // Total In = What we have now + What we already sold
  const totalIn = (currentStock._sum.stock || 0) + totalOut;

  return {
    lowStock: lowStockCount,
    weeklyOut: totalOut,
    weeklyIn: totalIn
  };
};

module.exports = { getBranchInventory, updateStockById, getAlerts, getInventorySummary };
