const testimonialModel = require('./testimonials.model');

const getTestimonials = async (req, res) => {
  try {
    const testimonials = await testimonialModel.getAllApprovedTestimonials();
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch testimonials', error: error.message });
  }
};

const submitTestimonial = async (req, res) => {
  try {
    const { name, role, text, stars } = req.body;
    if (!name || !text || !stars) {
      return res.status(400).json({ message: 'Name, text and stars are required' });
    }
    const testimonial = await testimonialModel.createTestimonial({
      name,
      role,
      text,
      stars: parseInt(stars) || 5,
      isApproved: true // Auto-approve as per logic discussed
    });
    res.status(201).json(testimonial);
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit testimonial', error: error.message });
  }
};

module.exports = { getTestimonials, submitTestimonial };
