// backend/src/modules/services/service.model.js
const prisma = require('../../config/db');

const getAllServices = (branchId, limit = 100) =>
  prisma.service.findMany({
    where: {
      ...(branchId ? { branchId: Number(branchId) } : {}),
      is_active: true,
    },
    take: Math.min(Number(limit) || 100, 200),
    select: {
      id: true,
      name: true,
      service_type: true,
      description: true,
      base_price: true,
      duration_minutes: true,
      branchId: true,
      serviceCategoryId: true,
      branch: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
  });

const createService = (data) => prisma.service.create({ data });

const updateService = (id, data) => prisma.service.update({ where: { id }, data });

const deleteService = (id) => prisma.service.delete({ where: { id } });

module.exports = { getAllServices, createService, updateService, deleteService };
