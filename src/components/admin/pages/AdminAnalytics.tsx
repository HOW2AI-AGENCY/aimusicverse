/**
 * Admin Analytics Page
 * 
 * Comprehensive analytics dashboard with:
 * - Generation statistics
 * - User engagement metrics
 * - Performance monitoring
 * - Deeplink analytics
 * 
 * TODO: Add custom date range selector
 * TODO: Add data export functionality
 * TODO: Add comparison mode (vs previous period)
 * 
 * @author MusicVerse AI
 * @version 1.0.0
 */

import { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, 
  Zap, 
  Link2, 
  Activity,
  TrendingUp,
} from 'lucide-react';

// Lazy load heavy analytics components
const GenerationStatsPanel = lazy(() => 
  import('../GenerationStatsPanel').then(m => ({ default: m.GenerationStatsPanel }))
);
const EnhancedAnalyticsPanel = lazy(() => 
  import('../EnhancedAnalyticsPanel').then(m => ({ default: m.EnhancedAnalyticsPanel }))
);
const DeeplinkAnalyticsPanel = lazy(() => 
  import('../DeeplinkAnalyticsPanel').then(m => ({ default: m.DeeplinkAnalyticsPanel }))
);
const PerformanceDashboard = lazy(() => 
  import('../../performance').then(m => ({ default: m.PerformanceDashboard }))
);

// ============================================================
// Tab Configuration
// ============================================================
const TABS = [
  { id: 'overview', label: 'Обзор', icon: BarChart3 },
  { id: 'generation', label: 'Генерация', icon: Zap },
  { id: 'deeplinks', label: 'Deeplinks', icon: Link2 },
  { id: 'performance', label: 'Performance', icon: Activity },
] as const;

// ============================================================
// Loading Skeleton
// ============================================================
const AnalyticsSkeleton = () => (
  <div className="space-y-4 p-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
    <Skeleton className="h-64" />
    <Skeleton className="h-48" />
  </div>
);

// ============================================================
// Main Component
// ============================================================
export function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState<string>('overview');

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Аналитика
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Статистика генераций, вовлечённости и производительности
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          <Suspense fallback={<AnalyticsSkeleton />}>
            <EnhancedAnalyticsPanel />
          </Suspense>
        </TabsContent>

        {/* Generation Tab */}
        <TabsContent value="generation" className="mt-4">
          <Suspense fallback={<AnalyticsSkeleton />}>
            <GenerationStatsPanel />
          </Suspense>
        </TabsContent>

        {/* Deeplinks Tab */}
        <TabsContent value="deeplinks" className="mt-4">
          <Suspense fallback={<AnalyticsSkeleton />}>
            <DeeplinkAnalyticsPanel />
          </Suspense>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="mt-4">
          <Suspense fallback={<AnalyticsSkeleton />}>
            <PerformanceDashboard />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* TODO: Add date range picker */}
      {/* TODO: Add export button */}
      {/* TODO: Add comparison toggle */}
    </div>
  );
}

export default AdminAnalytics;
