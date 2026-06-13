const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { incrementInventoryStock } = require('../../src/modules/inventory/inventory.utils');
const { getPrisma, getBranch } = require('../helpers/testContext');

describe('Inventory (HTTP-safe)', () => {
  it('incrementInventoryStock creates then increments without upsert', async () => {
    const prisma = getPrisma();
    const branch = await getBranch();
    const part = await prisma.part.findFirst({ select: { id: true } });
    assert.ok(part);

    const first = await incrementInventoryStock(prisma, {
      branchId: branch.id,
      partId: part.id,
      quantity: 1,
    });
    assert.ok(first);

    const second = await incrementInventoryStock(prisma, {
      branchId: branch.id,
      partId: part.id,
      quantity: 2,
    });
    assert.ok(second.stock >= first.stock);
  });
});
