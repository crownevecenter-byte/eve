// frontend/src/components/ui/Badge.jsx
import React from 'react';

const Badge = ({ children, status }) => {
  const styles = {
    PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    CANCELLED: 'bg-red-500/10 text-red-400 border-red-900/20',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    BOOKED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status] || 'bg-slate-800 text-slate-400'}`}>
      {children || status}
    </span>
  );
};

export default Badge;
