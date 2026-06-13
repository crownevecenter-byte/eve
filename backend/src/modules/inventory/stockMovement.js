// backend/src/modules/inventory/stockMovement.js
const { syncInventoryToPartsAndProducts, incrementInventoryStock } = require('./inventory.utils');

const normalizeStockItems = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      productId: String(item.productId || item.id),
      quantity: Number(item.quantity || item.qty),
    }))
    .filter((item) => item.productId && item.quantity > 0);

/** HTTP-safe atomic stock deduct — updateMany triggers internal tx on PrismaNeonHTTP */
const deductProductStockAtomic = async (tx, productId, qty) => {
  const rows = await tx.$executeRaw`
    UPDATE "Product"
    SET "stock_qty" = "stock_qty" - ${qty}
    WHERE "id" = ${productId} AND "stock_qty" >= ${qty}
  `;
  if (rows === 0) {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { name: true },
    });
    if (!product) throw new Error('Product not found.');
    throw new Error(
      `Insufficient stock for product "${product.name}". Requested: ${qty}.`
    );
  }
};

const deductItemsStock = async (tx, branchId, items) => {
  const normalized = normalizeStockItems(items);
  if (normalized.length === 0) return;

  for (const item of normalized) {
    await deductProductStockAtomic(tx, item.productId, item.quantity);
  }

  for (const item of normalized) {
    const product = await tx.product.findUnique({
      where: { id: item.productId },
      include: { productParts: true },
    });

    if (!product?.productParts?.length) continue;

    for (const productPart of product.productParts) {
      const qtyToDeduct = productPart.quantity * item.quantity;
      const inv = await tx.inventory.findUnique({
        where: {
          branchId_partId: {
            branchId: Number(branchId),
            partId: Number(productPart.partId),
          },
        },
      });

      if (!inv) {
        throw new Error(
          `Part ID ${productPart.partId} has no inventory record at branch ${branchId}. ` +
            `Stock the part before using it in service.`
        );
      }

      if (inv.stock < qtyToDeduct) {
        throw new Error(
          `Insufficient part stock for "${product.name}". Required: ${qtyToDeduct}.`
        );
      }

      await tx.inventory.update({
        where: { id: inv.id },
        data: { stock: { decrement: qtyToDeduct } },
      });

      await syncInventoryToPartsAndProducts(tx, branchId, productPart.partId);
    }
  }
};

const restoreItemsStock = async (tx, branchId, items) => {
  const normalized = normalizeStockItems(items);
  if (normalized.length === 0) return;

  for (const item of normalized) {
    const product = await tx.product.findUnique({
      where: { id: item.productId },
      include: { productParts: true },
    });

    if (!product) continue;

    if (!product.productParts?.length) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock_qty: { increment: item.quantity } },
      });
      continue;
    }

    for (const productPart of product.productParts) {
      const qtyToRestore = productPart.quantity * item.quantity;
      await incrementInventoryStock(tx, {
        branchId,
        partId: productPart.partId,
        quantity: qtyToRestore,
      });

      await syncInventoryToPartsAndProducts(tx, branchId, productPart.partId);
    }
  }
};

module.exports = {
  normalizeStockItems,
  deductProductStockAtomic,
  deductItemsStock,
  restoreItemsStock,
};
