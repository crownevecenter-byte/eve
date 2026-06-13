// frontend/src/components/skeletons/CardSkeleton.jsx
import React from 'react';

const CardSkeleton = () => (
  <div className="bg-[#1A1A1A] border border-white/5 p-6 animate-pulse">
    <div className="flex justify-between mb-4">
      <div className="w-24 h-3 bg-white/10" />
      <div className="w-5 h-5 bg-white/10 rounded-full" />
    </div>
    <div className="w-32 h-8 bg-white/10 mb-4" />
    <div className="w-20 h-3 bg-white/10" />
  </div>
);

export default CardSkeleton;
