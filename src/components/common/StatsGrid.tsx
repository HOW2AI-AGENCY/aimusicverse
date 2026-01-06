/**
 * StatsGrid - Unified stats display component
 * 
 * Used in:
 * - TrackDetailsTab (duration, plays, likes, type)
 * - ProjectInfoCard (genre, mood, language)
 * - UserProfileStats
 * - Any component showing stat grids
 */

import { memo, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatItem {
  /** Icon from lucide-react */
  icon: LucideIcon;
  /** Stat label/description */
  label: string;
  /** Stat value */
  value: string | number | ReactNode;
  /** Icon color class */
  iconColor?: string;
  /** Custom element instead of value */
  customContent?: ReactNode;
  /** Span 2 columns on larger screens */
  fullWidth?: boolean;
  /** Additional className for the stat card */
  className?: string;
}

interface StatsGridProps {
  /** Array of stat items */
  stats: StatItem[];
  /** Number of columns */
  columns?: 2 | 3 | 4;
  /** Visual variant */
  variant?: 'default' | 'compact' | 'card';
  /** Additional className */
  className?: string;
}

const COLUMN_CLASSES = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
};

const VARIANT_CLASSES = {
  default: 'p-3 rounded-lg bg-muted/50',
  compact: 'p-2 rounded-md bg-muted/30',
  card: 'p-4 rounded-xl bg-gradient-to-br from-card/80 to-card/40 border border-border/50',
};

const SIZE_CLASSES = {
  default: {
    icon: 'w-5 h-5',
    label: 'text-xs',
    value: 'font-semibold',
  },
  compact: {
    icon: 'w-4 h-4',
    label: 'text-[10px]',
    value: 'text-sm font-medium',
  },
  card: {
    icon: 'w-5 h-5',
    label: 'text-xs',
    value: 'text-base font-semibold',
  },
};

export const StatsGrid = memo(function StatsGrid({
  stats,
  columns = 4,
  variant = 'default',
  className,
}: StatsGridProps) {
  const sizes = SIZE_CLASSES[variant];

  return (
    <div className={cn("grid gap-3", COLUMN_CLASSES[columns], className)}>
      {stats.map((stat, index) => (
        <StatCard 
          key={index} 
          stat={stat} 
          variant={variant}
          sizes={sizes}
        />
      ))}
    </div>
  );
});

interface StatCardProps {
  stat: StatItem;
  variant: 'default' | 'compact' | 'card';
  sizes: typeof SIZE_CLASSES.default;
}

const StatCard = memo(function StatCard({ stat, variant, sizes }: StatCardProps) {
  const Icon = stat.icon;
  
  return (
    <div 
      className={cn(
        "flex items-center gap-2",
        VARIANT_CLASSES[variant],
        stat.fullWidth && "sm:col-span-2",
        stat.className
      )}
    >
      <Icon className={cn(sizes.icon, stat.iconColor || 'text-primary')} />
      <div className="min-w-0 flex-1">
        <p className={cn(sizes.label, "text-muted-foreground")}>{stat.label}</p>
        {stat.customContent ? (
          stat.customContent
        ) : (
          <p className={cn(sizes.value, "truncate")}>{stat.value}</p>
        )}
      </div>
    </div>
  );
});

/**
 * Single stat item component for inline usage
 */
export const StatItem = memo(function StatItemComponent({
  icon: Icon,
  label,
  value,
  iconColor = 'text-primary',
  variant = 'default',
  className,
}: Omit<StatItem, 'customContent' | 'fullWidth'> & { variant?: 'default' | 'compact' | 'card' }) {
  const sizes = SIZE_CLASSES[variant];
  
  return (
    <div className={cn(
      "flex items-center gap-2",
      VARIANT_CLASSES[variant],
      className
    )}>
      <Icon className={cn(sizes.icon, iconColor)} />
      <div>
        <p className={cn(sizes.label, "text-muted-foreground")}>{label}</p>
        <p className={sizes.value}>{value}</p>
      </div>
    </div>
  );
});

export default StatsGrid;
