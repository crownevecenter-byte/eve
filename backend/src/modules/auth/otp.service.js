const prisma = require('../../config/db');
const { sendOtpEmail, sendPasswordResetOtpEmail } = require('../../utils/email.service');
const { otp: otpLimits } = require('../../config/authLimits');

const OTP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_PER_WINDOW = otpLimits.maxPerWindow;
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_VERIFY_MAX_ATTEMPTS = otpLimits.verifyMaxAttempts;
const OTP_VERIFY_WINDOW_MS = otpLimits.verifyWindowMs;

const verifyAttempts = new Map();

const assertOtpVerifyLimit = (email) => {
  const key = String(email || '').toLowerCase().trim();
  const now = Date.now();
  const entry = verifyAttempts.get(key) || { count: 0, resetAt: now + OTP_VERIFY_WINDOW_MS };
  if (now > entry.resetAt) {
    verifyAttempts.set(key, { count: 1, resetAt: now + OTP_VERIFY_WINDOW_MS });
    return;
  }
  entry.count += 1;
  verifyAttempts.set(key, entry);
  if (entry.count > OTP_VERIFY_MAX_ATTEMPTS) {
    const waitMsg =
      OTP_VERIFY_WINDOW_MS <= 60_000
        ? 'Too many failed OTP attempts. Please wait one minute and request a new code.'
        : 'Too many failed OTP attempts. Please wait 15 minutes and request a new code.';
    const err = new Error(waitMsg);
    err.statusCode = 429;
    throw err;
  }
};

const clearOtpVerifyAttempts = (email) => {
  verifyAttempts.delete(String(email || '').toLowerCase().trim());
};

const OTP_PURPOSE = {
  VERIFY_EMAIL: 'VERIFY_EMAIL',
  PASSWORD_RESET: 'PASSWORD_RESET',
};

const assertOtpRateLimit = async (email) => {
  const since = new Date(Date.now() - OTP_WINDOW_MS);
  const count = await prisma.otpVerification.count({
    where: { email, createdAt: { gte: since } },
  });
  if (count >= OTP_MAX_PER_WINDOW) {
    const err = new Error('Too many OTP requests. You can request at most 15 codes in 10 minutes. Please wait and try again.');
    err.statusCode = 429;
    throw err;
  }
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const createOtpRecord = async (email, purpose) => {
  await assertOtpRateLimit(email);
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  await prisma.otpVerification.create({
    data: { email, otp, expiresAt, purpose },
  });
  return otp;
};

const sendVerificationOtp = async (email) => {
  const otp = await createOtpRecord(email, OTP_PURPOSE.VERIFY_EMAIL);
  await sendOtpEmail(email, otp);
  return otp;
};

const sendPasswordResetOtp = async (email) => {
  const otp = await createOtpRecord(email, OTP_PURPOSE.PASSWORD_RESET);
  await sendPasswordResetOtpEmail(email, otp);
  return otp;
};

const findValidOtp = async (email, otp, purpose) => {
  const record = await prisma.otpVerification.findFirst({
    where: { email, otp, isUsed: false, purpose },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) return null;
  if (record.expiresAt < new Date()) return null;
  return record;
};

const markOtpUsed = (id) =>
  prisma.otpVerification.update({ where: { id }, data: { isUsed: true } });

module.exports = {
  OTP_PURPOSE,
  OTP_MAX_PER_WINDOW,
  OTP_WINDOW_MS,
  assertOtpRateLimit,
  assertOtpVerifyLimit,
  clearOtpVerifyAttempts,
  sendVerificationOtp,
  sendPasswordResetOtp,
  findValidOtp,
  markOtpUsed,
};
