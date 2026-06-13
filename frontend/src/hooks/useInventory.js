// frontend/src/hooks/useInventory.js
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useInventory = (branchId, page = 1) => {
  return useQuery({
    queryKey: ['inventory', branchId, page],
    queryFn: () => api.get('/inventory', { params: { branchId, page, limit: 12 } }).then(r => r.data),
    enabled: !!branchId,
  });
};

export const useInventoryAlerts = (branchId, global = false) => {
  return useQuery({
    queryKey: ['inventory-alerts', branchId, global],
    queryFn: () => api.get('/inventory/alerts', { params: { branchId, global } }).then(r => r.data),
    staleTime: 10 * 60 * 1000,
  });
};
