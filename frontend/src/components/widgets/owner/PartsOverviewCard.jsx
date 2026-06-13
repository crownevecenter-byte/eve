// frontend/src/components/widgets/owner/PartsOverviewCard.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { Package } from 'lucide-react';
import CardSkeleton from '../../skeletons/CardSkeleton';

const PartsOverviewCard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['parts-count'],
    queryFn: () => api.get('/parts/count').then(r => r.data),
  });

  if (isLoading) return <CardSkeleton />;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 space-y-8 group hover:border-amber-500/50 transition-all">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold flex items-center">
          <Package className="mr-3 text-amber-500" /> Global Catalog
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total SKUs</p>
          <h4 className="text-4xl font-black">{data?.count || 0}</h4>
        </div>
        <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Growth</p>
          <h4 className="text-4xl font-black text-emerald-500">+12%</h4>
        </div>
      </div>
    </div>
  );
};

export default PartsOverviewCard;
