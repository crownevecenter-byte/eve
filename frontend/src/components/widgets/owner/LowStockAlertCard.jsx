// frontend/src/components/widgets/owner/LowStockAlertCard.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { AlertTriangle } from 'lucide-react';
import CardSkeleton from '../../skeletons/CardSkeleton';

const LowStockAlertCard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['global-inventory-alerts'],
    queryFn: () => api.get('/inventory/alerts', { params: { global: true } }).then(r => r.data),
  });

  if (isLoading) return <CardSkeleton />;

  const alertCount = data?.length || 0;

  return (
    <div className={`bg-slate-900 border p-6 rounded-3xl transition-all ${alertCount > 0 ? 'border-red-900/50' : 'border-slate-800'}`}>
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Stock Alerts</p>
        <AlertTriangle className={alertCount > 0 ? 'text-red-500' : 'text-slate-500'} size={20} />
      </div>
      <h3 className="text-3xl font-black mt-2 text-orange-600">{alertCount}</h3>
      <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">Critical Low Levels</p>
    </div>
  );
};

export default LowStockAlertCard;
