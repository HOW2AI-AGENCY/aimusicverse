/**
 * SettingsSkeleton - Loading state for Settings page
 * Shown while user profile is being loaded
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Settings as SettingsIcon } from 'lucide-react';

export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <Skeleton className="h-6 w-32 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 flex-1 rounded-md" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}
