// frontend/src/components/widgets/branch/TodayAppointmentsList.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { Clock, User, Wrench } from 'lucide-react';

const TodayAppointmentsList = ({ branchId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['branch-today-appointments', branchId],
    queryFn: () => api.get('/appointments/today', { params: { branchId } }).then(r => r.data),
    enabled: !!branchId,
  });

  if (isLoading) return <div className="h-64 bg-slate-900 animate-pulse rounded-[3rem]" />;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 space-y-8">
      <h3 className="text-2xl font-bold flex items-center">
        <Clock className="mr-3 text-blue-500" /> Today's Schedule
      </h3>
      <div className="space-y-6">
        {data?.length > 0 ? data.map(app => (
          <div key={app.id} className="flex items-center justify-between group">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-blue-400">
                <Wrench size={18} />
              </div>
              <div>
                <p className="font-bold">{app.service?.name}</p>
                <p className="text-[10px] text-slate-500 flex items-center font-bold uppercase tracking-widest">
                  <User size={10} className="mr-1" /> {app.customer?.name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-orange-600">{new Date(app.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{app.status}</p>
            </div>
          </div>
        )) : (
          <p className="text-slate-500 text-center py-10">No appointments scheduled for today.</p>
        )}
      </div>
    </div>
  );
};

export default TodayAppointmentsList;
