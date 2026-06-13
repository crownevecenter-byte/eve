// backend/src/modules/inventory/inventory.utils.js
const prisma = require('../../config/db');

/**
 * Synchronizes Branch Product stock and Global Part stock whenever Inventory changes.
 * @param {object} tx - Prisma transaction client
 * @param {number} branchId - The branch where stock changed
 * @param {number} partId - The part that was updated
 */
const syncInventoryToPartsAndProducts = async (tx, branchId, partId) => {
  // 1. Find all products in this branch that use this part
  const affectedProducts = await tx.product.findMany({
    where: {
      branchId: Number(branchId),
      productParts: { some: { partId: Number(partId) } }
    },
    include: {
      productParts: {
        include: {
          part: {
            include: {
              inventory: {
                where: { branchId: Number(branchId) }
              }
            }
          }
        }
      }
    }
  });

  // 2. Recalculate and update stock_qty for each affected product
  // A product's stock is the minimum of (part_inventory / quantity_needed) for all its components
  for (const product of affectedProducts) {
    let minStock = Infinity;
    
    if (product.productParts.length === 0) continue;

    for (const pp of product.productParts) {
      const partStock = pp.part.inventory?.[0]?.stock || 0;
      const possibleQty = Math.floor(partStock / pp.quantity);
      if (possibleQty < minStock) minStock = possibleQty;
    }

    await tx.product.update({
      where: { id: product.id },
      data: { stock_qty: minStock === Infinity ? 0 : minStock }
    });
  }

  // 3. Update the global Part total stock (Sum of all branches)
  const allBranchStock = await tx.inventory.aggregate({
    where: { partId: Number(partId) },
    _sum: { stock: true }
  });

  await tx.part.update({
    where: { id: Number(partId) },
    data: { stock: allBranchStock._sum.stock || 0 }
  });
};

/** HTTP-safe inventory upsert — prisma upsert triggers internal tx on PrismaNeonHTTP */
const incrementInventoryStock = async (
  tx,
  { branchId, partId, quantity, alertAt = 10 }
) => {
  const bId = Number(branchId);
  const pId = Number(partId);
  const qty = Number(quantity);
  if (!qty) return null;

  const existing = await tx.inventory.findUnique({
    where: { branchId_partId: { branchId: bId, partId: pId } },
  });

  if (existing) {
    return tx.inventory.update({
      where: { id: existing.id },
      data: { stock: { increment: qty } },
    });
  }

  return tx.inventory.create({
    data: { branchId: bId, partId: pId, stock: qty, alertAt },
  });
};

module.exports = { syncInventoryToPartsAndProducts, incrementInventoryStock };
