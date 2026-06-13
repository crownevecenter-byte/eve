// backend/src/modules/service-categories/service-category.model.js
const prisma = require('../../config/db');

const getAll = () => prisma.serviceCategory.findMany({
  include: { _count: { select: { services: true } } }
});

const create = (data) => prisma.serviceCategory.create({ data });

const remove = (id) => prisma.serviceCategory.delete({ where: { id } });

module.exports = { getAll, create, remove };
