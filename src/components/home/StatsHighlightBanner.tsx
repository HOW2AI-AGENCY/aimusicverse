/**
 * StatsHighlightBanner - Quick stats banner showing real platform metrics
 * Builds social proof and engagement with live data
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Music, Users, Sparkles, Headphones } from 'lucide-react';
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
      bg: 'bg-primary/10'
    },
    { 
      id: 'users', 
      label: 'Авторов', 
      value: formatted.users,
      icon: Users,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10'
    },
    { 
      id: 'ai', 
      label: 'Генераций', 
      value: formatted.generations,
      icon: Sparkles,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10'
    },
    { 
      id: 'plays', 
      label: 'Прослушиваний', 
      value: formatted.plays,
      icon: Headphones,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10'
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
              "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl",
              "bg-card/60 border border-border/40",
              "min-w-[100px]"
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 + 0.1 }}
          >
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center",
              stat.bg
            )}>
              <Icon className={cn("w-3.5 h-3.5", stat.color)} />
            </div>
            <div className="flex flex-col">
              {isLoading ? (
                <>
                  <Skeleton className="h-3.5 w-10 mb-0.5" />
                  <Skeleton className="h-2.5 w-12" />
                </>
              ) : (
                <>
                  <span className="text-xs font-bold text-foreground leading-tight">
                    {stat.value}
                  </span>
                  <span className="text-[9px] text-muted-foreground leading-tight">
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
