/**
 * Simulates a busy portal session and reports API concurrency peaks.
 * Run: node scripts/process-load-sim.js
 *
 * Estimates Hostinger process pressure:
 *   estimatedPeak ≈ peakConcurrentHandlers × avgDbRoundTripsPerHandler
 */
const dbConcurrency = require('../src/middleware/dbConcurrency');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Typical DB round-trips per bundle endpoint on Neon HTTP (from code audit). */
const ENDPOINT_DB_COST = {
  ownerDashboard: 8,
  ownerReports: 8,
  branchDashboard: 7,
  branchProducts: 5,
  branchInventory: 6,
  posVoucher: 4,
  ordersList: 2,
  authMe: 1,
};

const simulateUserSession = async (label, endpoints, handlerMs = 120) => {
  const releaseFns = [];
  const req = { path: '/sim' };
  const res = {
    on(event, fn) {
      if (event === 'finish') releaseFns.push(fn);
    },
  };

  dbConcurrency.resetStats();
  const jobs = endpoints.map(async (ep) => {
    await new Promise((resolve) => dbConcurrency(req, res, resolve));
    await sleep(handlerMs);
    const done = releaseFns.pop();
    if (done) done();
  });

  await Promise.all(jobs);
  const stats = dbConcurrency.getStats();
  const dbCost = endpoints.reduce((sum, k) => sum + (ENDPOINT_DB_COST[k] || 2), 0);

  return { label, ...stats, dbCost, estimatedProcesses: stats.peakActive * Math.ceil(dbCost / endpoints.length) };
};

const run = async () => {
  console.log('=== Crown Eve Process Load Simulation ===\n');
  console.log(`Server MAX_DB_CONCURRENT = ${dbConcurrency.MAX_CONCURRENT}\n`);

  const scenarios = [
    {
      label: '1 owner browsing dashboard + reports',
      endpoints: ['authMe', 'ownerDashboard', 'ownerReports'],
    },
    {
      label: '2 branch staff (dashboard + products + inventory)',
      endpoints: [
        'authMe', 'branchDashboard', 'branchProducts',
        'authMe', 'branchDashboard', 'branchInventory',
      ],
    },
    {
      label: '3 users heavy (owner + branch POS + orders)',
      endpoints: [
        'authMe', 'ownerDashboard', 'ownerReports',
        'authMe', 'branchDashboard', 'posVoucher',
        'authMe', 'ordersList', 'branchProducts',
      ],
    },
    {
      label: '5 concurrent users (stress)',
      endpoints: Array.from({ length: 5 }, () => ['authMe', 'branchDashboard', 'branchProducts']).flat(),
    },
  ];

  let worstEstimate = 0;

  for (const scenario of scenarios) {
    const result = await simulateUserSession(scenario.label, scenario.endpoints, 80);
    worstEstimate = Math.max(worstEstimate, result.estimatedProcesses);
    console.log(`Scenario: ${result.label}`);
    console.log(`  Peak concurrent handlers: ${result.peakActive} / ${result.maxConcurrent}`);
    console.log(`  Queued at peak:           ${result.queued}`);
    console.log(`  Total DB round-trips:     ${result.dbCost}`);
    console.log(`  Est. process peak:        ~${result.estimatedProcesses}`);
    console.log('');
  }

  const target = 70;
  const status = worstEstimate <= target ? 'PASS' : 'WARN';
  console.log('=== Summary ===');
  console.log(`Worst estimated process peak: ~${worstEstimate}`);
  console.log(`Target (stay under):          ${target}`);
  console.log(`Result:                       ${status}`);
  if (worstEstimate > target) {
    console.log('\nTip: set MAX_DB_CONCURRENT=2 on Hostinger or reduce simultaneous users.');
  }
  process.exit(status === 'PASS' ? 0 : 1);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
