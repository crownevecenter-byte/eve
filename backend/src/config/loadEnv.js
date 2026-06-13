// Load env before any module reads process.env (Hostinger often deletes .env files).
// Pakistan timezone for logs, OTP expiry, and email timestamps (Hostinger default is often UTC).
if (!process.env.TZ) {
  process.env.TZ = 'Asia/Karachi';
}

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const backendRoot = path.resolve(__dirname, '../..');
const repoRoot = path.resolve(backendRoot, '..');

const candidates = [
  path.join(backendRoot, '.env'),
  path.join(backendRoot, 'config.env'), // use this on Hostinger if .env is blocked
  path.join(repoRoot, '.env'),
  path.join(repoRoot, 'config.env'),
];

for (const envPath of candidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, quiet: true });
  }
}

module.exports = { backendRoot, repoRoot };
