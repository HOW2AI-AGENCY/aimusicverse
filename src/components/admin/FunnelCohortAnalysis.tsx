/**
 * Funnel Cohort Analysis - Breakdown by acquisition source
 * Shows conversion rates segmented by traffic source
 */

import { memo, useState, useMemo } from 'react';
import { motion } from '@/lib/motion';
import {
  Users,
  ExternalLink,
  MessageCircle,
  Share2,
  Search,
  Gift,
  TrendingUp,
  TrendingDown,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface CohortData {
  source: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  visitors: number;
  registered: number;
  generated: number;
  paid: number;
  conversionRate: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

// Mock data - would come from API in production
const COHORT_DATA: CohortData[] = [
  {
    source: 'telegram_direct',
    label: 'Telegram Direct',
    icon: MessageCircle,
    visitors: 5420,
    registered: 3250,
    generated: 1845,
    paid: 312,
    conversionRate: 5.76,
    trend: 'up',
    trendValue: 12,
  },
  {
    source: 'telegram_channel',
    label: 'Telegram каналы',
    icon: Share2,
    visitors: 3180,
    registered: 1890,
    generated: 980,
    paid: 156,
    conversionRate: 4.91,
    trend: 'up',
    trendValue: 8,
  },
  {
    source: 'referral',
    label: 'Рефералы',
    icon: Gift,
    visitors: 1245,
    registered: 890,
    generated: 623,
    paid: 89,
    conversionRate: 7.15,
    trend: 'up',
    trendValue: 24,
  },
  {
    source: 'organic',
    label: 'Органический',
    icon: Search,
    visitors: 2340,
    registered: 1120,
    generated: 445,
    paid: 67,
    conversionRate: 2.86,
    trend: 'down',
    trendValue: -5,
  },
  {
    source: 'external',
    label: 'Внешние ссылки',
    icon: ExternalLink,
    visitors: 890,
    registered: 345,
    generated: 123,
    paid: 18,
    conversionRate: 2.02,
    trend: 'stable',
    trendValue: 0,
  },
];

interface CohortRowProps {
  cohort: CohortData;
  maxVisitors: number;
}

const CohortRow = memo(function CohortRow({ cohort, maxVisitors }: CohortRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = cohort.icon;

  const TrendIcon = cohort.trend === 'up' 
    ? TrendingUp 
    : cohort.trend === 'down' 
      ? TrendingDown 
      : null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.01 }}
          className={cn(
            'p-3 rounded-lg border cursor-pointer transition-colors',
            'hover:bg-accent/50',
            isOpen && 'bg-accent/30 border-primary/30'
          )}
        >
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>

            {/* Label & visitors */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{cohort.label}</span>
                {TrendIcon && (
                  <TrendIcon className={cn(
                    'h-3.5 w-3.5',
                    cohort.trend === 'up' && 'text-green-500',
                    cohort.trend === 'down' && 'text-red-500'
                  )} />
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Progress 
                  value={(cohort.visitors / maxVisitors) * 100} 
                  className="h-1.5 flex-1"
                />
                <span className="text-[10px] text-muted-foreground w-12 text-right">
                  {cohort.visitors.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Conversion rate */}
            <div className="text-right shrink-0">
              <div className={cn(
                'text-sm font-bold',
                cohort.conversionRate >= 5 ? 'text-green-500' : 
                cohort.conversionRate >= 3 ? 'text-yellow-500' : 'text-red-500'
              )}>
                {cohort.conversionRate}%
              </div>
              <div className="text-[10px] text-muted-foreground">
                конверсия
              </div>
            </div>

            {/* Expand indicator */}
            <ChevronDown className={cn(
              'h-4 w-4 text-muted-foreground transition-transform shrink-0',
              isOpen && 'rotate-180'
            )} />
          </div>
        </motion.div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="pt-2 pl-12 pr-3 pb-1">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-muted/30 rounded-lg p-2">
              <div className="text-xs font-semibold">{cohort.registered.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground">Регистрации</div>
              <div className="text-[10px] text-primary">
                {((cohort.registered / cohort.visitors) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-2">
              <div className="text-xs font-semibold">{cohort.generated.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground">Генераций</div>
              <div className="text-[10px] text-primary">
                {((cohort.generated / cohort.registered) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-2">
              <div className="text-xs font-semibold">{cohort.paid.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground">Платежей</div>
              <div className="text-[10px] text-primary">
                {((cohort.paid / cohort.generated) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-2">
              <div className={cn(
                'text-xs font-semibold',
                cohort.trendValue > 0 ? 'text-green-500' : 
                cohort.trendValue < 0 ? 'text-red-500' : 'text-muted-foreground'
              )}>
                {cohort.trendValue > 0 ? '+' : ''}{cohort.trendValue}%
              </div>
              <div className="text-[10px] text-muted-foreground">vs прошл.</div>
              <div className="text-[10px] text-primary">неделя</div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});

export const FunnelCohortAnalysis = memo(function FunnelCohortAnalysis() {
  const maxVisitors = useMemo(() => 
    Math.max(...COHORT_DATA.map(c => c.visitors)), 
    []
  );

  const sortedCohorts = useMemo(() => 
    [...COHORT_DATA].sort((a, b) => b.conversionRate - a.conversionRate),
    []
  );

  const bestCohort = sortedCohorts[0];
  const worstCohort = sortedCohorts[sortedCohorts.length - 1];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            Когорты по источникам
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {COHORT_DATA.length} источников
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Top performers */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
            <div className="text-[10px] text-green-600 dark:text-green-400 mb-1">
              Лучший источник
            </div>
            <div className="font-medium text-sm">{bestCohort.label}</div>
            <div className="text-xs text-green-600 dark:text-green-400">
              {bestCohort.conversionRate}% конверсия
            </div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
            <div className="text-[10px] text-red-600 dark:text-red-400 mb-1">
              Требует внимания
            </div>
            <div className="font-medium text-sm">{worstCohort.label}</div>
            <div className="text-xs text-red-600 dark:text-red-400">
              {worstCohort.conversionRate}% конверсия
            </div>
          </div>
        </div>

        {/* Cohort list */}
        <div className="space-y-2">
          {COHORT_DATA.map(cohort => (
            <CohortRow 
              key={cohort.source} 
              cohort={cohort}
              maxVisitors={maxVisitors}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
