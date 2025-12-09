/**
 * Skeleton loading components for homepage sections
 * Provides beautiful animated loading states
 */
import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

// Shimmer animation base
function ShimmerBase({ className, style }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden bg-muted/40 rounded-xl",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
      style={style}
    />
  );
}

// Hero section skeleton
export function HeroSkeleton() {
  return (
    <div className="space-y-4">
      {/* Welcome text */}
      <div className="space-y-2">
        <ShimmerBase className="h-6 w-32" />
        <ShimmerBase className="h-8 w-48" />
      </div>
      
      {/* Quick actions grid */}
      <div className="grid grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <ShimmerBase 
            key={i} 
            className="aspect-square rounded-2xl"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// Gamification widget skeleton
export function GamificationSkeleton() {
  return (
    <Card className="p-4 bg-gradient-to-br from-muted/30 to-muted/10 border-border/30">
      <div className="flex items-center gap-4">
        <ShimmerBase className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <ShimmerBase className="h-4 w-24" />
          <ShimmerBase className="h-2 w-full rounded-full" />
        </div>
        <ShimmerBase className="w-16 h-8 rounded-lg" />
      </div>
    </Card>
  );
}

// Track card skeleton
export function TrackCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <Card className={cn(
      "overflow-hidden border-border/30 bg-muted/20",
      compact ? "w-[160px]" : ""
    )}>
      <ShimmerBase className={cn(
        "w-full",
        compact ? "h-[160px]" : "aspect-square"
      )} />
      <div className="p-3 space-y-2">
        <ShimmerBase className="h-4 w-3/4" />
        <ShimmerBase className="h-3 w-1/2" />
        <div className="flex items-center gap-2">
          <ShimmerBase className="w-5 h-5 rounded-full" />
          <ShimmerBase className="h-3 w-16" />
        </div>
      </div>
    </Card>
  );
}

// Discovery section skeleton
export function DiscoverySkeleton() {
  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <ShimmerBase className="h-7 w-32" />
        <ShimmerBase className="h-8 w-16 rounded-full" />
      </div>
      
      {/* Tab pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[...Array(3)].map((_, i) => (
          <ShimmerBase 
            key={i} 
            className="h-9 w-24 rounded-full flex-shrink-0"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
      
      {/* Grid */}
      <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <TrackCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Mobile scroll */}
      <div className="sm:hidden overflow-x-auto -mx-4 px-4">
        <div className="flex gap-3 pb-2">
          {[...Array(4)].map((_, i) => (
            <TrackCardSkeleton key={i} compact />
          ))}
        </div>
      </div>
    </section>
  );
}

// Artists section skeleton
export function ArtistsSkeleton() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <ShimmerBase className="h-7 w-40" />
        <ShimmerBase className="h-8 w-16 rounded-full" />
      </div>
      
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-4 pb-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 w-20 flex-shrink-0">
              <ShimmerBase 
                className="w-16 h-16 rounded-full"
                style={{ animationDelay: `${i * 80}ms` }}
              />
              <ShimmerBase className="h-3 w-14" />
              <ShimmerBase className="h-2 w-12" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Auto playlists section skeleton
export function PlaylistsSkeleton() {
  return (
    <section className="space-y-4">
      <ShimmerBase className="h-7 w-36" />
      
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-4 pb-2">
          {[...Array(4)].map((_, i) => (
            <Card 
              key={i} 
              className="w-[200px] flex-shrink-0 overflow-hidden border-border/30 bg-muted/20"
            >
              <ShimmerBase 
                className="w-full h-[120px]"
                style={{ animationDelay: `${i * 100}ms` }}
              />
              <div className="p-3 space-y-2">
                <ShimmerBase className="h-4 w-3/4" />
                <ShimmerBase className="h-3 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Recent tracks section skeleton
export function RecentTracksSkeleton() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <ShimmerBase className="h-6 w-32" />
        <ShimmerBase className="h-8 w-24 rounded-full" />
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-3 border-border/30 bg-muted/20">
            <div className="flex items-center gap-3">
              <ShimmerBase 
                className="w-12 h-12 rounded-lg flex-shrink-0"
                style={{ animationDelay: `${i * 100}ms` }}
              />
              <div className="flex-1 space-y-2 min-w-0">
                <ShimmerBase className="h-4 w-full" />
                <ShimmerBase className="h-3 w-2/3" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

// Blog section skeleton
export function BlogSkeleton() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <ShimmerBase className="h-7 w-24" />
        <ShimmerBase className="h-8 w-16 rounded-full" />
      </div>
      
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-4 pb-2">
          {[...Array(3)].map((_, i) => (
            <Card 
              key={i} 
              className="w-[280px] flex-shrink-0 overflow-hidden border-border/30 bg-muted/20"
            >
              <ShimmerBase 
                className="w-full h-[140px]"
                style={{ animationDelay: `${i * 100}ms` }}
              />
              <div className="p-4 space-y-3">
                <ShimmerBase className="h-5 w-full" />
                <ShimmerBase className="h-4 w-3/4" />
                <div className="flex items-center gap-2">
                  <ShimmerBase className="w-6 h-6 rounded-full" />
                  <ShimmerBase className="h-3 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Graph preview skeleton
export function GraphSkeleton() {
  return (
    <Card className="p-4 border-border/30 bg-muted/20 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <ShimmerBase className="h-6 w-36" />
        <ShimmerBase className="h-8 w-24 rounded-full" />
      </div>
      
      <div className="relative h-[200px] flex items-center justify-center">
        {/* Animated circles to simulate graph nodes */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[...Array(6)].map((_, i) => {
            const angle = (i * 60) * Math.PI / 180;
            const radius = 60;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            return (
              <ShimmerBase
                key={i}
                className="absolute w-10 h-10 rounded-full"
                style={{ 
                  transform: `translate(${x}px, ${y}px)`,
                  animationDelay: `${i * 150}ms`
                }}
              />
            );
          })}
          <ShimmerBase className="w-16 h-16 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

// Full homepage skeleton
export function HomePageSkeleton() {
  return (
    <div className="space-y-6">
      <GamificationSkeleton />
      <HeroSkeleton />
      <RecentTracksSkeleton />
      <ArtistsSkeleton />
      <PlaylistsSkeleton />
      <DiscoverySkeleton />
      <GraphSkeleton />
      <BlogSkeleton />
    </div>
  );
}
