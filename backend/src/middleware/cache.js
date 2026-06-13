const NodeCache = require('node-cache');
const cacheStore = new NodeCache({ useClones: false });
const inFlight = new Map();

const SKIP_PREFIXES = [
  '/api/auth',
  '/api/vouchers',
  '/api/accounts',
];

/** Short-lived cache for frequently-hit list endpoints (orders/purchases change often). */
const SHORT_TTL_PREFIXES = ['/api/orders', '/api/purchases'];
const SHORT_TTL_SECONDS = 45;

// Routes that are safe to cache even with auth (read-only aggregate data)
const AUTH_CACHEABLE = [
  '/api/reports',
  '/api/branches',
  '/api/inventory',
  '/api/products',
  '/api/categories',
  '/api/brands',
  '/api/services',
  '/api/testimonials',
  '/api/users',
  '/api/parts',
  '/api/appointments',
  '/api/banks',
  '/api/suppliers',
  '/api/walk-in-customers',
  '/api/orders',
  '/api/purchases',
];

const ttlForUrl = (url, defaultTtl) =>
  SHORT_TTL_PREFIXES.some((p) => url.startsWith(p)) ? SHORT_TTL_SECONDS : defaultTtl;

const shouldSkipCache = (url) => SKIP_PREFIXES.some((p) => url.startsWith(p));

const isAuthCacheable = (url) => AUTH_CACHEABLE.some((p) => url.startsWith(p));

const getToken = (req) => {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7, 40) : ''; // partial token = user identity
};

const cacheGet = (ttlSeconds = 300) => (req, res, next) => {
  if (req.method !== 'GET') return next();
  if (shouldSkipCache(req.originalUrl)) return next();

  const hasAuth = !!(req.headers.authorization);

  // Public routes: cache globally
  // Auth routes: cache per-user (using partial token as key)
  if (hasAuth && !isAuthCacheable(req.originalUrl)) return next();

  const userKey = hasAuth ? getToken(req) : 'public';
  const key = `${userKey}:${req.originalUrl}`;

  const hit = cacheStore.get(key);
  if (hit !== undefined) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(hit);
  }

  // Stampede protection
  if (inFlight.has(key)) {
    inFlight.get(key).push(res);
    return;
  }
  inFlight.set(key, []);

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cacheStore.set(key, body, ttlForUrl(req.originalUrl, ttlSeconds));
      const waiters = inFlight.get(key) || [];
      inFlight.delete(key);
      for (const w of waiters) w.json(body);
    } else {
      inFlight.delete(key);
    }
    res.setHeader('X-Cache', 'MISS');
    return originalJson(body);
  };
  next();
};

// Call this after any write operation to clear stale cache
const invalidateCache = (prefix) => {
  const keys = cacheStore.keys().filter((k) => k.includes(prefix));
  keys.forEach((k) => cacheStore.del(k));
};

/** Clear all auth-cacheable GET entries (e.g. after branch CRUD). */
const invalidateCatalogCache = () => {
  AUTH_CACHEABLE.forEach((p) => invalidateCache(p));
};

/** Clear matching cache after successful mutations (not auth/login). */
const invalidateCacheOnWrite = (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }
  if (req.originalUrl.startsWith('/api/auth')) {
    return next();
  }

  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      const path = req.originalUrl.split('?')[0];
      invalidateCache(path);
    }
  });
  next();
};

module.exports = { cacheGet, invalidateCache, invalidateCatalogCache, invalidateCacheOnWrite };
