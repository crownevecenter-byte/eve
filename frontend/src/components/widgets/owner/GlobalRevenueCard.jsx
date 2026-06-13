// frontend/src/components/widgets/owner/GlobalRevenueCard.jsx
import React from 'react';
import { useRevenueSummary } from '../../../hooks/useRevenue';
import { TrendingUp } from 'lucide-react';
import CardSkeleton from '../../skeletons/CardSkeleton';

const GlobalRevenueCard = () => {
  const { data, isLoading } = useRevenueSummary();

  if (isLoading) return <CardSkeleton />;

  return (
    <div className="bg-[#1A1A1A] border border-[rgba(255,77,0,0.15)] p-6 rounded-none group hover:border-[#FF4D00] transition-all relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-[#FF4D00] scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
      <div className="flex items-center justify-between">
        <p className="text-[#888] text-[10px] font-bold uppercase tracking-[0.2em]">Global Revenue</p>
        <TrendingUp className="text-[#FF4D00]" size={16} />
      </div>
      <h3 className="text-3xl font-family-bebas mt-4 text-orange-600 tracking-wider">PKR {data?.total.toLocaleString()}</h3>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] text-[#FF4D00] font-bold">+ {((data?.today / (data?.total || 1)) * 100).toFixed(1)}%</span>
        <span className="text-[10px] text-[#888] uppercase tracking-tighter">Growth Today</span>
      </div>
    </div>
  );
};

export default GlobalRevenueCard;
