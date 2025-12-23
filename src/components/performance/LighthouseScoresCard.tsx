/**
 * Card showing Lighthouse scores summary
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Gauge, TrendingUp, TrendingDown } from 'lucide-react';
import { PerformanceMetric, PERFORMANCE_TARGETS } from '@/hooks/usePerformanceMetrics';

interface LighthouseScoresCardProps {
  metric: PerformanceMetric | null | undefined;
  previousMetric?: PerformanceMetric | null;
  isLoading: boolean;
}

function getScoreColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground';
  if (score >= 90) return 'text-green-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function getProgressColor(score: number | null): string {
  if (score === null) return 'bg-muted';
  if (score >= 90) return '[&>div]:bg-green-500';
  if (score >= 50) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-red-500';
}

export function LighthouseScoresCard({ metric, previousMetric, isLoading }: LighthouseScoresCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Lighthouse Scores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const scores = [
    {
      name: 'Performance',
      value: metric?.lighthouse_performance ?? null,
      prevValue: previousMetric?.lighthouse_performance ?? null,
      target: PERFORMANCE_TARGETS.lighthousePerformance,
    },
    {
      name: 'Accessibility',
      value: metric?.lighthouse_accessibility ?? null,
      prevValue: previousMetric?.lighthouse_accessibility ?? null,
      target: PERFORMANCE_TARGETS.lighthouseAccessibility,
    },
    {
      name: 'Best Practices',
      value: metric?.lighthouse_best_practices ?? null,
      prevValue: previousMetric?.lighthouse_best_practices ?? null,
      target: PERFORMANCE_TARGETS.lighthouseBestPractices,
    },
    {
      name: 'SEO',
      value: metric?.lighthouse_seo ?? null,
      prevValue: previousMetric?.lighthouse_seo ?? null,
      target: PERFORMANCE_TARGETS.lighthouseSeo,
    },
  ];

  const avgScore = scores.reduce((sum, s) => sum + (s.value || 0), 0) / scores.filter(s => s.value !== null).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            Lighthouse Scores
          </CardTitle>
          <span className={`text-lg font-bold ${getScoreColor(avgScore)}`}>
            {isNaN(avgScore) ? '—' : Math.round(avgScore)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {scores.map((score) => {
          const diff = score.value && score.prevValue 
            ? score.value - score.prevValue 
            : 0;
          
          return (
            <div key={score.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{score.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-mono ${getScoreColor(score.value)}`}>
                    {score.value ?? '—'}
                  </span>
                  {diff !== 0 && (
                    <span className={`flex items-center text-xs ${diff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {diff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(diff)}
                    </span>
                  )}
                </div>
              </div>
              <Progress 
                value={score.value ?? 0} 
                className={`h-1.5 ${getProgressColor(score.value)}`}
              />
            </div>
          );
        })}
        
        <div className="pt-2 border-t text-xs text-muted-foreground">
          Target: Performance {'>'} {PERFORMANCE_TARGETS.lighthousePerformance}, 
          Accessibility {'>'} {PERFORMANCE_TARGETS.lighthouseAccessibility}
        </div>
      </CardContent>
    </Card>
  );
}
