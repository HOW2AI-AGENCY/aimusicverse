/**
 * Admin Economy Page
 * 
 * Economy management dashboard with:
 * - Economy config editor (credits, rewards, limits)
 * - Stars payments overview
 * - Subscription tiers management
 * - Revenue analytics
 * 
 * TODO: Add Tinkoff payments integration
 * TODO: Add refund management
 * TODO: Add promo codes system
 * 
 * @author MusicVerse AI
 * @version 1.0.0
 */

import { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Coins, 
  Star, 
  CreditCard, 
  Settings,
  TrendingUp,
} from 'lucide-react';

// Lazy load heavy components
const EconomyConfigEditor = lazy(() => 
  import('../economy/EconomyConfigEditor').then(m => ({ default: m.EconomyConfigEditor }))
);
const StarsPaymentsPanel = lazy(() => 
  import('../StarsPaymentsPanel').then(m => ({ default: m.StarsPaymentsPanel }))
);
const SubscriptionTiersManager = lazy(() => 
  import('../SubscriptionTiersManager').then(m => ({ default: m.SubscriptionTiersManager }))
);

// ============================================================
// Tab Configuration
// ============================================================
const TABS = [
  { id: 'config', label: 'Настройки', icon: Settings },
  { id: 'payments', label: 'Платежи', icon: Star },
  { id: 'tiers', label: 'Тарифы', icon: CreditCard },
  { id: 'analytics', label: 'Аналитика', icon: TrendingUp },
] as const;

// ============================================================
// Loading Skeleton
// ============================================================
const TabSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-8 w-48" />
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
    <Skeleton className="h-64" />
  </div>
);

// ============================================================
// Analytics Placeholder
// ============================================================
const EconomyAnalytics = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Аналитика доходов
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        {/* TODO: Implement revenue analytics charts */}
        <div className="text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Аналитика доходов</p>
          <p className="text-sm mt-2">В разработке</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// ============================================================
// Main Component
// ============================================================
export function AdminEconomy() {
  const [activeTab, setActiveTab] = useState<string>('config');

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Coins className="h-6 w-6" />
          Экономика
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Управление кредитами, платежами и тарифами
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

        {/* Config Tab */}
        <TabsContent value="config" className="mt-4">
          <Suspense fallback={<TabSkeleton />}>
            <EconomyConfigEditor />
          </Suspense>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="mt-4">
          <Suspense fallback={<TabSkeleton />}>
            <StarsPaymentsPanel />
          </Suspense>
        </TabsContent>

        {/* Tiers Tab */}
        <TabsContent value="tiers" className="mt-4">
          <Suspense fallback={<TabSkeleton />}>
            <SubscriptionTiersManager />
          </Suspense>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-4">
          <EconomyAnalytics />
        </TabsContent>
      </Tabs>

      {/* TODO: Add quick stats row */}
      {/* TODO: Add transaction search */}
    </div>
  );
}

export default AdminEconomy;
