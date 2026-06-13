// backend/src/modules/services/service.routes.js
const router = require('express').Router();
const ctrl = require('./service.controller');
const { protect } = require('../../middleware/auth');
const { allow } = require('../../middleware/rbac');

router.get('/',           ctrl.getAll);
router.post('/',          protect, allow('BRANCH_OWNER', 'BRANCH_MANAGER', 'COMPANY_OWNER'), ctrl.create);
router.put('/:id',       protect, allow('BRANCH_OWNER', 'BRANCH_MANAGER', 'COMPANY_OWNER'), ctrl.update);
router.delete('/:id',    protect, allow('BRANCH_OWNER', 'BRANCH_MANAGER', 'COMPANY_OWNER'), ctrl.remove);

module.exports = router;
