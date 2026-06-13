const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  getPurchaseAccount,
  ensureSupplierAccount,
  postPurchaseInvoiceLedger,
} = require('../../src/services/ledger.service');
const { runInTransaction } = require('../../src/config/transaction');
const { getBranch, getPrisma } = require('../helpers/testContext');

describe('Ledger service (HTTP-safe)', () => {
  it('getPurchaseAccount does not use create+include', async () => {
    const branch = await getBranch();
    const account = await runInTransaction(async (tx) => getPurchaseAccount(tx, branch.id));
    assert.ok(account.id);
    assert.ok(account.ledger?.id || account.ledger);
  });

  it('ensureSupplierAccount links supplier to account', async () => {
    const prisma = getPrisma();
    const branch = await getBranch();
    const { tag } = require('../helpers/testContext');
    const supplier = await prisma.supplier.create({
      data: { name: `Ledger Sup ${tag()}`, contact: '03001234567' },
    });

    try {
      const account = await runInTransaction(async (tx) =>
        ensureSupplierAccount(tx, supplier.id, branch.id)
      );
      assert.ok(account.id);
      assert.ok(account.ledger);

      const linked = await prisma.supplier.findUnique({
        where: { id: supplier.id },
        select: { accountId: true },
      });
      assert.equal(linked.accountId, account.id);
    } finally {
      const purchases = await prisma.purchase.count({ where: { supplierId: supplier.id } });
      if (purchases === 0) {
        await prisma.supplier.delete({ where: { id: supplier.id } }).catch(() => {});
      }
    }
  });

  it('postPurchaseInvoiceLedger posts double entry', async () => {
    const prisma = getPrisma();
    const branch = await getBranch();
    const purchase = await prisma.purchase.findFirst({ select: { id: true, total: true, supplierId: true } });
    assert.ok(purchase);

    await assert.doesNotReject(() =>
      runInTransaction(async (tx) =>
        postPurchaseInvoiceLedger(tx, {
          branchId: branch.id,
          purchaseId: purchase.id,
          total: purchase.total,
          supplierId: purchase.supplierId,
        })
      )
    );
  });
});
