import React from 'react';
import { useInventoryAlerts } from '../../hooks/useInventory';
import { AlertTriangle, Package } from 'lucide-react';

const StockAlerts = ({ branchId }) => {
  const { data, isLoading } = useInventoryAlerts(branchId);

  if (isLoading) return <div className="h-32 bg-slate-900 animate-pulse rounded-3xl" />;

  const alertsCount = data?.length || 0;

  return (
    <div className={`bg-slate-900 border p-6 rounded-3xl transition-all ${alertsCount > 0 ? 'border-amber-500/50 shadow-lg shadow-amber-500/5' : 'border-slate-800'}`}>
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">Low Stock Items</p>
        <AlertTriangle className={alertsCount > 0 ? 'text-amber-400' : 'text-slate-500'} size={20} />
      </div>
      <h3 className="text-3xl font-bold mt-2">{alertsCount}</h3>
      <p className="text-xs text-slate-500 mt-2">Threshold varies by part type</p>
    </div>
  );
};

export default StockAlerts;
