// backend/src/modules/orders/order.routes.js
const router = require('express').Router();
const ctrl = require('./order.controller');
const { protect } = require('../../middleware/auth');
const { allow } = require('../../middleware/rbac');
const { scopeBranch } = require('../../middleware/scopeBranch');

const validate = require('../../middleware/validate');
const { createOrderSchema, updateStatusSchema } = require('./order.schema');

const staffRoles = ['EMPLOYEE', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'COMPANY_OWNER'];
const branchStaff = ['EMPLOYEE', 'BRANCH_OWNER', 'BRANCH_MANAGER'];

router.post('/', protect, allow('EMPLOYEE', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'CUSTOMER'), validate(createOrderSchema), ctrl.create);
router.get('/count', protect, scopeBranch, allow(...staffRoles), ctrl.getCount);
router.get('/page-init', protect, scopeBranch, allow(...staffRoles), ctrl.getPageInit);
router.get('/export-csv', protect, allow('COMPANY_OWNER'), ctrl.exportCsv);
router.get('/my', protect, allow('CUSTOMER'), ctrl.getMine);
router.get('/', protect, scopeBranch, allow(...staffRoles), ctrl.getAll);
router.get('/customer/:id', protect, allow('CUSTOMER', 'BRANCH_OWNER', 'BRANCH_MANAGER'), ctrl.getByCustomer);
router.get('/:id', protect, allow(...staffRoles, 'CUSTOMER'), ctrl.getById);
router.put('/:id/status', protect, scopeBranch, allow(...branchStaff), validate(updateStatusSchema), ctrl.updateStatus);

module.exports = router;
