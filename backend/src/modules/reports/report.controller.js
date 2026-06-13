// backend/src/modules/reports/report.controller.js
const Report = require('./report.model');
const Order = require('../orders/order.model');
const Booking = require('../service-bookings/booking.model');
const Inventory = require('../inventory/inventory.model');
const prisma = require('../../config/db');
const { getAdapterMode } = require('../../config/db');
const resolveBranchId = (req) => {
  const role = req.user.role;
  if (role === 'BRANCH_OWNER' || role === 'BRANCH_MANAGER' || role === 'EMPLOYEE' || role === 'TECHNICIAN') {
    return req.user.branchId;
  }
  const requested = Number(req.query.branchId);
  return Number.isFinite(requested) ? requested : null;
};

exports.getRevenueSummary = async (req, res) => {
  try {
    const query = { ...req.query };
    if (req.user.role === 'BRANCH_OWNER') {
      if (query.branchId && Number(query.branchId) !== req.user.branchId) {
        return res.status(403).json({ message: 'Access denied to other branch reports' });
      }
      query.branchId = req.user.branchId;
    }
    const result = await Report.getRevenueSummary(query);
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getRevenueChart = async (req, res) => {
  try {
    const query = { ...req.query };
    if (req.user.role === 'BRANCH_OWNER') {
      query.branchId = req.user.branchId;
    }
    const days = query.period === '30d' ? 30 : 7;
    const result = await Report.getRevenueChart({ branchId: query.branchId, days });
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getBranchPerformanceChart = async (req, res) => {
  try {
    const days = req.query.period === '30d' ? 30 : 7;
    const result = await Report.getBranchPerformanceChart({ days });
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.compareBranches = async (req, res) => {
  try {
    const data = await Report.getBranchCompareData();
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const staffBranchRoles = ['BRANCH_OWNER', 'BRANCH_MANAGER', 'EMPLOYEE', 'TECHNICIAN'];

exports.getBranch = async (req, res) => {
  try {
    const branchId = Number(req.params.id);
    if (!Number.isFinite(branchId)) {
      return res.status(400).json({ message: 'Invalid branch id' });
    }

    if (staffBranchRoles.includes(req.user.role) && branchId !== req.user.branchId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, name: true, location: true },
    });
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    const isHttp = getAdapterMode() === 'http';
    let orderGroups, revenue, totalAppointments;

    if (isHttp) {
      orderGroups = await prisma.order.groupBy({
        by: ['status'],
        where: { branchId },
        _count: { id: true },
      });
      revenue = await Report.getBranchRevenue(branchId);
      totalAppointments = await prisma.serviceBooking.count({ where: { branchId } });
    } else {
      [orderGroups, revenue, totalAppointments] = await Promise.all([
        prisma.order.groupBy({
          by: ['status'],
          where: { branchId },
          _count: { id: true },
        }),
        Report.getBranchRevenue(branchId),
        prisma.serviceBooking.count({ where: { branchId } }),
      ]);
    }

    const countByStatus = (status) =>
      orderGroups.find((g) => g.status === status)?._count.id || 0;

    const totalOrders = orderGroups.reduce((sum, g) => sum + g._count.id, 0);

    res.json({
      ...branch,
      totalOrders,
      completedOrders: countByStatus('COMPLETED'),
      pendingOrders: countByStatus('PENDING'),
      totalAppointments,
      revenue: revenue._sum.total || 0,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getSales = async (req, res) => {
  try {
    const data = await Report.getSalesReport(Number(req.params.id));
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/** One request for branch dashboard — avoids 6 parallel calls and Hostinger/Vercel 429. */
exports.getBranchDashboard = async (req, res) => {
  try {
    const branchId = resolveBranchId(req);
    if (!branchId) {
      return res.status(400).json({ message: 'branchId is required for this dashboard.' });
    }

    const isHttp = getAdapterMode() === 'http';

    let revSummary, chartData, pendingCount, todayAppts, stockAlerts, recentOrders;

    if (isHttp) {
      revSummary = await Report.getRevenueSummary({ branchId });
      chartData = await Report.getRevenueChart({ branchId, days: 7 });
      pendingCount = await Order.countOrders({ branchId, status: 'PENDING' });
      todayAppts = await Booking.getTodayBookings(branchId);
      stockAlerts = await Inventory.getAlerts(branchId, false);
      recentOrders = await Order.getOrders({ branchId, page: 1, limit: 5 });
    } else {
      [revSummary, chartData, pendingCount, todayAppts, stockAlerts, recentOrders] =
        await Promise.all([
          Report.getRevenueSummary({ branchId }),
          Report.getRevenueChart({ branchId, days: 7 }),
          Order.countOrders({ branchId, status: 'PENDING' }),
          Booking.getTodayBookings(branchId),
          Inventory.getAlerts(branchId, false),
          Order.getOrders({ branchId, page: 1, limit: 5 }),
        ]);
    }

    res.json({
      revSummary,
      chartData,
      pendingOrders: { count: pendingCount },
      todayAppts,
      stockAlerts,
      recentOrders,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/** One request for owner dashboard — replaces 7 parallel client calls. */
exports.getOwnerDashboard = async (req, res) => {
  try {
    const isHttp = getAdapterMode() === 'http';

    let branchCount, partsCount, orderCount, revSummary, topBranches, compareData, recentOrders;

    if (isHttp) {
      const countRow = await prisma.$queryRaw`
        SELECT
          (SELECT COUNT(*)::int FROM "Branch") AS branches,
          (SELECT COUNT(*)::int FROM "Part") AS parts,
          (SELECT COUNT(*)::int FROM "Order") AS orders
      `;
      branchCount = countRow[0]?.branches ?? 0;
      partsCount = countRow[0]?.parts ?? 0;
      orderCount = countRow[0]?.orders ?? 0;
      revSummary = await Report.getRevenueSummary({});
      topBranches = await prisma.branch.findMany({
        take: 5,
        include: { _count: { select: { orders: true } } },
        orderBy: { orders: { _count: 'desc' } },
      });
      compareData = await Report.getBranchCompareData();
      recentOrders = await prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true } },
          walkInCustomer: { select: { first_name: true, last_name: true } },
          branch: { select: { name: true } },
        },
      });
    } else {
      [
        branchCount,
        partsCount,
        orderCount,
        revSummary,
        topBranches,
        compareData,
        recentOrders,
      ] = await Promise.all([
        prisma.branch.count(),
        prisma.part.count(),
        prisma.order.count(),
        Report.getRevenueSummary({}),
        prisma.branch.findMany({
          take: 5,
          include: { _count: { select: { orders: true } } },
          orderBy: { orders: { _count: 'desc' } },
        }),
        Report.getBranchCompareData(),
        prisma.order.findMany({
          take: 6,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { name: true } },
            walkInCustomer: { select: { first_name: true, last_name: true } },
            branch: { select: { name: true } },
          },
        }),
      ]);
    }

    res.json({
      branchCount,
      partsCount,
      orderCount,
      revSummary,
      topBranches,
      compareData,
      recentOrders,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/** One request for owner analytics page — replaces 5 staggered client calls. */
exports.getOwnerAnalyticsBundle = async (req, res) => {
  try {
    const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
    const days = req.query.period === '30d' ? 30 : 7;
    const isHttp = getAdapterMode() === 'http';

    let summary, chart, compare, performanceChart, branches;

    if (isHttp) {
      summary = await Report.getRevenueSummary({ branchId });
      chart = await Report.getRevenueChart({ branchId, days });
      compare = await Report.getBranchCompareData();
      performanceChart = await Report.getBranchPerformanceChart({ days });
      branches = await prisma.branch.findMany({
        take: 100,
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
    } else {
      [summary, chart, compare, performanceChart, branches] = await Promise.all([
        Report.getRevenueSummary({ branchId }),
        Report.getRevenueChart({ branchId, days }),
        Report.getBranchCompareData(),
        Report.getBranchPerformanceChart({ days }),
        prisma.branch.findMany({
          take: 100,
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        }),
      ]);
    }

    res.json({
      summary,
      chart,
      compare,
      performanceChart,
      branches: { data: branches },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/** One request for branch analytics page — replaces 4 staggered client calls. */
exports.getBranchAnalyticsBundle = async (req, res) => {
  try {
    const branchId = resolveBranchId(req);
    if (!branchId) {
      return res.status(400).json({ message: 'branchId is required.' });
    }

    const days = req.query.period === '30d' ? 30 : 7;
    const isHttp = getAdapterMode() === 'http';

    let summary, chart, branchReport, sales;

    if (isHttp) {
      summary = await Report.getRevenueSummary({ branchId });
      chart = await Report.getRevenueChart({ branchId, days });
      branchReport = await exports.getBranchReportData(branchId);
      sales = await Report.getSalesReport(branchId);
    } else {
      [summary, chart, branchReport, sales] = await Promise.all([
        Report.getRevenueSummary({ branchId }),
        Report.getRevenueChart({ branchId, days }),
        exports.getBranchReportData(branchId),
        Report.getSalesReport(branchId),
      ]);
    }

    res.json({ summary, chart, branchReport, sales });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/** Internal helper — branch stats block for analytics bundle. */
exports.getBranchReportData = async (branchId) => {
  const isHttp = getAdapterMode() === 'http';
  let orderGroups, revenue, totalAppointments;

  if (isHttp) {
    orderGroups = await prisma.order.groupBy({
      by: ['status'],
      where: { branchId },
      _count: { id: true },
    });
    revenue = await Report.getBranchRevenue(branchId);
    totalAppointments = await prisma.serviceBooking.count({ where: { branchId } });
  } else {
    [orderGroups, revenue, totalAppointments] = await Promise.all([
      prisma.order.groupBy({
        by: ['status'],
        where: { branchId },
        _count: { id: true },
      }),
      Report.getBranchRevenue(branchId),
      prisma.serviceBooking.count({ where: { branchId } }),
    ]);
  }

  const countByStatus = (status) =>
    orderGroups.find((g) => g.status === status)?._count.id || 0;

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { id: true, name: true, location: true },
  });

  return {
    ...branch,
    totalOrders: orderGroups.reduce((sum, g) => sum + g._count.id, 0),
    completedOrders: countByStatus('COMPLETED'),
    pendingOrders: countByStatus('PENDING'),
    totalAppointments,
    revenue: revenue._sum.total || 0,
  };
};
