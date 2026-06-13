import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useRevenueSummary = (branchId) =>
  useQuery({
    queryKey: ['revenue-summary', branchId],
    queryFn: () => 
      api.get('/reports/revenue/summary', { params: { branchId } })
         .then(r => r.data),
    staleTime: 10 * 60 * 1000,
    enabled: !!branchId,
  });

export const useBranchStats = (branchId) =>
  useQuery({
    queryKey: ['branch-stats', branchId],
    queryFn: () => 
      api.get(`/reports/branch/${branchId}`)
         .then(r => r.data),
    staleTime: 10 * 60 * 1000,
    enabled: !!branchId,
  });
