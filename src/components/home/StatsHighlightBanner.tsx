/**
 * StatsHighlightBanner - Quick stats banner showing real platform metrics
 * Builds social proof and engagement with live data
 * Updated with improved visual design and design tokens
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Music, Users, Sparkles, Headphones, TrendingUp } from 'lucide-react';
import { usePlatformStats } from '@/hooks/usePlatformStats';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsHighlightBannerProps {
  className?: string;
}

export const StatsHighlightBanner = memo(function StatsHighlightBanner({
  className,
}: StatsHighlightBannerProps) {
  const { formatted, isLoading } = usePlatformStats();

  const stats = [
    { 
      id: 'tracks', 
      label: 'Треков', 
      value: formatted.tracks,
      icon: Music,
      color: 'text-primary',
      bg: 'bg-primary/15',
      border: 'border-primary/20',
    },
    { 
      id: 'users', 
      label: 'Авторов', 
      value: formatted.users,
      icon: Users,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/15',
      border: 'border-emerald-500/20',
    },
    { 
      id: 'ai', 
      label: 'AI генераций', 
      value: formatted.generations,
      icon: Sparkles,
      color: 'text-amber-400',
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/20',
    },
    { 
      id: 'plays', 
      label: 'Прослушиваний', 
      value: formatted.plays,
      icon: Headphones,
      color: 'text-purple-400',
      bg: 'bg-purple-500/15',
      border: 'border-purple-500/20',
    },
  ];

  return (
    <motion.div
      className={cn(
        "flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.id}
            className={cn(
              "flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl",
              "bg-card/70 backdrop-blur-sm",
              "border",
              stat.border,
              "min-w-[105px]",
              "hover:bg-card/90 transition-colors duration-200"
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 + 0.1 }}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              stat.bg
            )}>
              <Icon className={cn("w-4 h-4", stat.color)} />
            </div>
            <div className="flex flex-col min-w-0">
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-10 mb-0.5" />
                  <Skeleton className="h-3 w-14" />
                </>
              ) : (
                <>
                  <span className="text-sm font-bold text-foreground leading-tight tabular-nums">
                    {stat.value}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight truncate">
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
