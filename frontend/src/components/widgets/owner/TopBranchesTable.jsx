// frontend/src/components/widgets/owner/TopBranchesTable.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { Activity } from 'lucide-react';

const TopBranchesTable = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['top-branches'],
    queryFn: () => api.get('/branches/top').then(r => r.data),
  });

  if (isLoading) return <div className="h-64 bg-slate-900 animate-pulse rounded-[3rem]" />;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 space-y-8">
      <h3 className="text-2xl font-bold flex items-center">
        <Activity className="mr-3 text-emerald-500" /> Performance Leaders
      </h3>
      <div className="space-y-6">
        {data?.map((branch, i) => (
          <div key={branch.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center font-bold text-blue-500 border border-slate-800">
                {i + 1}
              </div>
              <div>
                <p className="font-bold">{branch.name}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">{branch.location}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-emerald-400">{branch._count.orders} orders</p>
              <div className="w-20 h-1 bg-slate-800 rounded-full mt-1">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${100 - i * 15}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopBranchesTable;
