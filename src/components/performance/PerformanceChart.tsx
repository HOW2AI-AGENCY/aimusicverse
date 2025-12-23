/**
 * Reusable chart component for performance metrics
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { PerformanceMetric } from '@/hooks/usePerformanceMetrics';

interface ChartField {
  key: keyof PerformanceMetric;
  label: string;
  color: string;
}

interface PerformanceChartProps {
  metrics: PerformanceMetric[];
  title: string;
  fields: ChartField[];
  targetLine?: number;
  isLoading: boolean;
}

export function PerformanceChart({ 
  metrics, 
  title, 
  fields, 
  targetLine,
  isLoading 
}: PerformanceChartProps) {
  const chartData = useMemo(() => {
    // Reverse to show oldest to newest (left to right)
    return [...metrics].reverse().map((m) => ({
      date: format(new Date(m.recorded_at), 'MMM d'),
      fullDate: format(new Date(m.recorded_at), 'PPp'),
      ...fields.reduce((acc, field) => ({
        ...acc,
        [field.key]: m[field.key],
      }), {}),
    }));
  }, [metrics, fields]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No data available. Click "Collect Now" to record metrics.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                width={60}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                labelFormatter={(_, payload) => {
                  if (payload?.[0]?.payload?.fullDate) {
                    return payload[0].payload.fullDate;
                  }
                  return '';
                }}
              />
              <Legend />
              
              {targetLine !== undefined && (
                <ReferenceLine 
                  y={targetLine} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="5 5"
                  label={{ 
                    value: `Target: ${targetLine}`, 
                    position: 'right',
                    fill: 'hsl(var(--destructive))',
                    fontSize: 11,
                  }}
                />
              )}
              
              {fields.map((field) => (
                <Line
                  key={field.key}
                  type="monotone"
                  dataKey={field.key}
                  name={field.label}
                  stroke={field.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
