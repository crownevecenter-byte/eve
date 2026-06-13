// backend/src/modules/reports/report.routes.js
const router = require('express').Router();
const ctrl = require('./report.controller');
const { protect } = require('../../middleware/auth');
const { allow } = require('../../middleware/rbac');

const branchReportRoles = ['BRANCH_OWNER', 'BRANCH_MANAGER', 'COMPANY_OWNER', 'EMPLOYEE', 'TECHNICIAN'];

router.get('/owner-dashboard', protect, allow('COMPANY_OWNER'), ctrl.getOwnerDashboard);
router.get('/owner-analytics-bundle', protect, allow('COMPANY_OWNER'), ctrl.getOwnerAnalyticsBundle);
router.get('/branch-dashboard', protect, allow(...branchReportRoles), ctrl.getBranchDashboard);
router.get('/branch-analytics-bundle', protect, allow(...branchReportRoles), ctrl.getBranchAnalyticsBundle);
router.get('/revenue/summary', protect, allow(...branchReportRoles), ctrl.getRevenueSummary);
router.get('/revenue/chart',   protect, allow(...branchReportRoles), ctrl.getRevenueChart);
router.get('/branches/compare', protect, allow('COMPANY_OWNER'), ctrl.compareBranches);
router.get('/branches/performance-chart', protect, allow('COMPANY_OWNER'), ctrl.getBranchPerformanceChart);
router.get('/branch/:id',      protect, allow(...branchReportRoles), ctrl.getBranch);
router.get('/sales/:id',       protect, allow(...branchReportRoles), ctrl.getSales);

module.exports = router;
