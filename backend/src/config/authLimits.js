/**
 * TEMPORARY: relaxed limits while testing login/OTP flows.
 * Set RELAX_AUTH_LIMITS=false in .env (or flip DEFAULT_RELAXED) before go-live.
 */
const DEFAULT_RELAXED = true;

const relaxed =
  process.env.RELAX_AUTH_LIMITS === 'false' || process.env.RELAX_AUTH_LIMITS === '0'
    ? false
    : process.env.RELAX_AUTH_LIMITS === 'true' ||
      process.env.RELAX_AUTH_LIMITS === '1' ||
      (process.env.RELAX_AUTH_LIMITS === undefined && DEFAULT_RELAXED);

module.exports = {
  relaxed,

  login: {
    maxFailedAttempts: relaxed ? 999 : 8,
    lockoutMs: relaxed ? 60 * 1000 : 15 * 60 * 1000,
    lockoutMessage: relaxed
      ? 'Too many failed login attempts. Please wait one minute and try again.'
      : 'Too many failed login attempts. Please try again in 15 minutes.',
  },

  rateLimit: {
    login: { windowMs: relaxed ? 60 * 1000 : 15 * 60 * 1000, max: relaxed ? 500 : 20 },
    register: { windowMs: relaxed ? 60 * 1000 : 15 * 60 * 1000, max: relaxed ? 200 : 10 },
    otp: { windowMs: relaxed ? 60 * 1000 : 15 * 60 * 1000, max: relaxed ? 500 : 30 },
  },

  otp: {
    maxPerWindow: relaxed ? 100 : 15,
    verifyMaxAttempts: relaxed ? 100 : 5,
    verifyWindowMs: relaxed ? 60 * 1000 : 15 * 60 * 1000,
  },
};
