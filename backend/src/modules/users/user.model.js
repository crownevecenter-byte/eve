// backend/src/modules/users/user.model.js
const prisma = require('../../config/db');
const { updateManySequential, deleteManySequential } = require('../../config/prismaHttp');

const getAllUsers = (branchId) => prisma.user.findMany({
  where: branchId ? { branchId } : {},
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    branchId: true,
    createdAt: true,
    branch: { select: { id: true, name: true } },
  },
  orderBy: [{ branchId: 'asc' }, { name: 'asc' }],
});

const getUserById = (id) => prisma.user.findUnique({
  where: { id },
  select: { id: true, name: true, email: true, role: true, branchId: true }
});

const createUser = (data) => prisma.user.create({ data });

const updateUser = (id, data) => prisma.user.update({
  where: { id },
  data
});

const deleteUser = async (id) => {
  await updateManySequential(prisma, prisma.order, { customerId: id }, { customerId: null });
  await deleteManySequential(prisma, prisma.serviceBooking, { customerId: id });
  return prisma.user.delete({ where: { id } });
};

const searchOnlineCustomers = (search, limit = 50) =>
  prisma.user.findMany({
    where: {
      role: 'CUSTOMER',
      OR: search
        ? [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    },
    select: { id: true, name: true, email: true, phone: true, city: true },
    take: Number(limit),
    orderBy: { name: 'asc' },
  });

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  searchOnlineCustomers,
};
