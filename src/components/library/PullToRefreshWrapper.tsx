/**
 * PullToRefreshWrapper - Pull-to-refresh container for Library page
 * Provides native-feeling refresh gesture for mobile
 */

import { memo, ReactNode } from 'react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/ui/pull-to-refresh-indicator';
import { cn } from '@/lib/utils';

interface PullToRefreshWrapperProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  disabled?: boolean;
}

export const PullToRefreshWrapper = memo(function PullToRefreshWrapper({
  children,
  onRefresh,
  className,
  disabled = false,
}: PullToRefreshWrapperProps) {
  const { containerRef, pullDistance, isRefreshing, isPulling, progress } = usePullToRefresh({
    onRefresh,
    enabled: !disabled,
    threshold: 80,
  });

  return (
    <div className={cn("relative min-h-full", className)}>
      {/* Pull indicator */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        isPulling={isPulling}
        progress={progress}
      />

      {/* Content with pull offset - no overflow restrictions */}
      <div
        ref={containerRef}
        className="min-h-full"
        style={{
          transform: isPulling ? `translateY(${pullDistance * 0.5}px)` : undefined,
          transition: !isPulling ? 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
});
