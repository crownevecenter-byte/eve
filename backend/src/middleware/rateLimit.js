const rateLimit = require('express-rate-limit');
const { rateLimit: limits } = require('../config/authLimits');

const normalizeEmail = (req) => {
  const email = req.body?.email;
  if (typeof email === 'string' && email.trim()) {
    return email.toLowerCase().trim();
  }
  return null;
};

/** Per-email when possible. Avoid bare IP behind Vercel/Hostinger CDN (one IP = all users → 429). */
const limiterKey = (req, prefix) => {
  const email = normalizeEmail(req);
  if (email) return `${prefix}:email:${email}`;
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp =
    typeof forwarded === 'string' && forwarded.trim()
      ? forwarded.split(',')[0].trim()
      : req.ip || req.socket?.remoteAddress || 'unknown';
  return `${prefix}:ip:${clientIp}`;
};

// Hostinger + Express 5 + Vercel proxy: strict validation throws ERR_ERL_* → 500 on login.
const limiterValidate = false;

const loginLimiter = rateLimit({
  windowMs: limits.login.windowMs,
  max: limits.login.max,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  validate: limiterValidate,
  keyGenerator: (req) => limiterKey(req, 'login'),
  message: {
    message: limits.login.windowMs <= 60_000
      ? 'Too many login attempts. Please wait one minute and try again.'
      : 'Too many login attempts for this account. Please try again in 15 minutes.',
  },
});

const registerLimiter = rateLimit({
  windowMs: limits.register.windowMs,
  max: limits.register.max,
  standardHeaders: true,
  legacyHeaders: false,
  validate: limiterValidate,
  keyGenerator: (req) => limiterKey(req, 'register'),
  message: { message: 'Too many registration attempts. Please try again later.' },
});

const otpLimiter = rateLimit({
  windowMs: limits.otp.windowMs,
  max: limits.otp.max,
  standardHeaders: true,
  legacyHeaders: false,
  validate: limiterValidate,
  keyGenerator: (req) => limiterKey(req, 'otp'),
  message: { message: 'Too many OTP requests. Please try again later.' },
});

module.exports = { loginLimiter, registerLimiter, otpLimiter };
