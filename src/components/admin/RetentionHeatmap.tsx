/**
 * RetentionHeatmap - Visualizes user retention by cohort
 * Shows D1, D7, D14, D30 retention rates as a heatmap
 */

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { useRetentionCohorts, calculateAverageRetention, type RetentionCohort } from '@/hooks/admin/useRetentionCohorts';
import { cn } from '@/lib/utils';

type TimeRange = '7d' | '14d' | '30d' | '60d';

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string; days: number }[] = [
  { value: '7d', label: '7 дней', days: 7 },
  { value: '14d', label: '14 дней', days: 14 },
  { value: '30d', label: '30 дней', days: 30 },
  { value: '60d', label: '60 дней', days: 60 },
];

const RETENTION_COLUMNS = [
  { key: 'd1_rate' as const, label: 'D1', description: 'Вернулись на следующий день' },
  { key: 'd7_rate' as const, label: 'D7', description: 'Активны через 7 дней' },
  { key: 'd14_rate' as const, label: 'D14', description: 'Активны через 14 дней' },
  { key: 'd30_rate' as const, label: 'D30', description: 'Активны через 30 дней' },
];

/**
 * Get color class based on retention percentage
 */
function getRetentionColor(rate: number | null): string {
  if (rate === null || rate === undefined) return 'bg-muted/30';
  if (rate >= 50) return 'bg-green-500/80 text-white';
  if (rate >= 30) return 'bg-green-400/60';
  if (rate >= 20) return 'bg-yellow-400/60';
  if (rate >= 10) return 'bg-orange-400/60';
  if (rate > 0) return 'bg-red-400/50';
  return 'bg-muted/30';
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { 
    day: 'numeric', 
    month: 'short' 
  });
}

interface RetentionCellProps {
  rate: number | null;
  retained: number;
  cohortSize: number;
  label: string;
}

function RetentionCell({ rate, retained, cohortSize, label }: RetentionCellProps) {
  const displayRate = rate !== null ? `${rate}%` : '—';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              'px-2 py-1.5 text-center text-xs font-medium rounded transition-colors cursor-default',
              getRetentionColor(rate)
            )}
          >
            {displayRate}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-medium">{label}</p>
          <p>{retained} из {cohortSize} пользователей</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface AverageCardProps {
  label: string;
  value: number;
  trend?: 'up' | 'down' | 'neutral';
}

function AverageCard({ label, value, trend = 'neutral' }: AverageCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground';
  
  return (
    <div className="flex flex-col items-center p-2 bg-muted/30 rounded-lg">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-lg font-bold">{value}%</span>
        <TrendIcon className={cn('w-3 h-3', trendColor)} />
      </div>
    </div>
  );
}

export function RetentionHeatmap() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  
  const dateRange = useMemo(() => {
    const option = TIME_RANGE_OPTIONS.find(o => o.value === timeRange);
    const days = option?.days || 30;
    return {
      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    };
  }, [timeRange]);

  const { data: cohorts, isLoading, error } = useRetentionCohorts(dateRange);
  
  const averages = useMemo(() => {
    if (!cohorts?.length) return null;
    return calculateAverageRetention(cohorts);
  }, [cohorts]);

  const totalUsers = useMemo(() => {
    if (!cohorts?.length) return 0;
    return cohorts.reduce((sum, c) => sum + c.cohort_size, 0);
  }, [cohorts]);

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">
            Ошибка загрузки данных удержания: {(error as Error).message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Retention по когортам
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Удержание пользователей по дате регистрации
            </CardDescription>
          </div>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Average Stats */}
        {averages && (
          <div className="grid grid-cols-4 gap-2">
            <AverageCard label="D1 avg" value={averages.d1} trend={averages.d1 >= 30 ? 'up' : 'down'} />
            <AverageCard label="D7 avg" value={averages.d7} trend={averages.d7 >= 20 ? 'up' : 'down'} />
            <AverageCard label="D14 avg" value={averages.d14} trend={averages.d14 >= 15 ? 'up' : 'down'} />
            <AverageCard label="D30 avg" value={averages.d30} trend={averages.d30 >= 10 ? 'up' : 'down'} />
          </div>
        )}

        {/* Summary Badge */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            {totalUsers} новых пользователей
          </Badge>
          <span>за {TIME_RANGE_OPTIONS.find(o => o.value === timeRange)?.label}</span>
        </div>

        {/* Heatmap Table */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : cohorts && cohorts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Дата</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Когорта</th>
                  {RETENTION_COLUMNS.map(col => (
                    <th key={col.key} className="text-center py-2 px-2 font-medium text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>{col.label}</TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {col.description}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.map((cohort) => (
                  <tr key={cohort.cohort_date} className="border-b border-muted/30 hover:bg-muted/10">
                    <td className="py-1.5 px-2 text-muted-foreground">
                      {formatDate(cohort.cohort_date)}
                    </td>
                    <td className="py-1.5 px-2 text-center font-medium">
                      {cohort.cohort_size}
                    </td>
                    <td className="py-1 px-1">
                      <RetentionCell 
                        rate={cohort.d1_rate} 
                        retained={cohort.d1_retained}
                        cohortSize={cohort.cohort_size}
                        label="D1 Retention"
                      />
                    </td>
                    <td className="py-1 px-1">
                      <RetentionCell 
                        rate={cohort.d7_rate} 
                        retained={cohort.d7_retained}
                        cohortSize={cohort.cohort_size}
                        label="D7 Retention"
                      />
                    </td>
                    <td className="py-1 px-1">
                      <RetentionCell 
                        rate={cohort.d14_rate} 
                        retained={cohort.d14_retained}
                        cohortSize={cohort.cohort_size}
                        label="D14 Retention"
                      />
                    </td>
                    <td className="py-1 px-1">
                      <RetentionCell 
                        rate={cohort.d30_rate} 
                        retained={cohort.d30_retained}
                        cohortSize={cohort.cohort_size}
                        label="D30 Retention"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Нет данных о когортах за выбранный период
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground pt-2 border-t">
          <span>Шкала:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-400/50" />
            <span>&lt;10%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-orange-400/60" />
            <span>10-20%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-yellow-400/60" />
            <span>20-30%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-400/60" />
            <span>30-50%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-500/80" />
            <span>&gt;50%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
