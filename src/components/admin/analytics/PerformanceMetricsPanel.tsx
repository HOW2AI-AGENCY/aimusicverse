/**
 * Performance Metrics Panel
 * Shows Web Vitals and application performance data
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gauge, Zap, Clock, MousePointer, Move } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceMetricsPanelProps {
  timePeriod: string;
}

// Web Vitals thresholds (good/needs-improvement/poor)
const VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000, unit: 'ms', name: 'Largest Contentful Paint' },
  FID: { good: 100, poor: 300, unit: 'ms', name: 'First Input Delay' },
  CLS: { good: 0.1, poor: 0.25, unit: '', name: 'Cumulative Layout Shift' },
  TTFB: { good: 800, poor: 1800, unit: 'ms', name: 'Time to First Byte' },
  INP: { good: 200, poor: 500, unit: 'ms', name: 'Interaction to Next Paint' },
};

// Mock data - in production this would come from analytics aggregates
const MOCK_VITALS = {
  LCP: { value: 1850, samples: 1234 },
  FID: { value: 45, samples: 890 },
  CLS: { value: 0.08, samples: 1234 },
  TTFB: { value: 320, samples: 1234 },
  INP: { value: 120, samples: 567 },
};

const VITAL_ICONS = {
  LCP: Gauge,
  FID: MousePointer,
  CLS: Move,
  TTFB: Clock,
  INP: Zap,
};

export function PerformanceMetricsPanel({ timePeriod }: PerformanceMetricsPanelProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Web Vitals Grid */}
      <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        {Object.entries(VITALS_THRESHOLDS).map(([key, threshold]) => {
          const vital = MOCK_VITALS[key as keyof typeof MOCK_VITALS];
          const rating = getVitalRating(vital.value, threshold);
          const Icon = VITAL_ICONS[key as keyof typeof VITAL_ICONS];
          
          return (
            <Card key={key}>
              <CardContent className="p-2.5 sm:p-4">
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className={cn(
                      "p-1.5 sm:p-2 rounded-lg",
                      rating === 'good' && "bg-green-500/10",
                      rating === 'needs-improvement' && "bg-yellow-500/10",
                      rating === 'poor' && "bg-red-500/10"
                    )}>
                      <Icon className={cn(
                        "h-3 w-3 sm:h-4 sm:w-4",
                        rating === 'good' && "text-green-500",
                        rating === 'needs-improvement' && "text-yellow-500",
                        rating === 'poor' && "text-red-500"
                      )} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm">{key}</p>
                      <p className="text-[9px] sm:text-xs text-muted-foreground truncate hidden xs:block">{threshold.name}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      rating === 'good' ? 'default' : 
                      rating === 'needs-improvement' ? 'secondary' : 
                      'destructive'
                    }
                    className="text-[9px] sm:text-xs shrink-0"
                  >
                    {rating === 'good' ? '✓' : rating === 'needs-improvement' ? '~' : '!'}
                  </Badge>
                </div>
                
                <div className="mt-2 sm:mt-4">
                  <div className="flex items-baseline gap-0.5 sm:gap-1">
                    <span className="text-lg sm:text-2xl font-bold">
                      {formatVitalValue(vital.value, key)}
                    </span>
                    <span className="text-[10px] sm:text-sm text-muted-foreground">
                      {threshold.unit}
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                    {vital.samples.toLocaleString()} изм.
                  </p>
                </div>

                <div className="mt-2 sm:mt-3">
                  <VitalProgressBar 
                    value={vital.value} 
                    threshold={threshold} 
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Tips */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base">Рекомендации</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-3">
            {getPerformanceTips(MOCK_VITALS).map((tip, i) => (
              <div key={i} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50">
                <div className={cn(
                  "mt-0.5 p-1 rounded shrink-0",
                  tip.priority === 'high' && "bg-red-500/20",
                  tip.priority === 'medium' && "bg-yellow-500/20",
                  tip.priority === 'low' && "bg-blue-500/20"
                )}>
                  <tip.icon className={cn(
                    "h-3 w-3 sm:h-4 sm:w-4",
                    tip.priority === 'high' && "text-red-500",
                    tip.priority === 'medium' && "text-yellow-500",
                    tip.priority === 'low' && "text-blue-500"
                  )} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium">{tip.title}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bundle Size Info */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base">Размер бандла</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <BundleStat label="Main JS" value="142 KB" target="<150 KB" status="good" />
            <BundleStat label="CSS" value="28 KB" target="<50 KB" status="good" />
            <BundleStat label="Vendor" value="89 KB" target="<100 KB" status="good" />
            <BundleStat label="Total" value="259 KB" target="<300 KB" status="good" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getVitalRating(value: number, threshold: typeof VITALS_THRESHOLDS.LCP): 'good' | 'needs-improvement' | 'poor' {
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

function formatVitalValue(value: number, key: string): string {
  if (key === 'CLS') return value.toFixed(3);
  return Math.round(value).toString();
}

function VitalProgressBar({ 
  value, 
  threshold 
}: { 
  value: number; 
  threshold: typeof VITALS_THRESHOLDS.LCP;
}) {
  // Normalize to percentage (0-100), capped at poor threshold
  const maxValue = threshold.poor * 1.5;
  const percentage = Math.min((value / maxValue) * 100, 100);
  const goodPercentage = (threshold.good / maxValue) * 100;
  const poorPercentage = (threshold.poor / maxValue) * 100;

  return (
    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
      {/* Good zone */}
      <div 
        className="absolute h-full bg-green-500/30"
        style={{ width: `${goodPercentage}%` }}
      />
      {/* Needs improvement zone */}
      <div 
        className="absolute h-full bg-yellow-500/30"
        style={{ left: `${goodPercentage}%`, width: `${poorPercentage - goodPercentage}%` }}
      />
      {/* Poor zone */}
      <div 
        className="absolute h-full bg-red-500/30"
        style={{ left: `${poorPercentage}%`, right: 0 }}
      />
      {/* Current value indicator */}
      <div 
        className={cn(
          "absolute h-full w-1 rounded",
          value <= threshold.good && "bg-green-500",
          value > threshold.good && value <= threshold.poor && "bg-yellow-500",
          value > threshold.poor && "bg-red-500"
        )}
        style={{ left: `${percentage}%`, transform: 'translateX(-50%)' }}
      />
    </div>
  );
}

function BundleStat({ 
  label, 
  value, 
  target, 
  status 
}: { 
  label: string; 
  value: string; 
  target: string; 
  status: 'good' | 'warning' | 'bad';
}) {
  return (
    <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50">
      <p className="text-sm sm:text-lg font-bold">{value}</p>
      <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
      <Badge 
        variant={status === 'good' ? 'default' : status === 'warning' ? 'secondary' : 'destructive'}
        className="mt-1 text-[9px] sm:text-xs"
      >
        {target}
      </Badge>
    </div>
  );
}

function getPerformanceTips(vitals: typeof MOCK_VITALS) {
  const tips: Array<{
    icon: typeof Gauge;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }> = [];

  if (vitals.LCP.value > VITALS_THRESHOLDS.LCP.good) {
    tips.push({
      icon: Gauge,
      title: 'Оптимизируйте LCP',
      description: 'Используйте preload для критических ресурсов и оптимизируйте изображения',
      priority: vitals.LCP.value > VITALS_THRESHOLDS.LCP.poor ? 'high' : 'medium',
    });
  }

  if (vitals.CLS.value > VITALS_THRESHOLDS.CLS.good) {
    tips.push({
      icon: Move,
      title: 'Уменьшите CLS',
      description: 'Задайте размеры для изображений и избегайте динамической вставки контента',
      priority: vitals.CLS.value > VITALS_THRESHOLDS.CLS.poor ? 'high' : 'medium',
    });
  }

  if (tips.length === 0) {
    tips.push({
      icon: Zap,
      title: 'Производительность отличная!',
      description: 'Все Core Web Vitals в зелёной зоне. Продолжайте мониторинг.',
      priority: 'low',
    });
  }

  return tips;
}
