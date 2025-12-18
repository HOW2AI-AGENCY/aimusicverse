/**
 * Genre Distribution Chart
 * Pie chart showing top genres
 */

import { Card } from '@/components/ui/card';
import { motion } from '@/lib/motion';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  'hsl(142 76% 36%)', // green
  'hsl(38 92% 50%)', // amber
  'hsl(280 65% 60%)', // purple
];

export function GenreDistributionChart() {
  const { data, isLoading } = useAnalyticsData();

  if (isLoading) {
    return (
      <Card className="p-4 glass-card border-border/50">
        <Skeleton className="h-[200px] w-full" />
      </Card>
    );
  }

  const chartData = data?.genreDistribution || [];

  if (chartData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-4 glass-card border-border/50">
          <h3 className="text-sm font-semibold mb-4">Топ жанры</h3>
          <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
            Нет данных о жанрах
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="p-4 glass-card border-border/50">
        <h3 className="text-sm font-semibold mb-4">Топ жанры</h3>
        
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData as unknown as Array<{ [key: string]: string | number }>}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="count"
                nameKey="genre"
              >
                {chartData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    strokeWidth={0}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => [
                  `${value} треков`,
                  name
                ]}
              />
              <Legend 
                wrapperStyle={{ fontSize: '11px' }}
                iconType="circle"
                layout="vertical"
                align="right"
                verticalAlign="middle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}
