/**
 * StatsWidget - Professional statistics display
 * Shows key metrics for professional users
 */

import { motion } from 'framer-motion';
import { 
  Music, Scissors, FileMusic, Clock, 
  TrendingUp, Activity, Zap, ArrowUpRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Stat {
  id: string;
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface StatsWidgetProps {
  stats?: Stat[];
  variant?: 'grid' | 'row';
  showTrend?: boolean;
  animated?: boolean;
  className?: string;
}

const defaultStats: Stat[] = [
  {
    id: 'tracks',
    label: 'Треков создано',
    value: 24,
    icon: Music,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    change: '+3',
    trend: 'up',
  },
  {
    id: 'stems',
    label: 'Стемов разделено',
    value: 156,
    icon: Scissors,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    change: '+12',
    trend: 'up',
  },
  {
    id: 'midi',
    label: 'MIDI файлов',
    value: 18,
    icon: FileMusic,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    change: '+2',
    trend: 'up',
  },
  {
    id: 'time',
    label: 'Времени в студии',
    value: '12ч',
    icon: Clock,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    change: '+2ч',
    trend: 'up',
  },
];

export function StatsWidget({
  stats = defaultStats,
  variant = 'grid',
  showTrend = true,
  animated = true,
  className,
}: StatsWidgetProps) {
  const isGrid = variant === 'grid';

  return (
    <div
      className={cn(
        'gap-3',
        isGrid ? 'grid grid-cols-2 sm:grid-cols-4' : 'flex flex-col sm:flex-row',
        className
      )}
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isTrendUp = stat.trend === 'up';
        const isTrendDown = stat.trend === 'down';

        return (
          <motion.div
            key={stat.id}
            initial={animated ? { opacity: 0, y: 20 } : undefined}
            animate={animated ? { opacity: 1, y: 0 } : undefined}
            transition={animated ? { delay: index * 0.1 } : undefined}
            className="flex-1"
          >
            <Card className="group hover:shadow-md transition-all hover:border-primary/30 border-2">
              <CardContent className="p-4 space-y-3">
                {/* Icon & Trend */}
                <div className="flex items-start justify-between">
                  <motion.div
                    className={cn('p-2 rounded-lg', stat.bgColor)}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Icon className={cn('w-5 h-5', stat.color)} />
                  </motion.div>

                  {/* Trend Badge */}
                  {showTrend && stat.change && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] px-1.5 py-0 h-5 gap-0.5',
                        isTrendUp && 'bg-green-500/10 text-green-400 border-green-500/20',
                        isTrendDown && 'bg-red-500/10 text-red-400 border-red-500/20'
                      )}
                    >
                      {isTrendUp && <ArrowUpRight className="w-3 h-3" />}
                      {stat.change}
                    </Badge>
                  )}
                </div>

                {/* Value */}
                <motion.div
                  className="space-y-1"
                  initial={animated ? { scale: 0.8 } : undefined}
                  animate={animated ? { scale: 1 } : undefined}
                  transition={animated ? { delay: index * 0.1 + 0.1, type: 'spring' } : undefined}
                >
                  <div className="text-3xl font-bold tabular-nums">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground leading-tight">
                    {stat.label}
                  </div>
                </motion.div>

                {/* Progress Indicator (optional animation) */}
                {animated && (
                  <motion.div
                    className="h-1 bg-muted rounded-full overflow-hidden"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                  >
                    <motion.div
                      className={cn('h-full', `bg-gradient-to-r ${stat.color.replace('text-', 'from-')}`)}
                      initial={{ width: 0 }}
                      animate={{ width: `${65 + index * 5}%` }}
                      transition={{ delay: index * 0.1 + 0.4, duration: 0.8 }}
                    />
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

// Summary card with all stats
export function StatsSummaryCard({
  stats = defaultStats,
  className,
}: {
  stats?: Stat[];
  className?: string;
}) {
  const totalTracks = stats.find(s => s.id === 'tracks')?.value || 0;
  const totalStems = stats.find(s => s.id === 'stems')?.value || 0;
  const totalMidi = stats.find(s => s.id === 'midi')?.value || 0;

  return (
    <Card className={cn('border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5', className)}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Активность в студии</h3>
              <p className="text-xs text-muted-foreground">За последние 30 дней</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            Рост
          </Badge>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {stats.slice(0, 3).map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center space-y-1"
              >
                <div className={cn('p-2 rounded-lg inline-flex', stat.bgColor)}>
                  <Icon className={cn('w-4 h-4', stat.color)} />
                </div>
                <div className="text-2xl font-bold tabular-nums">
                  {stat.value}
                </div>
                <div className="text-[10px] text-muted-foreground leading-tight">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Productivity Score */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Productivity Score</span>
            <span className="text-xs font-semibold">85/100</span>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '85%' }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Quick Insight */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-start gap-2 p-2 rounded-lg bg-primary/5"
        >
          <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Отличная работа! Вы создали <strong className="text-foreground">{totalTracks}</strong> треков,
            разделили <strong className="text-foreground">{totalStems}</strong> стемов и
            сгенерировали <strong className="text-foreground">{totalMidi}</strong> MIDI файлов.
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
}
