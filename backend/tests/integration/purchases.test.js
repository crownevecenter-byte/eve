const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const Purchase = require('../../src/modules/purchases/purchase.model');
const Supplier = require('../../src/modules/suppliers/supplier.model');
const { tag, created, getBranch, getPrisma, cleanup } = require('../helpers/testContext');

describe('Purchases (HTTP-safe)', () => {
  after(async () => {
    await cleanup();
  });

  it('GET purchases returns data + meta', async () => {
    const result = await Purchase.getPurchases({ page: 1, limit: 5 });
    assert.ok(Array.isArray(result.data));
    assert.ok(result.meta.total >= 0);
  });

  it('creates purchase without HTTP transaction error', async () => {
    const prisma = getPrisma();
    const branch = await getBranch();
    const label = tag();

    const supplier = await Supplier.createSupplier({
      name: `Pur Sup ${label}`,
      contact: '03006667788',
      branchId: branch.id,
    });
    created.supplierIds.push(supplier.id);

    const product = await prisma.product.findFirst({
      where: { branchId: branch.id, stock_qty: { gte: 0 } },
      select: { id: true, price: true },
    });
    assert.ok(product, 'Need at least one branch product for purchase test');

    const purchase = await Purchase.createPurchase({
      supplierId: supplier.id,
      branchId: branch.id,
      total: 250,
      items: [{ productId: product.id, quantity: 1, cost: 250 }],
      remarks: `Test purchase ${label}`,
    });

    created.purchaseIds.push(purchase.id);
    assert.ok(purchase.id);
    assert.equal(purchase.supplierId, supplier.id);
    assert.ok(purchase.items?.length >= 1);
  });
});
