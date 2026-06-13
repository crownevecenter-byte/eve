// frontend/src/components/widgets/owner/RecentActivityFeed.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { Activity } from 'lucide-react';

const RecentActivityFeed = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => api.get('/orders', { params: { limit: 5 } }).then(r => r.data),
  });

  if (isLoading) return <div className="h-64 bg-slate-900 animate-pulse rounded-[3rem]" />;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 space-y-8">
      <h3 className="text-2xl font-bold flex items-center">
        <Activity className="mr-3 text-blue-500" /> Live Feed
      </h3>
      <div className="space-y-6">
        {data?.data.map((order, i) => (
          <div key={order.id} className="flex space-x-4">
            <div className={`w-2 h-2 mt-2 rounded-full shadow-lg ${
              order.status === 'COMPLETED' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-blue-500 shadow-blue-500/50'
            }`} />
            <div>
              <p className="text-sm font-medium">
                Order <span className="text-blue-400">#{order.id}</span> {order.status.toLowerCase()} by <span className="text-orange-600">{order.customer?.name}</span>
              </p>
              <p className="text-[10px] text-slate-600 font-bold uppercase mt-1">
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivityFeed;
