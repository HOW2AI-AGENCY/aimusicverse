/**
 * Revenue Forecast Component
 * Feature: Payment Analytics Dashboard
 * 
 * Projects future revenue based on historical trends
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePaymentAnalytics } from '@/hooks/usePaymentAnalytics';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Target, AlertCircle, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ForecastPoint {
  day: string;
  revenue: number;
  forecast?: number;
  lower?: number;
  upper?: number;
  isProjected: boolean;
}

const FORECAST_PERIODS = [
  { label: '7д', days: 7 },
  { label: '14д', days: 14 },
  { label: '30д', days: 30 },
] as const;

function calculateForecast(
  historicalData: Array<{ day: string; usd: number }>,
  forecastDays: number
): { 
  forecast: ForecastPoint[]; 
  trend: 'up' | 'down' | 'stable';
  growthRate: number;
  projectedTotal: number;
  confidence: number;
} {
  if (!historicalData?.length) {
    return { 
      forecast: [], 
      trend: 'stable', 
      growthRate: 0, 
      projectedTotal: 0,
      confidence: 0,
    };
  }

  // Convert historical data to forecast points
  const historical: ForecastPoint[] = historicalData.map(d => ({
    day: d.day,
    revenue: d.usd,
    isProjected: false,
  }));

  // Calculate trend using linear regression
  const n = historicalData.length;
  const xMean = (n - 1) / 2;
  const yMean = historicalData.reduce((sum, d) => sum + d.usd, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  historicalData.forEach((d, i) => {
    numerator += (i - xMean) * (d.usd - yMean);
    denominator += (i - xMean) ** 2;
  });
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;
  
  // Calculate variance for confidence interval
  let sumSquaredErrors = 0;
  historicalData.forEach((d, i) => {
    const predicted = intercept + slope * i;
    sumSquaredErrors += (d.usd - predicted) ** 2;
  });
  const standardError = Math.sqrt(sumSquaredErrors / (n - 2));
  
  // Generate forecast points
  const lastDate = new Date(historicalData[historicalData.length - 1].day);
  const projected: ForecastPoint[] = [];
  
  for (let i = 1; i <= forecastDays; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);
    
    const predictedValue = Math.max(0, intercept + slope * (n - 1 + i));
    const uncertainty = standardError * 1.96 * Math.sqrt(1 + 1/n + ((i) ** 2) / denominator);
    
    projected.push({
      day: forecastDate.toISOString().split('T')[0],
      revenue: 0,
      forecast: predictedValue,
      lower: Math.max(0, predictedValue - uncertainty),
      upper: predictedValue + uncertainty,
      isProjected: true,
    });
  }
  
  // Calculate growth rate (last 7 days vs previous 7 days)
  const recentDays = historicalData.slice(-7);
  const previousDays = historicalData.slice(-14, -7);
  
  const recentAvg = recentDays.reduce((sum, d) => sum + d.usd, 0) / recentDays.length;
  const previousAvg = previousDays.length > 0 
    ? previousDays.reduce((sum, d) => sum + d.usd, 0) / previousDays.length 
    : recentAvg;
  
  const growthRate = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
  
  // Determine trend
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (growthRate > 5) trend = 'up';
  else if (growthRate < -5) trend = 'down';
  
  // Calculate projected total
  const projectedTotal = projected.reduce((sum, p) => sum + (p.forecast || 0), 0);
  
  // Calculate confidence (based on R² and data quality)
  const totalVariance = historicalData.reduce((sum, d) => sum + (d.usd - yMean) ** 2, 0);
  const rSquared = totalVariance > 0 ? 1 - (sumSquaredErrors / totalVariance) : 0;
  const confidence = Math.max(0, Math.min(100, rSquared * 100));
  
  return {
    forecast: [...historical, ...projected],
    trend,
    growthRate,
    projectedTotal,
    confidence,
  };
}

export function RevenueForecast() {
  const [forecastDays, setForecastDays] = useState(14);
  const { data: paymentData, isLoading } = usePaymentAnalytics('30 days');
  
  const { forecast, trend, growthRate, projectedTotal, confidence } = useMemo(() => {
    if (!paymentData?.revenue_by_day) {
      return { forecast: [], trend: 'stable' as const, growthRate: 0, projectedTotal: 0, confidence: 0 };
    }
    return calculateForecast(paymentData.revenue_by_day, forecastDays);
  }, [paymentData?.revenue_by_day, forecastDays]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Target className="h-4 w-4 text-yellow-500" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-500';
    if (trend === 'down') return 'text-red-500';
    return 'text-yellow-500';
  };

  // Find where projection starts
  const projectionStartIndex = forecast.findIndex(f => f.isProjected);
  const projectionStartDate = projectionStartIndex > 0 
    ? forecast[projectionStartIndex - 1]?.day 
    : null;

  return (
    <Card>
      <CardHeader className="pb-3 px-3 pt-3 sm:px-6 sm:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
              Прогноз выручки
            </CardTitle>
            <CardDescription className="text-xs mt-1 hidden sm:block">
              Линейная регрессия на основе исторических данных
            </CardDescription>
          </div>
          
          <div className="flex gap-1">
            {FORECAST_PERIODS.map(period => (
              <Button
                key={period.days}
                variant={forecastDays === period.days ? 'default' : 'outline'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setForecastDays(period.days)}
              >
                +{period.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6 space-y-4">
        {/* Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-muted/30 rounded-lg p-2 sm:p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-lg sm:text-xl font-bold">
              {getTrendIcon()}
              <span className={getTrendColor()}>
                {growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%
              </span>
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Тренд (7д)</div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-lg sm:text-xl font-bold">
              {isLoading ? <Skeleton className="h-6 w-16 mx-auto" /> : formatCurrency(projectedTotal)}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Прогноз ({forecastDays}д)</div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-lg sm:text-xl font-bold">
              {isLoading ? <Skeleton className="h-6 w-16 mx-auto" /> : formatCurrency(projectedTotal / forecastDays)}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Ср. в день</div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-2 sm:p-3 text-center">
            <div className={cn(
              'text-lg sm:text-xl font-bold',
              confidence >= 70 ? 'text-green-500' : confidence >= 40 ? 'text-yellow-500' : 'text-red-500'
            )}>
              {confidence.toFixed(0)}%
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Точность</div>
          </div>
        </div>

        {/* Forecast Chart */}
        {isLoading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : forecast.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={forecast}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              
              <XAxis
                dataKey="day"
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getDate()}/${date.getMonth() + 1}`;
                }}
                interval="preserveStartEnd"
              />
              
              <YAxis
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `$${value}`}
                width={40}
              />
              
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    revenue: 'Факт',
                    forecast: 'Прогноз',
                    upper: 'Верхняя граница',
                    lower: 'Нижняя граница',
                  };
                  return [formatCurrency(value), labels[name] || name];
                }}
                labelFormatter={(label) => new Date(label).toLocaleDateString('ru-RU')}
              />
              
              {/* Projection start line */}
              {projectionStartDate && (
                <ReferenceLine 
                  x={projectionStartDate} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="5 5"
                  label={{ 
                    value: 'Прогноз →', 
                    position: 'top',
                    fontSize: 10,
                    fill: 'hsl(var(--muted-foreground))'
                  }}
                />
              )}
              
              {/* Confidence interval */}
              <Area
                type="monotone"
                dataKey="upper"
                stroke="none"
                fill="url(#colorConfidence)"
                fillOpacity={1}
              />
              <Area
                type="monotone"
                dataKey="lower"
                stroke="none"
                fill="hsl(var(--background))"
                fillOpacity={1}
              />
              
              {/* Historical revenue */}
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                fill="url(#colorRevenue)"
                fillOpacity={1}
                strokeWidth={2}
              />
              
              {/* Forecast line */}
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="hsl(var(--chart-2))"
                fill="url(#colorForecast)"
                fillOpacity={1}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            Недостаточно данных для прогноза
          </div>
        )}

        {/* Confidence Warning */}
        {confidence < 40 && forecast.length > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-orange-700 dark:text-orange-400 text-xs sm:text-sm">
                  Низкая точность прогноза
                </h4>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  Высокая волатильность данных снижает точность. Используйте прогноз с осторожностью.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 text-[10px] sm:text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-primary rounded" />
            <span>Факт</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[hsl(var(--chart-2))] rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, hsl(var(--chart-2)) 2px, hsl(var(--chart-2)) 4px)' }} />
            <span>Прогноз</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-[hsl(var(--chart-2))] opacity-20 rounded" />
            <span>95% CI</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RevenueForecast;
