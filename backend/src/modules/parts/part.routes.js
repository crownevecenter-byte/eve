// backend/src/modules/parts/part.routes.js
const router = require('express').Router();
const ctrl = require('./part.controller');
const { protect } = require('../../middleware/auth');
const { allow } = require('../../middleware/rbac');

router.get('/count',      protect, allow('COMPANY_OWNER'), ctrl.getCount);
router.get('/',           ctrl.getAll);
router.get('/:id',       ctrl.getById);
router.post('/',          protect, allow('COMPANY_OWNER'), ctrl.create);
router.put('/:id',       protect, allow('COMPANY_OWNER'), ctrl.update);
router.delete('/:id',    protect, allow('COMPANY_OWNER'), ctrl.remove);

module.exports = router;
