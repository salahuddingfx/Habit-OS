import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 w-full animate-skeleton">
      <div className="h-10 bg-border-slate/50 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 bg-border-slate/50 rounded-xl"></div>
        <div className="h-32 bg-border-slate/50 rounded-xl"></div>
        <div className="h-32 bg-border-slate/50 rounded-xl"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-64 bg-border-slate/50 rounded-xl lg:col-span-2"></div>
        <div className="h-64 bg-border-slate/50 rounded-xl"></div>
      </div>
    </div>
  );
}

export function GoalSkeleton() {
  return (
    <div className="space-y-6 w-full animate-skeleton">
      <div className="h-10 bg-border-slate/50 rounded w-1/3"></div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map(idx => (
          <div key={idx} className="h-20 bg-border-slate/50 rounded-lg flex items-center justify-between px-6">
            <div className="flex items-center space-x-4 w-1/2">
              <div className="h-10 w-10 bg-border-slate/70 rounded-full"></div>
              <div className="space-y-2 w-full">
                <div className="h-4 bg-border-slate/70 rounded w-1/3"></div>
                <div className="h-3 bg-border-slate/70 rounded w-2/3"></div>
              </div>
            </div>
            <div className="h-8 bg-border-slate/70 rounded w-1/6"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-6 w-full animate-skeleton">
      <div className="h-10 bg-border-slate/50 rounded w-1/4"></div>
      <div className="space-y-3">
        {[1, 2, 3, 5, 6].map(idx => (
          <div key={idx} className="h-16 bg-border-slate/50 rounded-lg flex items-center justify-between px-6">
            <div className="flex items-center space-x-4 w-1/2">
              <div className="h-6 w-6 bg-border-slate/70 rounded flex items-center justify-center"></div>
              <div className="h-8 w-8 bg-border-slate/70 rounded-full"></div>
              <div className="h-4 bg-border-slate/70 rounded w-1/2"></div>
            </div>
            <div className="flex space-x-4">
              <div className="h-6 bg-border-slate/70 rounded w-16"></div>
              <div className="h-6 bg-border-slate/70 rounded w-12"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="space-y-6 w-full animate-skeleton">
      <div className="h-10 bg-border-slate/50 rounded w-1/4"></div>
      <div className="space-y-6 relative border-l border-border-slate ml-4 pl-6">
        {[1, 2, 3].map(idx => (
          <div key={idx} className="space-y-2 relative">
            <div className="absolute -left-[31px] top-1 h-5 w-5 bg-border-slate/70 rounded-full"></div>
            <div className="h-5 bg-border-slate/50 rounded w-1/3"></div>
            <div className="h-4 bg-border-slate/50 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 w-full animate-skeleton">
      <div className="h-10 bg-border-slate/50 rounded w-1/4"></div>
      <div className="h-48 bg-border-slate/50 rounded-lg"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64 bg-border-slate/50 rounded-lg"></div>
        <div className="h-64 bg-border-slate/50 rounded-lg"></div>
      </div>
    </div>
  );
}
