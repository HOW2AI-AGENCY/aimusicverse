/**
 * StatsHighlightBanner - Quick stats banner showing real platform metrics
 * Builds social proof and engagement with live data
 * Updated with unified glassmorphism and design tokens
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Music, Users, Sparkles, Headphones } from 'lucide-react';
import { usePlatformStats } from '@/hooks/usePlatformStats';
import { Skeleton } from '@/components/ui/skeleton';
import { glass } from '@/lib/glass';

interface StatsHighlightBannerProps {
  className?: string;
}

const statColors = {
  tracks: {
    text: 'text-primary',
    bg: 'bg-primary/15',
    border: 'border-primary/20',
  },
  users: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/20',
  },
  ai: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/20',
  },
  plays: {
    text: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/20',
  },
} as const;

export const StatsHighlightBanner = memo(function StatsHighlightBanner({
  className,
}: StatsHighlightBannerProps) {
  const { formatted, isLoading } = usePlatformStats();

  const stats = [
    { 
      id: 'tracks' as const, 
      label: 'Треков', 
      value: formatted.tracks,
      icon: Music,
    },
    { 
      id: 'users' as const, 
      label: 'Авторов', 
      value: formatted.users,
      icon: Users,
    },
    { 
      id: 'ai' as const, 
      label: 'AI генераций', 
      value: formatted.generations,
      icon: Sparkles,
    },
    { 
      id: 'plays' as const, 
      label: 'Прослушиваний', 
      value: formatted.plays,
      icon: Headphones,
    },
  ];

  return (
    <motion.div
      className={cn(
        // 2x2 grid at every size — fits both rail (≈380px) and full-width
        // mobile cleanly. Previous lg:grid-cols-4 caused clipped labels when
        // rendered inside the right rail.
        "grid grid-cols-2 gap-2 sm:gap-3",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const colors = statColors[stat.id];
        
        return (
          <motion.div
            key={stat.id}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 rounded-xl min-w-0",
              glass.subtle,
              "border",
              colors.border,
              "hover:bg-card/70 hover:shadow-sm hover:border-opacity-50 transition-all duration-200",
              "group cursor-default"
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 + 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className={cn(
              "w-8 h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center shrink-0",
              colors.bg,
              "group-hover:scale-110 transition-transform duration-200"
            )}>
              <Icon className={cn("w-4 h-4 lg:w-4.5 lg:h-4.5", colors.text)} />
            </div>
            <div className="flex flex-col min-w-0">
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-10 mb-0.5" />
                  <Skeleton className="h-3 w-14" />
                </>
              ) : (
                <>
                  <span className="text-body-sm lg:text-sm font-bold text-foreground leading-tight tabular-nums">
                    {stat.value}
                  </span>
                  <span className="text-tiny lg:text-xs text-muted-foreground leading-tight truncate">
                    {stat.label}
                  </span>
                </>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
});
