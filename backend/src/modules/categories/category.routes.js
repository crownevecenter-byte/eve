// backend/src/modules/categories/category.routes.js
const express = require('express');
const router = express.Router();
const controller = require('./category.controller');
const { protect } = require('../../middleware/auth');

router.get('/', controller.getAll);
router.post('/', protect, controller.create);
router.delete('/:id', protect, controller.remove);

module.exports = router;
