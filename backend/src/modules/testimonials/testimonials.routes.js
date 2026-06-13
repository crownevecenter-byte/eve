const express = require('express');
const router = express.Router();
const testimonialController = require('./testimonials.controller');

router.get('/', testimonialController.getTestimonials);
router.post('/', testimonialController.submitTestimonial);

module.exports = router;
