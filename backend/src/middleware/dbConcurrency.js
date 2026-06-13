/**
 * Limits simultaneous in-flight /api handlers on shared hosting (Hostinger process cap).
 * Queued requests wait instead of spawning unlimited concurrent Neon/Node work.
 */
const MAX_CONCURRENT = Math.max(1, Number(process.env.MAX_DB_CONCURRENT) || 3);

let active = 0;
let peakActive = 0;
let totalAcquired = 0;
const waitQueue = [];

const acquire = () =>
  new Promise((resolve) => {
    if (active < MAX_CONCURRENT) {
      active += 1;
      totalAcquired += 1;
      peakActive = Math.max(peakActive, active);
      resolve();
      return;
    }
    waitQueue.push(resolve);
  });

const release = () => {
  active = Math.max(0, active - 1);
  if (waitQueue.length > 0 && active < MAX_CONCURRENT) {
    active += 1;
    totalAcquired += 1;
    peakActive = Math.max(peakActive, active);
    const next = waitQueue.shift();
    next();
  }
};

const getConcurrencyStats = () => ({
  maxConcurrent: MAX_CONCURRENT,
  active,
  peakActive,
  queued: waitQueue.length,
  totalAcquired,
});

const resetConcurrencyStats = () => {
  peakActive = 0;
  totalAcquired = 0;
};

const dbConcurrency = (req, res, next) => {
  if (req.path === '/health') {
    return next();
  }

  acquire()
    .then(() => {
      let released = false;
      const done = () => {
        if (released) return;
        released = true;
        release();
      };
      res.on('finish', done);
      res.on('close', done);
      next();
    })
    .catch(next);
};

dbConcurrency.getStats = getConcurrencyStats;
dbConcurrency.resetStats = resetConcurrencyStats;
dbConcurrency.MAX_CONCURRENT = MAX_CONCURRENT;

module.exports = dbConcurrency;
