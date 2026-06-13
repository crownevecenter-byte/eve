const prisma = require('../../config/db');

const getAllApprovedTestimonials = () => prisma.testimonial.findMany({
  where: { isApproved: true },
  orderBy: { createdAt: 'desc' }
});

const createTestimonial = (data) => prisma.testimonial.create({ data });

module.exports = { getAllApprovedTestimonials, createTestimonial };
