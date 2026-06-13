import React from 'react';

/** Lightweight loading placeholder for lazy routes and data fetches */
const PageSkeleton = ({ rows = 4 }) => (
  <div className="min-h-[40vh] p-6 animate-pulse space-y-4" aria-busy="true" aria-label="Loading">
    <div className="h-8 bg-gray-200 rounded w-1/3 max-w-xs" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-24 bg-gray-100 rounded-xl" />
      ))}
    </div>
    <div className="h-48 bg-gray-100 rounded-xl" />
  </div>
);

export default PageSkeleton;
