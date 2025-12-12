/**
 * Performance Metrics Dashboard Tab for Admin Panel
 * Displays bundle size, Core Web Vitals, and Lighthouse scores
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Gauge, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Zap, 
  Eye,
  Clock,
  Layout
} from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  target: number;
  icon: typeof Gauge;
  status: 'good' | 'needs-improvement' | 'poor';
}

// Sprint 025 targets
const TARGETS = {
  bundleSize: 900, // KB
  tti: 3500, // ms
  fcp: 2500, // ms
  lcp: 3500, // ms
  cls: 0.1,
  tbt: 500, // ms
  lighthousePerformance: 85,
  lighthouseAccessibility: 90,
  listFps: 55,
};

// Baseline metrics (to be replaced with real data)
const BASELINE_METRICS: PerformanceMetric[] = [
  {
    name: 'Bundle Size (JS)',
    value: 1160,
    unit: 'KB',
    target: TARGETS.bundleSize,
    icon: Package,
    status: 'poor',
  },
  {
    name: 'Time to Interactive',
    value: 4500,
    unit: 'ms',
    target: TARGETS.tti,
    icon: Zap,
    status: 'needs-improvement',
  },
  {
    name: 'First Contentful Paint',
    value: 2200,
    unit: 'ms',
    target: TARGETS.fcp,
    icon: Eye,
    status: 'good',
  },
  {
    name: 'Largest Contentful Paint',
    value: 3200,
    unit: 'ms',
    target: TARGETS.lcp,
    icon: Clock,
    status: 'good',
  },
  {
    name: 'Cumulative Layout Shift',
    value: 0.05,
    unit: '',
    target: TARGETS.cls,
    icon: Layout,
    status: 'good',
  },
];

function getStatusColor(status: PerformanceMetric['status']): string {
  switch (status) {
    case 'good':
      return 'text-green-500';
    case 'needs-improvement':
      return 'text-amber-500';
    case 'poor':
      return 'text-red-500';
  }
}

function getStatusBadge(status: PerformanceMetric['status']) {
  switch (status) {
    case 'good':
      return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Хорошо</Badge>;
    case 'needs-improvement':
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Улучшить</Badge>;
    case 'poor':
      return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Критично</Badge>;
  }
}

function getProgress(value: number, target: number, isLowerBetter: boolean = true): number {
  if (isLowerBetter) {
    // For metrics where lower is better (bundle size, TTI, etc.)
    if (value <= target) return 100;
    const ratio = target / value;
    return Math.max(0, Math.min(100, ratio * 100));
  } else {
    // For metrics where higher is better (Lighthouse score)
    return Math.max(0, Math.min(100, (value / target) * 100));
  }
}

export function PerformanceTab() {
  const [metrics] = useState<PerformanceMetric[]>(BASELINE_METRICS);

  const lighthouseScores = {
    performance: 72,
    accessibility: 91,
    bestPractices: 88,
    seo: 86,
  };

  return (
    <div className="space-y-6">
      {/* Sprint 025 Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Sprint 025 Цели
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Bundle Size</p>
              <p className="font-medium">
                1.16 MB → <span className="text-green-500">&lt;900 KB</span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">TTI (4G)</p>
              <p className="font-medium">
                ~4.5s → <span className="text-green-500">&lt;3.5s</span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">List FPS</p>
              <p className="font-medium">
                ~45 → <span className="text-green-500">&gt;55</span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Lighthouse Mobile</p>
              <p className="font-medium">
                TBD → <span className="text-green-500">&gt;85</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lighthouse Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Lighthouse Scores (Mobile)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(lighthouseScores).map(([key, value]) => {
              const label = {
                performance: 'Performance',
                accessibility: 'Accessibility',
                bestPractices: 'Best Practices',
                seo: 'SEO',
              }[key];
              
              const target = key === 'performance' ? 85 : 90;
              const status = value >= target ? 'good' : value >= target * 0.8 ? 'needs-improvement' : 'poor';
              
              return (
                <div key={key} className="text-center p-4 rounded-lg bg-muted/50">
                  <div className={`text-3xl font-bold ${getStatusColor(status)}`}>
                    {value}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{label}</p>
                  <Progress 
                    value={value} 
                    className="mt-2 h-1.5"
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              const progress = getProgress(metric.value, metric.target);
              
              return (
                <div key={metric.name} className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg bg-muted ${getStatusColor(metric.status)}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{metric.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {metric.value}{metric.unit}
                          <span className="text-muted-foreground ml-1">
                            / {metric.target}{metric.unit}
                          </span>
                        </span>
                        {getStatusBadge(metric.status)}
                      </div>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                  
                  {metric.value <= metric.target ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Оптимизации Sprint 025</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span>Централизация framer-motion импортов (112 файлов)</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span>Lazy loading AdminDashboard, StemStudio, FullscreenPlayer</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span>react-virtuoso для Library (1000+ items)</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span>Music Lab Hub унификация</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span>Lighthouse CI workflow</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span>Bundle size monitoring</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
