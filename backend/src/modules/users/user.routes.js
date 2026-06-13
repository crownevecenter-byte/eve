// backend/src/modules/users/user.routes.js
const router = require('express').Router();
const ctrl = require('./user.controller');
const { protect } = require('../../middleware/auth');
const { allow } = require('../../middleware/rbac');

router.get('/page-init',  protect, allow('COMPANY_OWNER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'EMPLOYEE'), ctrl.getPageInit);
router.get('/',           protect, allow('COMPANY_OWNER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'EMPLOYEE'), ctrl.getAll);
router.get('/online-customers', protect, allow('COMPANY_OWNER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'EMPLOYEE'), ctrl.getOnlineCustomers);
router.post('/',          protect, allow('COMPANY_OWNER', 'BRANCH_OWNER', 'BRANCH_MANAGER'), ctrl.create);
router.put('/:id',       protect, allow('COMPANY_OWNER', 'BRANCH_OWNER', 'BRANCH_MANAGER'), ctrl.update);
router.delete('/:id',    protect, allow('COMPANY_OWNER', 'BRANCH_OWNER', 'BRANCH_MANAGER'), ctrl.remove);

module.exports = router;
