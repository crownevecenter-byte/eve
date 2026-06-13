// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { getTokenFromRequest } = require('../utils/authCookie');
const { isTokenRevoked } = require('../utils/tokenRevocation');
const { normalizeRole } = require('../constants/roles');

const JWT_SECRET = () => process.env.JWT_SECRET;

const requireJwtSecret = () => {
  const secret = JWT_SECRET();
  if (!secret) {
    throw new Error('JWT_SECRET env var not set. Add it in Hostinger → Environment variables.');
  }
  return secret;
};

const protect = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const decoded = jwt.verify(token, requireJwtSecret());

    if (isTokenRevoked(decoded.id, decoded.iat)) {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, branchId: true, isVerified: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: normalizeRole(user.role),
      branchId: user.branchId,
      isVerified: user.isVerified,
    };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const optionalProtect = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, requireJwtSecret());
    if (isTokenRevoked(decoded.id, decoded.iat)) return next();

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, branchId: true, isVerified: true },
    });
    if (!user) return next();

    req.user = {
      id: user.id,
      email: user.email,
      role: normalizeRole(user.role),
      branchId: user.branchId,
      isVerified: user.isVerified,
    };
  } catch {
    // Invalid/expired token — treat as public guest
  }
  next();
};

module.exports = { protect, optionalProtect };
