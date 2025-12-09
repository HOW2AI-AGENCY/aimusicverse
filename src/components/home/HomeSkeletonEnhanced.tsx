import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HomeSkeletonEnhancedProps {
  className?: string;
}

// Animated shimmer component
function Shimmer({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl bg-muted/30",
        className
      )}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ['0%', '200%'] }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          ease: 'linear',
          repeatDelay: 0.5 
        }}
      />
    </motion.div>
  );
}

// Card skeleton with staggered animation
function CardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="rounded-xl border bg-card p-3 space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        <Shimmer className="w-12 h-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-4 w-3/4" />
          <Shimmer className="h-3 w-1/2" />
        </div>
      </div>
      <Shimmer className="h-2 w-full rounded-full" />
    </motion.div>
  );
}

// Section skeleton with title
function SectionSkeleton({ 
  title, 
  delay = 0,
  children 
}: { 
  title?: boolean;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.4 }}
    >
      {title && (
        <div className="flex items-center justify-between">
          <Shimmer className="h-5 w-32" />
          <Shimmer className="h-4 w-16" />
        </div>
      )}
      {children}
    </motion.div>
  );
}

// Quick actions skeleton
function QuickActionsSkeleton() {
  return (
    <motion.div
      className="grid grid-cols-3 sm:grid-cols-6 gap-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="flex flex-col items-center gap-2 p-3 rounded-xl border bg-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 + i * 0.05, duration: 0.2 }}
        >
          <Shimmer className="w-10 h-10 rounded-xl" />
          <Shimmer className="h-3 w-12" />
        </motion.div>
      ))}
    </motion.div>
  );
}

// Horizontal scroll cards skeleton
function HorizontalCardsSkeleton({ count = 4, delay = 0 }: { count?: number; delay?: number }) {
  return (
    <motion.div
      className="flex gap-3 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="flex-shrink-0 w-40 rounded-xl border bg-card overflow-hidden"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + i * 0.05, duration: 0.3 }}
        >
          <Shimmer className="w-full aspect-square" />
          <div className="p-2 space-y-1.5">
            <Shimmer className="h-4 w-3/4" />
            <Shimmer className="h-3 w-1/2" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Track list skeleton
function TrackListSkeleton({ count = 3, delay = 0 }: { count?: number; delay?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} delay={delay + i * 0.05} />
      ))}
    </div>
  );
}

// Artist avatar skeleton
function ArtistAvatarsSkeleton({ count = 5, delay = 0 }: { count?: number; delay?: number }) {
  return (
    <motion.div
      className="flex gap-3 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + i * 0.05, duration: 0.2 }}
        >
          <Shimmer className="w-16 h-16 rounded-full" />
          <Shimmer className="h-3 w-14" />
        </motion.div>
      ))}
    </motion.div>
  );
}

// Gamification widget skeleton
function GamificationSkeleton() {
  return (
    <motion.div
      className="rounded-xl border bg-card p-4 space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shimmer className="w-10 h-10 rounded-full" />
          <div className="space-y-1.5">
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-3 w-16" />
          </div>
        </div>
        <Shimmer className="h-8 w-20 rounded-lg" />
      </div>
      <Shimmer className="h-2 w-full rounded-full" />
    </motion.div>
  );
}

// Graph preview skeleton
function GraphPreviewSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="rounded-xl border bg-card p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <Shimmer className="h-5 w-28" />
        <Shimmer className="h-4 w-16" />
      </div>
      <div className="relative h-48 rounded-lg overflow-hidden">
        <Shimmer className="w-full h-full" />
        {/* Animated dots to simulate graph */}
        <div className="absolute inset-0 flex items-center justify-center">
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-primary/30"
              style={{
                left: `${15 + i * 12}%`,
                top: `${30 + Math.sin(i * 0.8) * 20}%`,
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Main export
export function HomeSkeletonEnhanced({ className }: HomeSkeletonEnhancedProps) {
  return (
    <div className={cn("space-y-5", className)}>
      {/* Gamification Widget */}
      <GamificationSkeleton />

      {/* Quick Actions */}
      <SectionSkeleton delay={0.1}>
        <QuickActionsSkeleton />
      </SectionSkeleton>

      {/* Recent Tracks */}
      <SectionSkeleton title delay={0.15}>
        <TrackListSkeleton count={2} delay={0.2} />
      </SectionSkeleton>

      {/* Artists */}
      <SectionSkeleton title delay={0.25}>
        <ArtistAvatarsSkeleton count={5} delay={0.3} />
      </SectionSkeleton>

      {/* Auto Playlists */}
      <SectionSkeleton title delay={0.35}>
        <HorizontalCardsSkeleton count={4} delay={0.4} />
      </SectionSkeleton>

      {/* Discovery */}
      <SectionSkeleton title delay={0.45}>
        <HorizontalCardsSkeleton count={3} delay={0.5} />
      </SectionSkeleton>

      {/* Graph Preview */}
      <GraphPreviewSkeleton delay={0.55} />
    </div>
  );
}

// Export individual skeleton components for reuse
export {
  Shimmer,
  CardSkeleton,
  SectionSkeleton,
  QuickActionsSkeleton,
  HorizontalCardsSkeleton,
  TrackListSkeleton,
  ArtistAvatarsSkeleton,
  GamificationSkeleton,
  GraphPreviewSkeleton,
};
