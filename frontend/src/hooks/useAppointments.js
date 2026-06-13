// frontend/src/hooks/useAppointments.js
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useAppointments = ({ branchId, page = 1, limit = 10 }) => {
  return useQuery({
    queryKey: ['appointments', branchId, page],
    queryFn: () => api.get('/appointments', { params: { branchId, page, limit } }).then(r => r.data),
    enabled: !!branchId,
  });
};

export const useTodayAppointments = (branchId) => {
  return useQuery({
    queryKey: ['appointments-today', branchId],
    queryFn: () => api.get('/appointments/today', { params: { branchId } }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
};

export const useTechServices = (techId, branchId) => {
  return useQuery({
    queryKey: ['tech-services', techId],
    queryFn: () => api.get('/appointments/today', { params: { branchId, techId } }).then(r => r.data),
    enabled: !!techId,
  });
};

export const useMyBookings = () => {
  return useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => api.get('/appointments/my').then(r => r.data),
  });
};
