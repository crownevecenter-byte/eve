// backend/src/modules/purchases/purchase.model.js
const prisma = require('../../config/db');
const { sequentialOnHttp } = require('../../utils/sequentialOnHttp');
const { runInTransaction } = require('../../config/transaction');
const {
  syncInventoryToPartsAndProducts,
  incrementInventoryStock,
} = require('../inventory/inventory.utils');
const { postPurchaseInvoiceLedger } = require('../../services/ledger.service');

const getPurchases = async ({ page = 1, limit = 20, branchId, supplierId }) => {
  const skip = (page - 1) * limit;
  const where = {
    ...(branchId && { branchId: Number(branchId) }),
    ...(supplierId && { supplierId: Number(supplierId) }),
  };

  const [data, total] = await sequentialOnHttp([
    () =>
      prisma.purchase.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          supplier: true,
          branch: { select: { id: true, name: true } },
          items: { include: { part: true, product: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    () => prisma.purchase.count({ where }),
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

const applyPurchaseItemStock = async (tx, branchId, item) => {
  const qty = Number(item.quantity);
  const bId = Number(branchId);

  if (item.partId) {
    await incrementInventoryStock(tx, {
      branchId: bId,
      partId: item.partId,
      quantity: qty,
    });
    await syncInventoryToPartsAndProducts(tx, bId, item.partId);
    return;
  }

  if (!item.productId) return;

  const product = await tx.product.findUnique({
    where: { id: item.productId },
    include: { productParts: true },
  });

  if (product?.productParts?.length > 0) {
    for (const pp of product.productParts) {
      const addQty = qty * pp.quantity;
      await incrementInventoryStock(tx, {
        branchId: bId,
        partId: pp.partId,
        quantity: addQty,
      });
      await syncInventoryToPartsAndProducts(tx, bId, pp.partId);
    }
    return;
  }

  if (product) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock_qty: { increment: qty } },
    });
  }
};

const createPurchase = async (data) => {
  const { supplierId, branchId, total, items, remarks, documentNo, purchaseNo, partyInvoiceNo } = data;

  return runInTransaction(async (tx) => {
    const purchase = await tx.purchase.create({
      data: {
        supplierId: Number(supplierId),
        branchId: Number(branchId),
        total: Number(total),
        remarks,
        documentNo,
        purchaseNo,
        partyInvoiceNo,
      },
    });

    for (const item of items) {
      await tx.purchaseItem.create({
        data: {
          purchaseId: purchase.id,
          partId: item.partId ? Number(item.partId) : undefined,
          productId: item.productId || undefined,
          quantity: Number(item.quantity),
          cost: Number(item.cost),
          engineNo: item.engineNo || undefined,
          chassisNo: item.chassisNo || undefined,
          stockType: item.stockType || 'New',
        },
      });

      await applyPurchaseItemStock(tx, branchId, item);
    }

    await postPurchaseInvoiceLedger(tx, {
      branchId,
      purchaseId: purchase.id,
      total: Number(total),
      supplierId: Number(supplierId),
    });

    return tx.purchase.findUnique({
      where: { id: purchase.id },
      include: {
        supplier: true,
        branch: { select: { id: true, name: true } },
        items: { include: { part: true, product: true } },
      },
    });
  }, {
    timeout: 30000,
  });
};

module.exports = { getPurchases, createPurchase };
