const path = require('path');

process.chdir(path.resolve(__dirname, '../..'));
require('../../src/config/loadEnv');

let prisma;

const created = {
  supplierIds: [],
  productIds: [],
  purchaseIds: [],
  orderIds: [],
  walkInIds: [],
  bookingIds: [],
};

const tag = () => `auto-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

function getPrisma() {
  if (!prisma) {
    prisma = require('../../src/config/db');
  }
  return prisma;
}

async function getBranch() {
  return getPrisma().branch.findFirst({ orderBy: { id: 'asc' } });
}

async function getBranchOwner() {
  return getPrisma().user.findFirst({
    where: { role: 'BRANCH_OWNER', isVerified: true },
  });
}

async function getCustomer() {
  return getPrisma().user.findFirst({
    where: { role: 'CUSTOMER', isVerified: true },
  });
}

function authHeader(user) {
  const jwt = require('jsonwebtoken');
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET missing — cannot run API auth tests.');
  }
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function cleanup() {
  const p = getPrisma();

  for (const id of created.orderIds) {
    try {
      await p.orderItem.deleteMany({ where: { orderId: id } });
      await p.order.delete({ where: { id } });
    } catch {
      // best-effort
    }
  }

  for (const id of created.bookingIds) {
    try {
      await p.serviceBooking.delete({ where: { id } });
    } catch {
      // best-effort
    }
  }

  for (const id of created.purchaseIds) {
    try {
      await p.purchaseItem.deleteMany({ where: { purchaseId: id } });
      await p.purchase.delete({ where: { id } });
    } catch {
      // best-effort
    }
  }

  for (const id of created.supplierIds) {
    try {
      const count = await p.purchase.count({ where: { supplierId: id } });
      if (count === 0) {
        await p.supplier.delete({ where: { id } });
      }
    } catch {
      // best-effort
    }
  }

  for (const id of created.walkInIds) {
    try {
      const cust = await p.walkInCustomer.findUnique({ where: { id }, select: { accountId: true } });
      await p.walkInCustomerLedger.deleteMany({ where: { customerId: id } }).catch(() => {});
      await p.walkInCustomer.delete({ where: { id } });
      if (cust?.accountId) {
        await p.ledgerEntry.deleteMany({ where: { ledger: { accountId: cust.accountId } } }).catch(() => {});
        await p.ledger.deleteMany({ where: { accountId: cust.accountId } }).catch(() => {});
        await p.account.delete({ where: { id: cust.accountId } }).catch(() => {});
      }
    } catch {
      // best-effort
    }
  }

  for (const id of created.productIds) {
    try {
      const pp = await p.productPart.findMany({ where: { productId: id } });
      await p.productImage.deleteMany({ where: { productId: id } });
      await p.partDetail.deleteMany({ where: { productId: id } });
      await p.bike.deleteMany({ where: { productId: id } });
      await p.productPart.deleteMany({ where: { productId: id } });
      for (const link of pp) {
        await p.inventory.deleteMany({ where: { partId: link.partId } }).catch(() => {});
        await p.part.delete({ where: { id: link.partId } }).catch(() => {});
      }
      await p.product.delete({ where: { id } });
    } catch {
      // best-effort
    }
  }

  await p.$disconnect();
}

module.exports = {
  tag,
  created,
  getPrisma,
  getBranch,
  getBranchOwner,
  getCustomer,
  authHeader,
  cleanup,
};
