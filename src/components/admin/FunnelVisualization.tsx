/**
 * Funnel Visualization Component
 * Displays conversion funnel with stepped bars and metrics
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  UserPlus, 
  Music, 
  Globe, 
  CreditCard,
  TrendingDown,
  TrendingUp,
  ArrowDown,
  AlertTriangle
} from 'lucide-react';
import { useFunnelAnalytics, calculateFunnelMetrics, type FunnelStep } from '@/hooks/admin/useFunnelAnalytics';
import { cn } from '@/lib/utils';

const STEP_ICONS: Record<string, React.ReactNode> = {
  'Посетители': <Users className="h-4 w-4" />,
  'Регистрация': <UserPlus className="h-4 w-4" />,
  'Первый трек': <Music className="h-4 w-4" />,
  'Публикация': <Globe className="h-4 w-4" />,
  'Платёж': <CreditCard className="h-4 w-4" />,
};

const TIME_RANGES = [
  { label: '7д', days: 7 },
  { label: '14д', days: 14 },
  { label: '30д', days: 30 },
  { label: '90д', days: 90 },
] as const;

interface FunnelBarProps {
  step: FunnelStep;
  maxUsers: number;
  isFirst: boolean;
  isLast: boolean;
  isBiggestDropoff: boolean;
}

function FunnelBar({ step, maxUsers, isFirst, isLast, isBiggestDropoff }: FunnelBarProps) {
  const widthPercent = maxUsers > 0 ? (step.users_count / maxUsers) * 100 : 0;
  
  // Color based on conversion rate
  const getBarColor = () => {
    if (isFirst) return 'bg-primary';
    if (step.conversion_rate >= 70) return 'bg-green-500';
    if (step.conversion_rate >= 40) return 'bg-yellow-500';
    if (step.conversion_rate >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="relative">
      {/* Step header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {STEP_ICONS[step.step_name] || <Users className="h-4 w-4" />}
          </span>
          <span className="font-medium text-sm">{step.step_name}</span>
          {isBiggestDropoff && !isFirst && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Макс. отток
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold">{step.users_count.toLocaleString()}</span>
          {!isFirst && (
            <Badge 
              variant={step.conversion_rate >= 50 ? 'default' : 'secondary'}
              className={cn(
                'text-xs',
                step.conversion_rate >= 70 && 'bg-green-500/20 text-green-700 dark:text-green-400',
                step.conversion_rate < 30 && 'bg-red-500/20 text-red-700 dark:text-red-400'
              )}
            >
              {step.conversion_rate}%
            </Badge>
          )}
        </div>
      </div>
      
      {/* Funnel bar */}
      <div className="relative h-10 bg-muted/30 rounded-lg overflow-hidden">
        <div 
          className={cn(
            'h-full transition-all duration-500 rounded-lg',
            getBarColor()
          )}
          style={{ width: `${Math.max(widthPercent, 2)}%` }}
        />
        
        {/* Pattern overlay for visual effect */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
          }}
        />
      </div>
      
      {/* Dropoff indicator */}
      {!isLast && step.dropoff_rate > 0 && (
        <div className="flex items-center justify-center my-2 text-xs text-muted-foreground">
          <ArrowDown className="h-3 w-3 mr-1" />
          <span className={cn(
            step.dropoff_rate > 50 && 'text-red-500 font-medium'
          )}>
            -{step.dropoff_rate}% отток
          </span>
        </div>
      )}
    </div>
  );
}

export function FunnelVisualization() {
  const [selectedRange, setSelectedRange] = useState(30);
  
  const endDate = useMemo(() => new Date(), []);
  const startDate = useMemo(
    () => new Date(Date.now() - selectedRange * 24 * 60 * 60 * 1000),
    [selectedRange]
  );
  
  const { data: steps, isLoading, error } = useFunnelAnalytics({
    startDate,
    endDate,
  });
  
  const metrics = useMemo(
    () => calculateFunnelMetrics(steps || []),
    [steps]
  );
  
  const maxUsers = steps?.[0]?.users_count || 1;

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Воронка конверсии
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Ошибка загрузки данных</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Воронка конверсии
            </CardTitle>
            <CardDescription>
              Путь пользователя: от посещения до платежа
            </CardDescription>
          </div>
          
          <div className="flex gap-1">
            {TIME_RANGES.map(range => (
              <Button
                key={range.days}
                variant={selectedRange === range.days ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRange(range.days)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : metrics.totalVisitors.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Посетителей</div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : metrics.totalConverted.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Платящих</div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className={cn(
              'text-2xl font-bold',
              metrics.overallConversion >= 5 ? 'text-green-500' : 'text-orange-500'
            )}>
              {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : `${metrics.overallConversion}%`}
            </div>
            <div className="text-xs text-muted-foreground">Общая конверсия</div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            {isLoading ? (
              <Skeleton className="h-8 w-24 mx-auto" />
            ) : metrics.biggestDropoff ? (
              <>
                <div className="text-2xl font-bold text-red-500">
                  {metrics.biggestDropoff.rate}%
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {metrics.biggestDropoff.step}
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-500">
                  <TrendingUp className="h-6 w-6 mx-auto" />
                </div>
                <div className="text-xs text-muted-foreground">Нет данных</div>
              </>
            )}
          </div>
        </div>
        
        {/* Funnel visualization */}
        <div className="space-y-1">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-10 w-full" />
                {i < 4 && <div className="h-6" />}
              </div>
            ))
          ) : (
            steps?.map((step, index) => (
              <FunnelBar
                key={step.step_name}
                step={step}
                maxUsers={maxUsers}
                isFirst={index === 0}
                isLast={index === steps.length - 1}
                isBiggestDropoff={
                  metrics.biggestDropoff?.step === step.step_name && index > 0
                }
              />
            ))
          )}
        </div>
        
        {/* Insights */}
        {!isLoading && metrics.biggestDropoff && metrics.biggestDropoff.rate > 50 && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-700 dark:text-orange-400">
                  Обнаружен высокий отток
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  На этапе "{metrics.biggestDropoff.step}" теряется {metrics.biggestDropoff.rate}% пользователей. 
                  Рекомендуется проанализировать UX этого шага.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
