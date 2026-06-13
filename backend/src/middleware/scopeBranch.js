const { BRANCH_SCOPED_ROLES, normalizeRole } = require('../constants/roles');

/**
 * Ensures branch-scoped users cannot access another branch's data via query/body/params.
 * Sets req.scopedBranchId for downstream controllers.
 */
const scopeBranch = (req, res, next) => {
  if (!req.user) return next();

  const role = normalizeRole(req.user.role);
  if (!BRANCH_SCOPED_ROLES.includes(role) || !req.user.branchId) {
    return next();
  }

  const userBranchId = Number(req.user.branchId);
  req.scopedBranchId = userBranchId;

  const requested =
    req.query.branchId ??
    req.body?.branchId ??
    req.params?.branchId;

  if (requested !== undefined && requested !== '' && Number(requested) !== userBranchId) {
    return res.status(403).json({ message: 'Access denied for this branch.' });
  }

  if (req.query.branchId === undefined && req.method === 'GET') {
    req.query.branchId = String(userBranchId);
  }

  next();
};

/** Reject if a resource belongs to a different branch than the user. */
const assertBranchAccess = (req, resourceBranchId) => {
  if (!req.user || resourceBranchId == null) return true;
  const role = normalizeRole(req.user.role);
  if (!BRANCH_SCOPED_ROLES.includes(role) || !req.user.branchId) return true;
  return Number(resourceBranchId) === Number(req.user.branchId);
};

module.exports = { scopeBranch, assertBranchAccess };
