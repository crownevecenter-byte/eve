const NodeCache = require('node-cache');
const { login: loginLimits } = require('../config/authLimits');

const MAX_ATTEMPTS = loginLimits.maxFailedAttempts;
const LOCKOUT_MS = loginLimits.lockoutMs;

const attempts = new NodeCache({ stdTTL: LOCKOUT_MS / 1000, checkperiod: 120 });

const getKey = (email) => String(email || '').toLowerCase().trim();

exports.recordFailedLogin = (email) => {
  const key = getKey(email);
  const count = (attempts.get(key) || 0) + 1;
  attempts.set(key, count, LOCKOUT_MS / 1000);
  return count;
};

exports.clearLoginAttempts = (email) => {
  attempts.del(getKey(email));
};

exports.isLoginLocked = (email) => {
  const count = attempts.get(getKey(email)) || 0;
  return count >= MAX_ATTEMPTS;
};

exports.getRemainingLockMessage = () => loginLimits.lockoutMessage;
