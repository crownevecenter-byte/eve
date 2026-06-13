const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getPrisma, getBranch } = require('../helpers/testContext');

const isHttp = () => require('../../src/config/db').getAdapterMode() === 'http';

describe('PrismaNeonHTTP unsafe write patterns', () => {
  it('create+include throws on HTTP', async (t) => {
    if (!isHttp()) {
      t.skip('Only enforced on HTTP adapter');
      return;
    }
    const prisma = getPrisma();
    const branch = await getBranch();
    const cat = await prisma.accountCategory.findFirst({ where: { branchId: branch.id } });
    assert.ok(cat);

    await assert.rejects(
      () =>
        prisma.account.create({
          data: {
            categoryId: cat.id,
            account_name: `unsafe-include-${Date.now()}`,
            branchId: branch.id,
            opening_balance: 0,
            current_balance: 0,
            status: 'ACTIVE',
          },
          include: { category: true },
        }),
      /not supported in HTTP/i
    );
  });

  it('update+include throws on HTTP', async (t) => {
    if (!isHttp()) {
      t.skip('Only enforced on HTTP adapter');
      return;
    }
    const prisma = getPrisma();
    const supplier = await prisma.supplier.findFirst();
    assert.ok(supplier);

    await assert.rejects(
      () =>
        prisma.supplier.update({
          where: { id: supplier.id },
          data: { name: supplier.name },
          include: { account: true },
        }),
      /not supported in HTTP/i
    );
  });

  it('updateMany throws on HTTP', async (t) => {
    if (!isHttp()) {
      t.skip('Only enforced on HTTP adapter');
      return;
    }
    const prisma = getPrisma();
    const user = await prisma.user.findFirst();
    assert.ok(user);

    await assert.rejects(
      () => prisma.user.updateMany({ where: { id: user.id }, data: { name: user.name } }),
      /not supported in HTTP/i
    );
  });
});
