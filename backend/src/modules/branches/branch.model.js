// backend/src/modules/branches/branch.model.js
const prisma = require('../../config/db');

const getAllBranches = () => prisma.branch.findMany({
  include: {
    _count: {
      select: { users: true, products: true, services: true }
    }
  }
});

const getBranchById = (id) => prisma.branch.findUnique({
  where: { id },
  include: {
    users: { select: { id: true, name: true, role: true } },
    products: true,
    services: true,
    inventory: { include: { part: true } }
  }
});

/** Keeps Branch autoincrement in sync after manual deletes or failed removals. */
const syncBranchIdSequence = async () => {
  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('"Branch"', 'id'),
      COALESCE((SELECT MAX(id) FROM "Branch"), 0) + 1,
      false
    )
  `;
};

const createBranch = async (data) => {
  await syncBranchIdSequence();
  return prisma.branch.create({ data });
};

const updateBranch = (id, data) => prisma.branch.update({
  where: { id },
  data
});

const deleteBranch = (id) => prisma.branch.delete({
  where: { id }
});

module.exports = {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  syncBranchIdSequence,
};
