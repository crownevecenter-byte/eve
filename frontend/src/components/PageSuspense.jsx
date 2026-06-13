import React, { Suspense } from 'react';

const ContentSkeleton = () => (
  <div className="min-h-[50vh] flex items-center justify-center py-16">
    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const PageSuspense = ({ children }) => (
  <Suspense fallback={<ContentSkeleton />}>{children}</Suspense>
);

export default PageSuspense;
