const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const { runInTransaction } = require('../../src/config/transaction');
const { tag, created, getBranch, getPrisma, cleanup } = require('../helpers/testContext');

describe('Walk-in customers (HTTP-safe)', () => {
  after(async () => {
    await cleanup();
  });

  it('creates walk-in with account + ledger (no create+include)', async () => {
    const branch = await getBranch();
    const label = tag();

    const customer = await runInTransaction(async (tx) => {
      const cust = await tx.walkInCustomer.create({
        data: {
          first_name: 'Test',
          last_name: label,
          phone: `03${String(Date.now()).slice(-9)}`,
          cnic: `35202-${String(Date.now()).slice(-7)}-${Math.floor(Math.random() * 9)}`,
          address: 'Test Address',
          branchId: branch.id,
        },
      });

      let cat = await tx.accountCategory.findFirst({
        where: { name: 'WALK-IN CUSTOMER', branchId: branch.id },
      });
      if (!cat) {
        cat = await tx.accountCategory.create({
          data: {
            name: 'WALK-IN CUSTOMER',
            description: 'Walk-in customer receivable accounts',
            branchId: branch.id,
          },
        });
      }

      const acc = await tx.account.create({
        data: {
          categoryId: cat.id,
          account_name: `Test ${label} (${cust.phone})`,
          current_balance: 0,
          branchId: branch.id,
        },
      });
      await tx.ledger.create({
        data: { accountId: acc.id, ledger_name: `Test ${label} - Ledger` },
      });

      return tx.walkInCustomer.update({
        where: { id: cust.id },
        data: { accountId: acc.id },
      });
    });

    created.walkInIds.push(customer.id);
    assert.ok(customer.id);
    assert.ok(customer.accountId);
  });
});
