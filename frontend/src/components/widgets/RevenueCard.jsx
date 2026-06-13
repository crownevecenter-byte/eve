import React from 'react';
import { useRevenueSummary } from '../../hooks/useReports';
import { DollarSign } from 'lucide-react';

const RevenueCard = ({ branchId }) => {
  const { data, isLoading, isError } = useRevenueSummary(branchId);

  if (isLoading) return <div className="h-32 bg-slate-900 animate-pulse rounded-3xl" />;
  if (isError) return <div className="h-32 bg-slate-900 rounded-3xl flex items-center justify-center text-red-500">Error loading revenue</div>;

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">Revenue Today</p>
        <DollarSign className="text-blue-400" size={20} />
      </div>
      <h3 className="text-3xl font-bold mt-2">${data.today.toLocaleString()}</h3>
      <p className="text-xs text-slate-500 mt-2">This Month: ${data.thisMonth.toLocaleString()}</p>
    </div>
  );
};

export default RevenueCard;
