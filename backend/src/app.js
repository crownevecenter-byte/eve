// backend/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { cacheGet, invalidateCacheOnWrite } = require('./middleware/cache');
const dbConcurrency = require('./middleware/dbConcurrency');

const app = express();

// Hostinger reverse proxy: trust only the first hop (not all proxies).
app.set('trust proxy', 1);

const isProduction = process.env.NODE_ENV === 'production';

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
  })
);

const corsOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://crown-eve-center.vercel.app',
  'https://crown-eve-center-298d.vercel.app',
  'https://crownevcenter.com',
  'https://www.crownevcenter.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (corsOrigins.includes(origin)) return true;
  if (/^https:\/\/([\w-]+\.)?crownevcenter\.com$/.test(origin)) return true;
  if (!isProduction && /^http:\/\/localhost:\d+$/.test(origin)) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, origin || true);
        return;
      }
      if (origin && !isProduction) {
        console.warn('[cors] Blocked origin:', origin);
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control'],
    optionsSuccessStatus: 204,
    maxAge: 86400,
  })
);

// Ensure CORS headers on error/rate-limit responses (some proxies strip them).
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  next();
});
app.use(compression());
app.use(express.json({ limit: '2mb' }));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON in request body.' });
  }
  next(err);
});

app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  next();
});
app.use('/api', cacheGet(600));
app.use('/api', dbConcurrency);
app.use('/api', invalidateCacheOnWrite);

const authRoutes = require('./modules/auth/auth.routes');
const branchRoutes = require('./modules/branches/branch.routes');
const productRoutes = require('./modules/products/product.routes');
const userRoutes = require('./modules/users/user.routes');
const partRoutes = require('./modules/parts/part.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const orderRoutes = require('./modules/orders/order.routes');
const serviceRoutes = require('./modules/services/service.routes');
const bookingRoutes = require('./modules/service-bookings/booking.routes');
const supplierRoutes = require('./modules/suppliers/supplier.routes');
const purchaseRoutes = require('./modules/purchases/purchase.routes');
const reportRoutes = require('./modules/reports/report.routes');
const categoryRoutes = require('./modules/categories/category.routes');
const brandRoutes = require('./modules/brands/brand.routes');
const uploadRoutes = require('./modules/uploads/upload.routes');
const serviceCategoryRoutes = require('./modules/service-categories/service-category.routes');
const testimonialRoutes = require('./modules/testimonials/testimonials.routes');
const walkInRoutes = require('./modules/walk-in-customers/walk-in.routes');
const bankInfoRoutes = require('./modules/banks/bank.routes');
const accountRoutes = require('./modules/accounts/account.routes');
const voucherRoutes = require('./modules/vouchers/voucher.routes');

app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/parts', partRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/services', serviceRoutes);
// Customer UI uses /bookings; branch/POS uses /appointments — same router (alias).
app.use('/api/bookings', bookingRoutes);
app.use('/api/appointments', bookingRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/service-categories', serviceCategoryRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/walk-in-customers', walkInRoutes);
app.use('/api/banks', bankInfoRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/vouchers', voucherRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Crown Eve Management System API',
    version: '1.0.0',
    status: 'Operational',
  });
});

/** Instant response for nginx/Hostinger — never touches the database. */
app.get('/health/live', (req, res) => {
  res.status(200).json({
    status: 'OK',
    alive: true,
    timestamp: new Date().toISOString(),
    node: process.version,
  });
});

const HEALTH_DB_MS = Number(process.env.HEALTH_DB_TIMEOUT_MS) || 15000;

app.get('/health', async (req, res) => {
  const payload = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    node: process.version,
  };

  const dbCheck = Promise.race([
    (async () => {
      const prisma = require('./config/db');
      await prisma.$queryRaw`SELECT 1`;
      return 'connected';
    })(),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Database probe timed out after ${HEALTH_DB_MS}ms`)), HEALTH_DB_MS);
    }),
  ]);

  try {
    payload.db = await dbCheck;
    return res.status(200).json(payload);
  } catch (err) {
    payload.status = 'DEGRADED';
    payload.db = 'disconnected';
    payload.error = process.env.NODE_ENV === 'production' ? 'Database unreachable' : err.message;
    return res.status(503).json(payload);
  }
});

if (!isProduction) {
  app.get('/api/debug-env', (req, res) => {
    res.status(200).json({
      db: process.env.DATABASE_URL ? 'Set' : 'Missing',
      jwt: process.env.JWT_SECRET ? 'Set' : 'Missing',
      port: process.env.PORT || 'Missing',
      node_env: process.env.NODE_ENV,
    });
  });
}

const logger = require('./config/logger');

app.use((err, req, res, next) => {
  logger.error('Unhandled Error', { message: err.message, stack: err.stack });

  if (isProduction) {
    return res.status(500).json({ message: 'Something went wrong!' });
  }

  res.status(500).json({
    message: 'Something went wrong!',
    error: err.message,
    stack: err.stack,
  });
});

module.exports = app;
