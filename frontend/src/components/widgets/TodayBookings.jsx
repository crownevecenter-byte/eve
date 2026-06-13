import React from 'react';
import { useAppointments } from '../../hooks/useAppointments';
import { Calendar } from 'lucide-react';

const TodayBookings = ({ branchId }) => {
  const { data, isLoading } = useAppointments({ branchId, status: 'BOOKED' });

  if (isLoading) return <div className="h-32 bg-slate-900 animate-pulse rounded-3xl" />;

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">Upcoming Bookings</p>
        <Calendar className="text-emerald-400" size={20} />
      </div>
      <h3 className="text-3xl font-bold mt-2">{data?.meta.total || 0}</h3>
      <p className="text-xs text-slate-500 mt-2">Next appointment in 45m</p>
    </div>
  );
};

export default TodayBookings;
