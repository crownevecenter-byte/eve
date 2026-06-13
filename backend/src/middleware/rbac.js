// backend/src/middleware/rbac.js
const logger = require('../config/logger');
const { normalizeRole } = require('../constants/roles');

const allow = (...roles) => (req, res, next) => {
  const userRole = normalizeRole(req.user.role);
  const allowed = roles.map(normalizeRole);

  if (allowed.includes(userRole)) {
    return next();
  }

  logger.warn(
    `[AUTH_FAILURE] User ${req.user.email} (${req.user.role}) attempted restricted action. Required: ${roles.join(', ')}`
  );

  return res.status(403).json({
    message: `Access denied. Your account does not have the required privileges.`,
    requiredRole: roles[0],
  });
};

module.exports = { allow };
