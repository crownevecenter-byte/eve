// backend/src/modules/parts/part.model.js
const prisma = require('../../config/db');
const { sequentialOnHttp } = require('../../utils/sequentialOnHttp');

const getParts = async ({ page = 1, limit = 20, category, search }) => {
  const skip = (page - 1) * limit;
  const where = {
    ...(category && { category }),
    ...(search && { name: { contains: search } })
  };

  const [data, total] = await sequentialOnHttp([
    () =>
      prisma.part.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { name: 'asc' },
      }),
    () => prisma.part.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getPartById = (id) => prisma.part.findUnique({ where: { id } });

const createPart = (data) => prisma.part.create({ data });

const updatePart = (id, data) => prisma.part.update({
  where: { id },
  data
});

module.exports = { getParts, getPartById, createPart, updatePart };
