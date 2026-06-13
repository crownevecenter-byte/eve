const router = require('express').Router();
const ctrl = require('./walk-in.controller');
const { protect } = require('../../middleware/auth');
const { allow } = require('../../middleware/rbac');

router.get('/', protect, allow('COMPANY_OWNER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'EMPLOYEE'), ctrl.getAll);
router.post('/', protect, allow('COMPANY_OWNER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'EMPLOYEE'), ctrl.create);

module.exports = router;
