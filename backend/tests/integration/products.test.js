const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const Product = require('../../src/modules/products/product.model');
const { tag, created, getBranch, cleanup } = require('../helpers/testContext');

describe('Products (HTTP-safe nested writes)', () => {
  after(async () => {
    await cleanup();
  });

  it('creates part product with partDetail', async () => {
    const branch = await getBranch();
    const label = tag();

    const product = await Product.createProduct({
      name: `Part ${label}`,
      slug: `part-${label}`,
      product_type: 'part',
      price: 1500,
      stock_qty: 3,
      branchId: branch.id,
      is_active: true,
      partDetail: { create: { item_code: `CODE-${label}`, model: 'Test Model' } },
    });

    created.productIds.push(product.id);
    assert.equal(product.product_type, 'part');
    assert.ok(product.partDetail?.item_code);
  });

  it('updates product with upsert partDetail (no nested upsert)', async () => {
    const branch = await getBranch();
    const label = tag();

    const product = await Product.createProduct({
      name: `PartUpd ${label}`,
      slug: `part-upd-${label}`,
      product_type: 'part',
      price: 900,
      stock_qty: 2,
      branchId: branch.id,
      is_active: true,
      partDetail: { create: { item_code: `OLD-${label}`, model: 'Old' } },
    });
    created.productIds.push(product.id);

    const updated = await Product.updateProduct(product.id, {
      price: 950,
      partDetail: {
        upsert: {
          create: { item_code: `NEW-${label}`, model: 'New' },
          update: { item_code: `NEW-${label}`, model: 'New' },
        },
      },
    });

    assert.equal(updated.price, 950);
    assert.equal(updated.partDetail.model, 'New');
  });

  it('getProducts returns paginated list', async () => {
    const branch = await getBranch();
    const result = await Product.getProducts({ branchId: branch.id, page: 1, limit: 5, lite: '1' });
    assert.ok(Array.isArray(result.data));
    assert.ok(result.meta.total >= 0);
  });
});
