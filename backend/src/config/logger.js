// backend/src/config/logger.js
const fs = require('fs');
const path = require('path');
const winston = require('winston');

const transports = [new winston.transports.Console()];

// File logs only in dev — Hostinger often has no writable logs/ dir (crashes → 503)
if (process.env.NODE_ENV !== 'production') {
  const logsDir = path.join(__dirname, '../../logs');
  try {
    fs.mkdirSync(logsDir, { recursive: true });
    transports.push(
      new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
      new winston.transports.File({ filename: path.join(logsDir, 'combined.log') })
    );
  } catch {
    // ignore — console logging is enough
  }
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports,
});

module.exports = logger;
