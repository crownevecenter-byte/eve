// backend/src/modules/branches/branch.routes.js
const router = require('express').Router();
const ctrl = require('./branch.controller');
const { protect } = require('../../middleware/auth');
const { allow } = require('../../middleware/rbac');

router.get('/count',      protect, allow('COMPANY_OWNER'), ctrl.getCount);
router.get('/top',        protect, allow('COMPANY_OWNER'), ctrl.getTop);
router.get('/',           ctrl.getAll);
router.get('/available',   ctrl.getAvailable);
router.get('/:id/banks',   ctrl.getBanks);
router.get('/:id/settings-bundle', protect, allow('COMPANY_OWNER', 'BRANCH_OWNER', 'BRANCH_MANAGER'), ctrl.getSettingsBundle);
router.get('/:id',       protect, allow('COMPANY_OWNER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'CUSTOMER', 'EMPLOYEE'), ctrl.getById);
router.post('/',          protect, allow('COMPANY_OWNER'), ctrl.create);
router.put('/:id',       protect, allow('COMPANY_OWNER', 'BRANCH_OWNER', 'BRANCH_MANAGER'), ctrl.update);
router.delete('/:id',    protect, allow('COMPANY_OWNER'), ctrl.remove);

module.exports = router;
