import React from 'react';
import { useOrderCount } from '../../hooks/useOrders';
import { ShoppingCart } from 'lucide-react';

const OrderBadge = ({ branchId }) => {
  const { data, isLoading } = useOrderCount(branchId, 'PENDING');

  if (isLoading) return <div className="h-32 bg-slate-900 animate-pulse rounded-3xl" />;

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">Pending Orders</p>
        <ShoppingCart className="text-amber-400" size={20} />
      </div>
      <h3 className="text-3xl font-bold mt-2">{data?.count || 0}</h3>
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-all">
        <ShoppingCart size={80} />
      </div>
    </div>
  );
};

export default OrderBadge;
