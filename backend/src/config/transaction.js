// HTTP-safe transaction helper for Hostinger + Neon.
const prisma = require('./db');
const { getAdapterMode } = require('./db');

const isHttpMode = () =>
  prisma.__httpShimApplied === true ||
  prisma.__adapterMode === 'http' ||
  getAdapterMode() === 'http';

/**
 * Runs `fn(tx)` inside prisma.$transaction when the driver supports it.
 * On PrismaNeonHTTP (Hostinger), runs against the shared client instead.
 */
const runInTransaction = async (fn, options = {}) => {
  if (!isHttpMode()) {
    try {
      return await prisma.$transaction((tx) => fn(tx, { interactive: true }), options);
    } catch (err) {
      // Mode flag was stale but driver is HTTP — fall back to sequential writes
      if (err?.message?.includes('not supported in HTTP')) {
        return await fn(prisma, { interactive: false });
      }
      throw err;
    }
  }

  return await fn(prisma, { interactive: false });
};

module.exports = { runInTransaction };
