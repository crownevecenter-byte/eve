// backend/src/server.js
const path = require('path');

// Hostinger often runs `node backend/src/server.js` from repo root (cwd = ./).
// Prisma and relative paths expect cwd to be the backend folder.
try {
  process.chdir(path.resolve(__dirname, '..'));
} catch {
  // ignore
}

let httpServer;
let crashReportActive = false;

function serveCrashReport(err) {
  if (crashReportActive) {
    console.error('[FATAL] Error during crash report serving:', err);
    process.exit(1);
  }
  crashReportActive = true;

  try {
    if (httpServer) {
      httpServer.close();
    }
  } catch (closeErr) {
    console.error('Error closing main server:', closeErr);
  }

  const http = require('http');
  const server = http.createServer((req, res) => {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Crown Eve API Startup Error:\n\n' + (err ? err.stack : 'Unknown error'));
  });

  server.on('error', (serverErr) => {
    console.error('[FATAL] Fallback server failed to start:', serverErr);
    process.exit(1);
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`[fallback] Serving crash report on port ${port}`));
}

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  if (httpServer && httpServer.listening) {
    console.error('Process exiting due to uncaught exception in running server.');
    process.exit(1);
  }
  serveCrashReport(err);
});

let app, prisma, logger;
try {
  require('./config/loadEnv');
  app = require('./app');
  app.set('trust proxy', 1);
  prisma = require('./config/db');
  logger = require('./config/logger');
} catch (err) {
  console.error('[FATAL] Initialization error:', err);
  serveCrashReport(err);
  return; // Stop execution of the rest of the file
}
const PORT = process.env.PORT || 3000;
const DB_CONNECT_MS = Number(process.env.DB_CONNECT_TIMEOUT_MS) || 20000;

const required = ['DATABASE_URL', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  const msg = `Missing env: ${missing.join(', ')}. Set in Hostinger → Node.js → Environment variables.`;
  console.error('[startup]', msg);
  logger.error(msg);
  // Removed process.exit(1) so /health still works even if env is missing
}

async function connectDatabase() {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Database connection timed out after ${DB_CONNECT_MS}ms`)), DB_CONNECT_MS);
  });

  await Promise.race([
    (async () => {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
    })(),
    timeout,
  ]);
  logger.info('Database connected');
}

// httpServer is declared at the top of the file

async function shutdown(signal) {
  logger.info(`Shutting down (${signal})`);
  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
  }
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (err) {
    logger.error('Prisma disconnect failed', { message: err.message });
  }
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

async function startServer() {
  // Always listen first so Hostinger/Passenger sees the app as alive (no 503)
  httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[startup] Crown Eve API listening on port ${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'}, node=${process.version})`);
    logger.info(`Server running on port ${PORT}`);
  });

  httpServer.keepAliveTimeout = 65000;
  httpServer.headersTimeout = 66000;

  // Background connection attempt
  connectDatabase().catch((err) => {
    logger.error('Database connection failed — API will retry on next request', {
      message: err.message,
    });
  });
}

startServer();
