// frontend/src/components/widgets/owner/BranchComparisonChart.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { TrendingUp } from 'lucide-react';

const BranchComparisonChart = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['branch-comparison'],
    queryFn: () => api.get('/reports/branches/compare').then(r => r.data),
  });

  if (isLoading) return <div className="h-64 bg-slate-900 animate-pulse rounded-[3rem]" />;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold flex items-center">
          <TrendingUp className="mr-3 text-blue-500" /> Revenue Comparison
        </h3>
      </div>
      <div className="h-64 flex items-end justify-between px-4 gap-4">
        {data?.map((item, i) => (
          <div key={i} className="flex-1 space-y-4 group">
            <div 
              className="w-full bg-blue-600/20 hover:bg-blue-500 rounded-2xl transition-all relative" 
              style={{ height: `${Math.min(100, (item.revenue / 10000) * 100)}%` }}
            >
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">
                ${item.revenue.toLocaleString()}
              </div>
            </div>
            <p className="text-center text-[10px] font-bold text-slate-600 truncate">{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BranchComparisonChart;
