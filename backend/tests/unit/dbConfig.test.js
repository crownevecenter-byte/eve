const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getPrisma } = require('../helpers/testContext');

describe('Database config', () => {
  it('connects to Neon and reports adapter mode', async () => {
    const prisma = getPrisma();
    const rows = await prisma.$queryRaw`SELECT 1 AS ok`;
    assert.equal(Number(rows[0].ok), 1);

    const mode = require('../../src/config/db').getAdapterMode();
    assert.ok(['http', 'pool', 'native'].includes(mode));
  });

  it('runInTransaction works on HTTP adapter', async () => {
    const { runInTransaction } = require('../../src/config/transaction');
    const prisma = getPrisma();

    const result = await runInTransaction(async (tx) => {
      assert.equal(typeof tx.branch.findFirst, 'function');
      return tx === prisma || typeof tx.$transaction === 'function';
    });

    assert.equal(result, true);
  });
});
