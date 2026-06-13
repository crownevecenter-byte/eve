const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const dbConcurrency = require('../../src/middleware/dbConcurrency');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const runThroughMiddleware = () =>
  new Promise((resolve) => {
    const releaseFns = [];
    const req = { path: '/test' };
    const res = {
      on(event, fn) {
        if (event === 'finish') releaseFns.push(fn);
      },
    };
    dbConcurrency(req, res, () => {
      resolve(() => releaseFns.forEach((fn) => fn()));
    });
  });

describe('dbConcurrency', () => {
  beforeEach(() => {
    dbConcurrency.resetStats();
  });

  it('allows up to MAX_CONCURRENT active handlers', async () => {
    const max = dbConcurrency.MAX_CONCURRENT;
    const releases = await Promise.all(Array.from({ length: max }, () => runThroughMiddleware()));

    assert.strictEqual(dbConcurrency.getStats().active, max);
    assert.strictEqual(dbConcurrency.getStats().peakActive, max);

    releases.forEach((release) => release());
    await sleep(20);
    assert.strictEqual(dbConcurrency.getStats().active, 0);
  });

  it('holds extra requests in queue until a slot frees', async () => {
    const max = dbConcurrency.MAX_CONCURRENT;
    const first = await Promise.all(Array.from({ length: max }, () => runThroughMiddleware()));
    const extra = runThroughMiddleware();

    await sleep(30);
    assert.strictEqual(dbConcurrency.getStats().active, max);
    assert.ok(dbConcurrency.getStats().queued >= 1);

    first.forEach((release) => release());
    const releaseExtra = await extra;
    releaseExtra();
    await sleep(20);
    assert.strictEqual(dbConcurrency.getStats().active, 0);
  });
});
