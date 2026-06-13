// frontend/src/components/widgets/branch/TodayBookingsCard.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { Calendar } from 'lucide-react';
import CardSkeleton from '../../skeletons/CardSkeleton';

const TodayBookingsCard = ({ branchId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['branch-today-bookings-count', branchId],
    queryFn: () => api.get('/appointments/today', { params: { branchId } }).then(r => r.data),
    enabled: !!branchId,
  });

  if (isLoading) return <CardSkeleton />;

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl group hover:border-blue-500/50 transition-all">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Today's Bookings</p>
        <Calendar className="text-blue-400" size={20} />
      </div>
      <h3 className="text-3xl font-black mt-2 text-orange-600">{data?.length || 0}</h3>
      <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">Scheduled Services</p>
    </div>
  );
};

export default TodayBookingsCard;
