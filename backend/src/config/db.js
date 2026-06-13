// Singleton PrismaClient — Neon HTTP driver for Hostinger (blocks WebSocket + TCP 5432).

const { PrismaClient } = require('@prisma/client');

const globalForPrisma = global;

const sanitizeUrl = (raw) => {
  if (!raw) return raw;
  // channel_binding breaks many shared hosts (Hostinger) — Neon works with sslmode=require only.
  return raw
    .replace(/([?&])channel_binding=[^&]*&?/gi, '$1')
    .replace(/[?&]$/, '')
    .replace(/\?&/, '?');
};

const buildUrl = (raw, { forHttpAdapter = false } = {}) => {
  const cleaned = sanitizeUrl(raw);
  if (!cleaned) return cleaned;
  if (cleaned.includes('connection_limit')) return cleaned;
  const sep = cleaned.includes('?') ? '&' : '?';
  // HTTP adapter: one logical connection; native pool: small limit for shared hosting.
  const params = forHttpAdapter
    ? ['connect_timeout=15']
    : ['connection_limit=5', 'connect_timeout=15'];
  return `${cleaned}${sep}${params.join('&')}`;
};

const shouldUseNeonAdapter = () => {
  if (process.env.PRISMA_NEON_ADAPTER === '0') return false;
  if (process.env.PRISMA_NEON_ADAPTER === '1') return true;
  const url = `${process.env.DATABASE_URL || ''}${process.env.DIRECT_URL || ''}`;
  return url.includes('neon.tech');
};

/**
 * Hostinger blocks WebSocket (non-101). Default Neon driver = HTTP (fetch).
 * HTTP cannot use prisma.$transaction — use runInTransaction() in config/transaction.js.
 * Set PRISMA_NEON_HTTP=0 to try Pool+WebSocket if your host allows it.
 */
const shouldUseNeonHttpAdapter = () => {
  if (process.env.PRISMA_NEON_HTTP === '0') return false;
  return true;
};

let activeAdapterMode = 'native';

function createPrismaClient() {
  const pooledUrl = buildUrl(process.env.DATABASE_URL, {
    forHttpAdapter: shouldUseNeonHttpAdapter(),
  });
  const directUrl = buildUrl(process.env.DIRECT_URL || process.env.DATABASE_URL);

  if (!pooledUrl && !directUrl) {
    console.error('\x1b[31m%s\x1b[0m', 'CRITICAL: DATABASE_URL is not set.');
    return new PrismaClient();
  }

  if (pooledUrl?.includes('neon.tech') && !pooledUrl.includes('pooler')) {
    console.warn(
      '[db] Use Neon pooled DATABASE_URL (*-pooler.neon.tech) on Hostinger to avoid 503/timeouts.'
    );
  }

  if (shouldUseNeonAdapter() && pooledUrl) {
    if (shouldUseNeonHttpAdapter()) {
      activeAdapterMode = 'http';
      console.log('[db] PrismaNeonHTTP (HTTPS fetch — Hostinger-safe, no WebSocket)');
      const { PrismaNeonHTTP } = require('@prisma/adapter-neon');
      const adapter = new PrismaNeonHTTP(pooledUrl);
      const httpClient = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      });
      httpClient.__adapterMode = 'http';
      return httpClient;
    }

    activeAdapterMode = 'pool';
    console.log('[db] PrismaNeon Pool (WebSocket — omit PRISMA_NEON_HTTP=0 on Hostinger if you see non-101 errors)');
    const { neonConfig } = require('@neondatabase/serverless');
    neonConfig.poolQueryViaFetch = true;
    neonConfig.useSecureWebSocket = false;
    neonConfig.pipelineTLS = false;
    neonConfig.pipelineConnect = false;

    const { PrismaNeon } = require('@prisma/adapter-neon');
    const adapter = new PrismaNeon({ connectionString: pooledUrl });
    const poolClient = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
    poolClient.__adapterMode = 'pool';
    return poolClient;
  }

  activeAdapterMode = 'native';
  console.log('[db] Using native Prisma engine');
  const nativeClient = new PrismaClient({
    datasources: {
      db: { url: directUrl },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
  nativeClient.__adapterMode = 'native';
  return nativeClient;
}

const resolveAdapterMode = (prismaClient) => {
  if (prismaClient?.__adapterMode === 'http') return 'http';
  if (globalForPrisma.prismaAdapterMode === 'http') return 'http';
  // Env wins over stale 'native'/'pool' tags on cached HTTP clients (Hostinger hot reload)
  if (shouldUseNeonAdapter() && shouldUseNeonHttpAdapter()) return 'http';
  if (prismaClient?.__adapterMode) return prismaClient.__adapterMode;
  if (globalForPrisma.prismaAdapterMode) return globalForPrisma.prismaAdapterMode;
  return activeAdapterMode;
};

/** Neon HTTP rejects prisma.$transaction — run callbacks on the shared client instead. */
const patchHttpTransactionShim = (prismaClient) => {
  if (prismaClient.__httpShimApplied) return;
  prismaClient.__httpShimApplied = true;

  prismaClient.$transaction = async (arg) => {
    if (typeof arg === 'function') {
      return arg(prismaClient);
    }
    if (Array.isArray(arg)) {
      if (activeAdapterMode === 'http') {
        const results = [];
        for (const task of arg) {
          results.push(await (typeof task === 'function' ? task() : task));
        }
        return results;
      }
      return Promise.all(arg);
    }
    throw new Error('Unsupported prisma.$transaction usage in HTTP mode.');
  };
  console.log('[db] HTTP transaction shim active (sequential writes, no rollback)');
};

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createPrismaClient();
  globalForPrisma.prismaAdapterMode = activeAdapterMode;
}

const client = globalForPrisma.prisma;
activeAdapterMode = resolveAdapterMode(client);
globalForPrisma.prismaAdapterMode = activeAdapterMode;
client.__adapterMode = activeAdapterMode;

// Always re-apply shim for HTTP clients (survives hot reload + stale mode flags)
if (activeAdapterMode === 'http') {
  patchHttpTransactionShim(client);
}

const supportsInteractiveTransactions = () => resolveAdapterMode(client) !== 'http';
const getAdapterMode = () => resolveAdapterMode(client);

module.exports = client;
module.exports.supportsInteractiveTransactions = supportsInteractiveTransactions;
module.exports.getAdapterMode = getAdapterMode;
