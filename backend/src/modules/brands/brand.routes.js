// backend/src/modules/brands/brand.routes.js
const express = require('express');
const router = express.Router();
const controller = require('./brand.controller');
const { protect } = require('../../middleware/auth');

router.get('/', controller.getAll);
router.post('/', protect, controller.create);
router.delete('/:id', protect, controller.remove);

module.exports = router;
