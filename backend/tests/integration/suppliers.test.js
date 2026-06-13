const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const Supplier = require('../../src/modules/suppliers/supplier.model');
const { tag, created, getBranch, cleanup } = require('../helpers/testContext');

describe('Suppliers (HTTP-safe)', () => {
  after(async () => {
    await cleanup();
  });

  it('creates supplier with ledger account', async () => {
    const branch = await getBranch();
    const label = tag();

    const supplier = await Supplier.createSupplier({
      name: `Supplier ${label}`,
      contact: '03001112233',
      branchId: branch.id,
    });

    created.supplierIds.push(supplier.id);
    assert.ok(supplier.id);
    assert.ok(supplier.account?.id || supplier.accountId);
  });

  it('lists suppliers with pagination meta', async () => {
    const result = await Supplier.getAllSuppliers({ page: 1, limit: 10 });
    assert.ok(Array.isArray(result.data));
    assert.ok(result.meta.total >= 0);
    assert.equal(result.meta.page, 1);
  });

  it('updates supplier name and contact', async () => {
    const branch = await getBranch();
    const label = tag();
    const supplier = await Supplier.createSupplier({
      name: `Upd ${label}`,
      contact: '03003334455',
      branchId: branch.id,
    });
    created.supplierIds.push(supplier.id);

    const updated = await Supplier.updateSupplier(supplier.id, {
      name: `Updated ${label}`,
      contact: '03005556677',
    });
    assert.equal(updated.name, `Updated ${label}`);
    assert.equal(updated.contact, '03005556677');
  });
});
