// frontend/src/components/widgets/owner/ServiceOrdersCard.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { Wrench } from 'lucide-react';
import CardSkeleton from '../../skeletons/CardSkeleton';

const ServiceOrdersCard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['global-orders-count'],
    queryFn: () => api.get('/orders/count').then(r => r.data),
  });

  if (isLoading) return <CardSkeleton />;

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl group hover:border-blue-500/50 transition-all">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Service Orders</p>
        <Wrench className="text-amber-400" size={20} />
      </div>
      <h3 className="text-3xl font-black mt-2 text-orange-600">{data?.count || 0}</h3>
      <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">Total Maintenance & Repairs</p>
    </div>
  );
};

export default ServiceOrdersCard;

