/**
 * PerformanceDashboard - Core Web Vitals and performance monitoring
 */
import { usePerformanceMetrics } from '@/hooks/admin/usePerformanceMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { 
  Gauge,
  Zap,
  Clock,
  Monitor,
  Smartphone,
  Tablet,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const DEVICE_ICONS: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

interface MetricCardProps {
  label: string;
  value: number;
  unit: string;
  threshold: { good: number; poor: number };
  isLowerBetter?: boolean;
  goodPercent?: number;
}

function MetricCard({ label, value, unit, threshold, isLowerBetter = true, goodPercent }: MetricCardProps) {
  const isGood = isLowerBetter ? value <= threshold.good : value >= threshold.good;
  const isPoor = isLowerBetter ? value >= threshold.poor : value <= threshold.poor;
  
  const status = isGood ? 'good' : isPoor ? 'poor' : 'needs-improvement';
  const statusColors = {
    good: 'text-green-500 bg-green-500/10',
    'needs-improvement': 'text-yellow-500 bg-yellow-500/10',
    poor: 'text-red-500 bg-red-500/10',
  };
  
  const StatusIcon = isGood ? CheckCircle2 : isPoor ? AlertTriangle : Zap;

  return (
    <div className={cn('p-2 sm:p-3 rounded-lg border', statusColors[status])}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs sm:text-sm font-medium">{label}</span>
        <StatusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
      </div>
      <div className="text-lg sm:text-2xl font-bold">
        {value.toFixed(label === 'CLS' ? 3 : 0)}
        <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1">{unit}</span>
      </div>
      {goodPercent !== undefined && (
        <div className="mt-1">
          <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">
            {goodPercent.toFixed(0)}% в норме
          </div>
          <Progress value={goodPercent} className="h-1" />
        </div>
      )}
    </div>
  );
}

function ScoreGauge({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <div className="text-muted-foreground text-sm">Нет данных</div>
      </div>
    );
  }

  const color = score >= 90 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500';
  const bgColor = score >= 90 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-24 h-24 sm:w-32 sm:h-32">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted/30"
          />
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${score * 2.83} 283`}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-2xl sm:text-3xl font-bold', color)}>{score}</span>
          <span className="text-[10px] sm:text-xs text-muted-foreground">из 100</span>
        </div>
      </div>
      <Badge 
        variant="secondary" 
        className={cn('mt-2 text-xs', bgColor, 'text-white')}
      >
        {score >= 90 ? 'Отлично' : score >= 50 ? 'Нормально' : 'Плохо'}
      </Badge>
    </div>
  );
}

export function PerformanceDashboard() {
  const [days, setDays] = useState(7);
  const { 
    stats, 
    dailyTrend, 
    deviceBreakdown, 
    performanceScore, 
    isLoading,
    thresholds 
  } = usePerformanceMetrics(days);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-[200px]" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Производительность
        </h2>
        <Select value={String(days)} onValueChange={v => setDays(Number(v))}>
          <SelectTrigger className="w-[100px] sm:w-[120px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 день</SelectItem>
            <SelectItem value="7">7 дней</SelectItem>
            <SelectItem value="14">14 дней</SelectItem>
            <SelectItem value="30">30 дней</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Performance Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Performance Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ScoreGauge score={performanceScore} />
          </CardContent>
        </Card>

        {/* Core Web Vitals Grid */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Core Web Vitals
              <Badge variant="outline" className="ml-2 text-xs">
                {stats.totalSamples} замеров
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              <MetricCard
                label="LCP"
                value={stats.avgLcp}
                unit="ms"
                threshold={thresholds.lcp}
                goodPercent={stats.goodLcpPercent}
              />
              <MetricCard
                label="FID"
                value={stats.avgFid}
                unit="ms"
                threshold={thresholds.fid}
                goodPercent={stats.goodFidPercent}
              />
              <MetricCard
                label="CLS"
                value={stats.avgCls}
                unit=""
                threshold={thresholds.cls}
                goodPercent={stats.goodClsPercent}
              />
              <MetricCard
                label="FCP"
                value={stats.avgFcp}
                unit="ms"
                threshold={thresholds.fcp}
              />
              <MetricCard
                label="TTFB"
                value={stats.avgTtfb}
                unit="ms"
                threshold={thresholds.ttfb}
              />
              <div className="p-2 sm:p-3 rounded-lg border bg-muted/30">
                <div className="text-xs sm:text-sm font-medium mb-1">P75 LCP</div>
                <div className="text-lg sm:text-2xl font-bold">
                  {stats.p75Lcp.toFixed(0)}
                  <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1">ms</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trend Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Динамика LCP/FCP
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyTrend.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                Нет данных
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} width={40} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgLcp"
                    name="LCP"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgFcp"
                    name="FCP"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              По устройствам
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deviceBreakdown.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                Нет данных
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={deviceBreakdown} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis 
                    type="category" 
                    dataKey="device" 
                    tick={{ fontSize: 10 }} 
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(0)} ms`, 'Avg LCP']}
                  />
                  <Bar dataKey="avgLcp" radius={[0, 4, 4, 0]}>
                    {deviceBreakdown.map((entry, index) => (
                      <Cell 
                        key={index}
                        fill={
                          entry.avgLcp <= 2500 
                            ? 'hsl(142, 76%, 36%)' 
                            : entry.avgLcp <= 4000 
                              ? 'hsl(45, 93%, 47%)' 
                              : 'hsl(var(--destructive))'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
