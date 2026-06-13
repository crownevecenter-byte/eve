// frontend/src/hooks/useOrders.js
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '../services/api';

export const useOrders = ({ branchId, page = 1, status = '', limit = 10 }) => {
  return useQuery({
    queryKey: ['orders', branchId, page, status],
    queryFn: () => api.get('/orders', { params: { branchId, page, status, limit } }).then(r => r.data),
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useOrderCount = (branchId, status = 'PENDING') => {
  return useQuery({
    queryKey: ['order-count', branchId, status],
    queryFn: () => api.get('/orders/count', { params: { branchId, status } }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: !!branchId,
  });
};

export const useMyOrders = () => {
  return useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders/my').then(r => r.data),
  });
};
