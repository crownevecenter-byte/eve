// backend/src/modules/products/product.routes.js
const router = require('express').Router();
const ctrl = require('./product.controller');
const { protect, optionalProtect } = require('../../middleware/auth');
const { allow } = require('../../middleware/rbac');
const { scopeBranch } = require('../../middleware/scopeBranch');

const validate = require('../../middleware/validate');
const { createProductSchema, updateProductSchema } = require('./product.schema');

const productWriteRoles = ['COMPANY_OWNER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'EMPLOYEE'];

router.get('/page-init', protect, scopeBranch, allow(...productWriteRoles), ctrl.getPageInit);
router.get('/', optionalProtect, ctrl.getAll);
router.get('/:id', optionalProtect, ctrl.getById);
router.post('/', protect, scopeBranch, allow(...productWriteRoles), validate(createProductSchema), ctrl.create);
router.put('/:id', protect, scopeBranch, allow(...productWriteRoles), validate(updateProductSchema), ctrl.update);
router.delete('/:id', protect, scopeBranch, allow(...productWriteRoles), ctrl.remove);

module.exports = router;
