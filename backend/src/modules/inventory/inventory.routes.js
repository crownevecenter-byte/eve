// backend/src/modules/inventory/inventory.routes.js
const router = require('express').Router();
const ctrl = require('./inventory.controller');
const { protect } = require('../../middleware/auth');
const { allow } = require('../../middleware/rbac');

router.get('/alerts',    protect, allow('BRANCH_OWNER', 'BRANCH_MANAGER', 'COMPANY_OWNER', 'EMPLOYEE'), ctrl.getAlerts);
router.get('/page-bundle', protect, allow('BRANCH_OWNER', 'BRANCH_MANAGER', 'EMPLOYEE', 'COMPANY_OWNER'), ctrl.getPageBundle);
router.get('/summary',   protect, allow('BRANCH_OWNER', 'BRANCH_MANAGER', 'COMPANY_OWNER', 'EMPLOYEE'), ctrl.getSummary);
router.get('/',          protect, allow('BRANCH_OWNER', 'BRANCH_MANAGER', 'EMPLOYEE', 'COMPANY_OWNER'), ctrl.getAll);
router.put('/:id',       protect, allow('BRANCH_OWNER', 'BRANCH_MANAGER'), ctrl.update);

module.exports = router;
