// frontend/src/components/skeletons/TableSkeleton.jsx
import React from 'react';

const TableSkeleton = () => (
  <div className="bg-[#1A1A1A] border border-white/5 p-6 animate-pulse">
    <div className="w-48 h-6 bg-white/10 mb-8" />
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex-1 h-12 bg-white/5" />
          <div className="flex-1 h-12 bg-white/5" />
          <div className="flex-1 h-12 bg-white/5" />
        </div>
      ))}
    </div>
  </div>
);

export default TableSkeleton;
