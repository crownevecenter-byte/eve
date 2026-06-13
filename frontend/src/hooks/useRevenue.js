// frontend/src/hooks/useRevenue.js
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useRevenueSummary = (branchId) => useQuery({
  queryKey: ['revenue-summary', branchId],
  queryFn: () => api.get('/reports/revenue/summary', { params: { branchId } }).then(r => r.data),
  staleTime: 10 * 60 * 1000,
  enabled: !!branchId,
});

export const useRevenueChart = (branchId, period = '30d') => useQuery({
  queryKey: ['revenue-chart', branchId, period],
  queryFn: () => api.get('/reports/revenue/chart', { params: { branchId, period } }).then(r => r.data),
  staleTime: 10 * 60 * 1000,
  enabled: !!branchId,
});

export const useBranchComparison = (period = 'month') => useQuery({
  queryKey: ['branch-comparison', period],
  queryFn: () => api.get('/reports/branches/compare', { params: { period } }).then(r => r.data),
  staleTime: 10 * 60 * 1000,
});
