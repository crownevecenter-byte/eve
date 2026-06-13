// backend/src/modules/service-categories/service-category.routes.js
const express = require('express');
const router = express.Router();
const controller = require('./service-category.controller');
const { protect } = require('../../middleware/auth');

router.get('/', protect, controller.getAll);
router.post('/', protect, controller.create);
router.delete('/:id', protect, controller.remove);

module.exports = router;
