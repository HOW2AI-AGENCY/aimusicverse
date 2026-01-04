/**
 * StudioSkeletons - Loading skeleton components for studio
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

// Base skeleton element
const Skeleton = ({ className, style }: SkeletonProps) => (
  <div 
    className={cn(
      "animate-pulse rounded bg-muted/60",
      className
    )}
    style={style}
  />
);

/**
 * Skeleton for a single track row
 */
export const TrackRowSkeleton = memo(function TrackRowSkeleton({ 
  className 
}: SkeletonProps) {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 h-14 rounded-lg border border-border/30 bg-card/50 px-3",
        className
      )}
    >
      {/* Track icon */}
      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
      
      {/* Track name */}
      <Skeleton className="w-20 h-4" />
      
      {/* Mute/Solo buttons */}
      <div className="flex gap-1 ml-auto">
        <Skeleton className="w-8 h-8 rounded" />
        <Skeleton className="w-8 h-8 rounded" />
      </div>
      
      {/* Waveform placeholder */}
      <Skeleton className="flex-1 h-8 rounded" />
    </div>
  );
});

/**
 * Skeleton for the timeline ruler
 */
export const TimelineRulerSkeleton = memo(function TimelineRulerSkeleton({ 
  className 
}: SkeletonProps) {
  return (
    <div className={cn("h-6 border-b border-border/30 flex items-center gap-8 px-4", className)}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="w-8 h-3" />
      ))}
    </div>
  );
});

/**
 * Skeleton for section markers
 */
export const SectionsSkeleton = memo(function SectionsSkeleton({ 
  className 
}: SkeletonProps) {
  return (
    <div className={cn("h-7 border-b border-border/30 flex items-center gap-2 px-2", className)}>
      <Skeleton className="w-16 h-5 rounded" />
      <Skeleton className="w-20 h-5 rounded" />
      <Skeleton className="w-14 h-5 rounded" />
      <Skeleton className="w-20 h-5 rounded" />
      <Skeleton className="w-16 h-5 rounded" />
    </div>
  );
});

/**
 * Skeleton for transport controls
 */
export const TransportSkeleton = memo(function TransportSkeleton({ 
  className 
}: SkeletonProps) {
  return (
    <div className={cn("flex items-center justify-between px-4 py-3 border-t border-border/30", className)}>
      {/* Time display */}
      <Skeleton className="w-24 h-4" />
      
      {/* Transport buttons */}
      <div className="flex items-center gap-2">
        <Skeleton className="w-10 h-10 rounded" />
        <Skeleton className="w-12 h-12 rounded-full" />
        <Skeleton className="w-10 h-10 rounded" />
      </div>
      
      {/* Volume */}
      <div className="flex items-center gap-2">
        <Skeleton className="w-8 h-8 rounded" />
        <Skeleton className="w-20 h-2 rounded-full" />
      </div>
    </div>
  );
});

/**
 * Full studio loading skeleton
 */
export const StudioLoadingSkeleton = memo(function StudioLoadingSkeleton({ 
  className 
}: SkeletonProps) {
  return (
    <div className={cn("flex flex-col h-screen bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <Skeleton className="w-32 h-5" />
          <Skeleton className="w-16 h-7 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-9 h-9 rounded" />
          <Skeleton className="w-9 h-9 rounded" />
        </div>
      </div>
      
      {/* Timeline ruler */}
      <TimelineRulerSkeleton />
      
      {/* Sections */}
      <SectionsSkeleton />
      
      {/* Tracks */}
      <div className="flex-1 p-2 space-y-2 overflow-hidden">
        <TrackRowSkeleton />
        <TrackRowSkeleton />
        <TrackRowSkeleton />
        <TrackRowSkeleton />
      </div>
      
      {/* Transport */}
      <TransportSkeleton />
    </div>
  );
});

/**
 * Waveform loading skeleton
 */
export const WaveformSkeleton = memo(function WaveformSkeleton({ 
  className 
}: SkeletonProps) {
  return (
    <div className={cn("h-16 flex items-end gap-px px-1", className)}>
      {Array.from({ length: 60 }).map((_, i) => {
        const height = 20 + Math.sin(i * 0.3) * 30 + Math.random() * 20;
        return (
          <Skeleton 
            key={i} 
            className="flex-1 rounded-t"
            style={{ height: `${height}%` }} 
          />
        );
      })}
    </div>
  );
});

/**
 * Mixer panel loading skeleton
 */
export const MixerPanelSkeleton = memo(function MixerPanelSkeleton({ 
  className 
}: SkeletonProps) {
  return (
    <div className={cn("space-y-4 p-4", className)}>
      {/* Master volume */}
      <div className="space-y-2">
        <Skeleton className="w-24 h-4" />
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="flex-1 h-2 rounded-full" />
          <Skeleton className="w-10 h-4" />
        </div>
      </div>
      
      {/* Divider */}
      <div className="border-t border-border/30" />
      
      {/* Track controls */}
      <div className="space-y-3">
        <Skeleton className="w-20 h-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-3 border border-border/30 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="w-24 h-4" />
              <div className="flex gap-1">
                <Skeleton className="w-7 h-7 rounded" />
                <Skeleton className="w-7 h-7 rounded" />
              </div>
            </div>
            <Skeleton className="w-full h-2 rounded-full" />
            <Skeleton className="w-full h-2 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
});
