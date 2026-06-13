// backend/src/modules/reports/report.model.js
const prisma = require('../../config/db');
const { getAdapterMode } = require('../../config/db');

const isHttp = () => getAdapterMode() === 'http';

const getRevenueSummary = async ({ branchId }) => {
  const where = {
    status: 'COMPLETED',
    ...(branchId && { branchId: Number(branchId) }),
  };

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let monthOrders;
  let totalAgg;

  if (isHttp()) {
    monthOrders = await prisma.order.findMany({
      where: { ...where, createdAt: { gte: startOfMonth } },
      select: { total: true, createdAt: true },
    });
    totalAgg = await prisma.order.aggregate({ where, _sum: { total: true } });
  } else {
    [monthOrders, totalAgg] = await Promise.all([
      prisma.order.findMany({
        where: { ...where, createdAt: { gte: startOfMonth } },
        select: { total: true, createdAt: true },
      }),
      prisma.order.aggregate({ where, _sum: { total: true } }),
    ]);
  }

  let today = 0;
  let week = 0;
  let month = 0;
  for (const order of monthOrders) {
    const amount = order.total || 0;
    const created = new Date(order.createdAt);
    month += amount;
    if (created >= startOfWeek) week += amount;
    if (created >= startOfToday) today += amount;
  }

  return {
    today,
    thisWeek: week,
    thisMonth: month,
    totalRevenue: totalAgg._sum.total || 0,
  };
};

const getRevenueChart = async ({ branchId, days = 30 }) => {
  const dayCount = Number(days) || 30;
  const dateKeys = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    dateKeys.push(d.toISOString().split('T')[0]);
  }

  const rangeStart = new Date(dateKeys[0]);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(dateKeys[dateKeys.length - 1]);
  rangeEnd.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      ...(branchId ? { branchId: Number(branchId) } : {}),
      status: 'COMPLETED',
      createdAt: { gte: rangeStart, lte: rangeEnd },
    },
    select: { total: true, createdAt: true },
  });

  const bucket = Object.fromEntries(dateKeys.map((dk) => [dk, 0]));
  for (const order of orders) {
    const dk = new Date(order.createdAt).toISOString().split('T')[0];
    if (dk in bucket) bucket[dk] += order.total || 0;
  }

  return dateKeys.map((dk) => ({ date: dk, revenue: bucket[dk] }));
};

const getBranchCompareData = async () => {
  let branches;
  let revenueGroups;

  if (isHttp()) {
    branches = await prisma.branch.findMany({
      select: { id: true, name: true, _count: { select: { orders: true } } },
      orderBy: { name: 'asc' },
    });
    revenueGroups = await prisma.order.groupBy({
      by: ['branchId'],
      where: { status: 'COMPLETED' },
      _sum: { total: true },
    });
  } else {
    [branches, revenueGroups] = await Promise.all([
      prisma.branch.findMany({
        select: { id: true, name: true, _count: { select: { orders: true } } },
        orderBy: { name: 'asc' },
      }),
      prisma.order.groupBy({
        by: ['branchId'],
        where: { status: 'COMPLETED' },
        _sum: { total: true },
      }),
    ]);
  }

  const revMap = Object.fromEntries(
    revenueGroups.map((g) => [g.branchId, g._sum.total || 0])
  );

  return branches.map((b) => ({
    name: b.name,
    revenue: revMap[b.id] || 0,
    orderCount: b._count.orders,
  }));
};

const getBranchStats = (id) => prisma.branch.findUnique({
  where: { id },
  include: {
    _count: {
      select: { orders: true, serviceBookings: true, products: true },
    },
  },
});

const getBranchRevenue = (id) => prisma.order.aggregate({
  where: { branchId: id, status: 'COMPLETED' },
  _sum: { total: true },
});

const getSalesReport = (branchId, { limit = 80 } = {}) =>
  prisma.order.findMany({
    where: { branchId, status: 'COMPLETED' },
    include: { items: { include: { product: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Number(limit) || 80, 100),
  });

const getBranchPerformanceChart = async ({ days = 7 } = {}) => {
  const dayCount = Number(days) || 7;
  const branches = await prisma.branch.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const dateKeys = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    dateKeys.push(d.toISOString().split('T')[0]);
  }

  const rangeStart = new Date(dateKeys[0]);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(dateKeys[dateKeys.length - 1]);
  rangeEnd.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: rangeStart, lte: rangeEnd },
    },
    select: { branchId: true, total: true, createdAt: true },
  });

  const bucket = {};
  for (const dk of dateKeys) {
    bucket[dk] = { date: dk };
    for (const b of branches) {
      bucket[dk][`rev_${b.id}`] = 0;
      bucket[dk][`ord_${b.id}`] = 0;
    }
  }

  for (const order of orders) {
    const dk = new Date(order.createdAt).toISOString().split('T')[0];
    if (!bucket[dk]) continue;
    const revKey = `rev_${order.branchId}`;
    const ordKey = `ord_${order.branchId}`;
    if (revKey in bucket[dk]) {
      bucket[dk][revKey] += order.total || 0;
      bucket[dk][ordKey] += 1;
    }
  }

  return {
    branches,
    series: dateKeys.map((dk) => bucket[dk]),
  };
};

module.exports = {
  getRevenueSummary,
  getRevenueChart,
  getBranchCompareData,
  getBranchStats,
  getBranchRevenue,
  getSalesReport,
  getBranchPerformanceChart,
};
