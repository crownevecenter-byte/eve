// frontend/src/components/ui/StatCard.jsx
import React from 'react';

const StatCard = ({ label, value, icon, color = 'blue', trend }) => {
  const colors = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20 hover:border-blue-500/50',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:border-amber-500/50',
    red: 'text-red-400 bg-red-500/10 border-red-500/20 hover:border-red-500/50',
  };

  return (
    <div className={`bg-slate-900 border p-6 rounded-3xl group transition-all ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{label}</p>
        <div className={`p-2 rounded-xl bg-slate-950 border border-slate-800 transition-colors group-hover:text-inherit`}>
          {icon}
        </div>
      </div>
      <h3 className="text-3xl font-black mt-3 text-orange-600">{value}</h3>
      {trend && (
        <p className={`text-[10px] font-bold mt-2 uppercase tracking-tighter ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend.positive ? '↑' : '↓'} {trend.value} <span className="text-slate-500 ml-1">vs last month</span>
        </p>
      )}
    </div>
  );
};

export default StatCard;
