/**
 * Engagement Chart
 * Area chart showing likes and plays over time
 * Uses lazy-loaded Recharts via useRecharts hook for bundle optimization
 */

import { Card } from '@/components/ui/card';
import { motion } from '@/lib/motion';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecharts } from '@/lib/recharts-lazy';

export function EngagementChart() {
  const { data, isLoading } = useAnalyticsData();
  const { recharts, isLoading: rechartsLoading } = useRecharts();

  if (isLoading || rechartsLoading || !recharts) {
    return (
      <Card className="p-4 glass-card border-border/50">
        <Skeleton className="h-[200px] w-full" />
      </Card>
    );
  }

  const {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
  } = recharts;

  const chartData = data?.dailyEngagement || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="p-4 glass-card border-border/50">
        <h3 className="text-sm font-semibold mb-4">Активность за 7 дней</h3>

        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPlays" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.5}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="plays"
                name="Прослушивания"
                stroke="hsl(var(--primary))"
                fill="url(#colorPlays)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="likes"
                name="Лайки"
                stroke="hsl(var(--destructive))"
                fill="url(#colorLikes)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}
