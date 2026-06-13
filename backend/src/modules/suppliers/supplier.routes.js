// backend/src/modules/suppliers/supplier.routes.js
const router = require('express').Router();
const ctrl = require('./supplier.controller');
const { protect } = require('../../middleware/auth');
const { allow } = require('../../middleware/rbac');

router.get('/', protect, allow('BRANCH_OWNER', 'BRANCH_MANAGER', 'COMPANY_OWNER'), ctrl.getAll);
router.post('/', protect, allow('BRANCH_OWNER', 'BRANCH_MANAGER'), ctrl.create);
router.put('/:id', protect, allow('BRANCH_OWNER', 'BRANCH_MANAGER'), ctrl.update);
router.delete('/:id', protect, allow('BRANCH_OWNER', 'BRANCH_MANAGER'), ctrl.remove);

module.exports = router;
