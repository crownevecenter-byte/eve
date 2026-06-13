// backend/src/modules/service-bookings/booking.routes.js
const express = require('express');
const router = express.Router();
const controller = require('./booking.controller');
const { protect } = require('../../middleware/auth');

router.get('/today', protect, controller.getToday);
router.get('/page-init', protect, controller.getPageInit);
router.get('/', protect, controller.getAll);
router.get('/:id', protect, controller.getOne);
router.post('/', protect, controller.create);
router.put('/:id', protect, controller.update);
router.delete('/:id', protect, controller.remove);

module.exports = router;
