// frontend/src/components/widgets/branch/RecentOrdersTable.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { ShoppingCart, ArrowRight } from 'lucide-react';

const RecentOrdersTable = ({ branchId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['branch-recent-orders', branchId],
    queryFn: () => api.get('/orders', { params: { branchId, limit: 5, page: 1 } }).then(r => r.data),
    enabled: !!branchId,
  });

  if (isLoading) return <div className="h-64 bg-slate-900 animate-pulse rounded-[3rem]" />;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold flex items-center">
          <ShoppingCart className="mr-3 text-amber-500" /> Recent Sales
        </h3>
        <button className="text-xs text-blue-400 font-bold hover:underline">View All</button>
      </div>
      <div className="space-y-4">
        {data?.data.map(order => (
          <div key={order.id} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all group">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black italic">
                #{order.id}
              </div>
              <div>
                <p className="text-sm font-bold truncate w-32">{order.customer?.name}</p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{order.type}</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <span className="font-black text-emerald-400">${order.total.toLocaleString()}</span>
              <ArrowRight size={16} className="text-slate-700 group-hover:text-blue-500 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentOrdersTable;
