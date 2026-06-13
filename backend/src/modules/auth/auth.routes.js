// backend/src/modules/auth/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { protect } = require('../../middleware/auth');
const { loginLimiter, registerLimiter, otpLimiter } = require('../../middleware/rateLimit');
const { relaxed: authLimitsRelaxed } = require('../../config/authLimits');

const validate = require('../../middleware/validate');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyOtpSchema,
  googleAuthSchema,
} = require('./auth.schema');

const wrapAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const noop = (_limiter) => (req, res, next) => next();

const safeLimiter = (limiter) => (req, res, next) => {
  limiter(req, res, (err) => {
    if (err) {
      const logger = require('../../config/logger');
      logger.warn('Rate limiter skipped', { path: req.path, code: err.code, message: err.message });
      return next();
    }
    next();
  });
};

/** When relaxed, skip express-rate-limit (shared CDN IP was causing site-wide 429). */
const rl = authLimitsRelaxed ? noop : safeLimiter;

router.get('/google-config', authController.getGoogleConfig);
router.post('/register', rl(registerLimiter), validate(registerSchema), wrapAsync(authController.register));
router.post('/login', validate(loginSchema), rl(loginLimiter), wrapAsync(authController.login));
router.post('/google', validate(googleAuthSchema), rl(loginLimiter), wrapAsync(authController.googleAuth));
router.post('/verify-otp', rl(otpLimiter), validate(verifyOtpSchema), wrapAsync(authController.verifyOtp));
router.post('/resend-otp', rl(otpLimiter), wrapAsync(authController.resendOtp));
router.post('/forgot-password', rl(otpLimiter), validate(forgotPasswordSchema), wrapAsync(authController.forgotPassword));
router.post('/reset-password', rl(otpLimiter), validate(resetPasswordSchema), wrapAsync(authController.resetPassword));
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.post('/refresh', protect, wrapAsync(authController.refreshSession));
router.put('/profile', protect, authController.updateProfile);
router.post('/change-password', protect, wrapAsync(authController.changePassword));
router.delete('/sessions', protect, wrapAsync(authController.logoutAllSessions));

module.exports = router;
