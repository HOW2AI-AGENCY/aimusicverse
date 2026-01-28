/**
 * Deeplink Trends Chart
 * 
 * Visual chart for deeplink visit trends over time
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TrendDataPoint {
  date: string;
  visits: number;
  conversions: number;
  unique_users: number;
}

interface DeeplinkTrendsChartProps {
  data: TrendDataPoint[];
  timeRange: string;
  isLoading?: boolean;
}

export function DeeplinkTrendsChart({ 
  data, 
  timeRange,
  isLoading 
}: DeeplinkTrendsChartProps) {
  // Calculate trend indicators
  const trend = useMemo(() => {
    if (data.length < 2) return { direction: 'neutral', percentage: 0 };

    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint);
    const secondHalf = data.slice(midpoint);

    const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.visits, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.visits, 0) / secondHalf.length;

    if (firstHalfAvg === 0) return { direction: 'neutral', percentage: 0 };

    const percentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    return {
      direction: percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'neutral',
      percentage: Math.abs(Math.round(percentage)),
    };
  }, [data]);

  // Format chart data
  const chartData = useMemo(() => {
    return data.map(point => ({
      ...point,
      dateFormatted: format(parseISO(point.date), 'd MMM', { locale: ru }),
      conversionRate: point.visits > 0 
        ? Math.round((point.conversions / point.visits) * 100) 
        : 0,
    }));
  }, [data]);

  const TrendIcon = trend.direction === 'up' 
    ? TrendingUp 
    : trend.direction === 'down' 
    ? TrendingDown 
    : Minus;

  const trendColor = trend.direction === 'up' 
    ? 'text-green-500' 
    : trend.direction === 'down' 
    ? 'text-red-500' 
    : 'text-muted-foreground';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Динамика переходов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Загрузка...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Динамика переходов</CardTitle>
          <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
            <span>{trend.percentage}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="dateFormatted" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    visits: 'Визитов',
                    conversions: 'Конверсий',
                    unique_users: 'Уникальных',
                  };
                  return [value, labels[name] || name];
                }}
              />
              <Legend 
                formatter={(value: string) => {
                  const labels: Record<string, string> = {
                    visits: 'Визиты',
                    conversions: 'Конверсии',
                  };
                  return labels[value] || value;
                }}
              />
              <Area
                type="monotone"
                dataKey="visits"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorVisits)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="conversions"
                stroke="hsl(var(--chart-2))"
                fillOpacity={1}
                fill="url(#colorConversions)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
