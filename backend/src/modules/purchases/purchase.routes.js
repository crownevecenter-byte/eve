// backend/src/modules/purchases/purchase.routes.js
const router = require('express').Router();
const ctrl = require('./purchase.controller');
const { protect } = require('../../middleware/auth');
const { allow } = require('../../middleware/rbac');

router.get('/',  protect, allow('BRANCH_OWNER', 'BRANCH_MANAGER', 'COMPANY_OWNER'), ctrl.getAll);
router.post('/', protect, allow('BRANCH_OWNER', 'BRANCH_MANAGER'), ctrl.create);

module.exports = router;
