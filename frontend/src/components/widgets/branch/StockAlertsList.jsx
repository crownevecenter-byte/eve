// frontend/src/components/widgets/branch/StockAlertsList.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { AlertTriangle, ArrowRight } from 'lucide-react';

const StockAlertsList = ({ branchId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['branch-inventory-alerts-list', branchId],
    queryFn: () => api.get('/inventory/alerts', { params: { branchId, limit: 5 } }).then(r => r.data),
    enabled: !!branchId,
  });

  if (isLoading) return <div className="h-64 bg-slate-900 animate-pulse rounded-[3rem]" />;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 space-y-8">
      <h3 className="text-2xl font-bold flex items-center">
        <AlertTriangle className="mr-3 text-red-500" /> Critical Stock
      </h3>
      <div className="space-y-4">
        {data?.length > 0 ? data.map(item => (
          <div key={item.id} className="flex items-center justify-between p-4 bg-slate-950 border border-red-900/20 rounded-2xl group hover:border-red-900/50 transition-all">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-red-900/10 rounded-xl flex items-center justify-center text-red-500">
                {item.stock}
              </div>
              <div>
                <p className="text-sm font-bold">{item.part?.name}</p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Alert at {item.alertAt} units</p>
              </div>
            </div>
            <button className="p-3 bg-red-900/10 text-red-500 rounded-xl hover:bg-red-900 hover:text-orange-600 transition-all">
              Reorder
            </button>
          </div>
        )) : (
          <p className="text-slate-500 text-center py-10">All stock levels are optimal.</p>
        )}
      </div>
    </div>
  );
};

export default StockAlertsList;
