/**
 * Admin Dashboard Page
 * 
 * Container component that orchestrates admin functionality.
 * All business logic is delegated to useAdminDashboard hook.
 * UI is split into modular tab components.
 * 
 * @module pages/AdminDashboard
 * @see src/hooks/admin/useAdminDashboard.ts for state management
 * @see src/components/admin/dashboard/ for tab components
 * 
 * ## Architecture
 * 
 * ```
 * AdminDashboard (this file - orchestration only)
 * ├── useAdminDashboard (hook - all state & logic)
 * ├── AdminDashboardHeader (component - header UI)
 * ├── AdminTabSelector (component - tab navigation)
 * └── Tab Components (components - tab content)
 * ```
 * 
 * ## Refactoring Notes
 * 
 * This file was refactored from 589 lines to ~200 lines by:
 * 1. Extracting state management to useAdminDashboard hook
 * 2. Creating presentational components for tabs
 * 3. Using composition pattern for tab content
 * 
 * @example
 * ```tsx
 * // Route setup
 * <Route path="/admin" element={<AdminDashboard />} />
 * ```
 */

import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, MessageSquare } from 'lucide-react';

// Dashboard components
import { 
  AdminDashboardHeader, 
  AdminTabSelector,
  OverviewTab,
  TracksTab,
  UsersTab,
  BotTab,
} from '@/components/admin/dashboard';

// Existing admin panels (lazy loaded in production)
import { EnhancedAnalyticsPanel } from '@/components/admin/EnhancedAnalyticsPanel';
import { GenerationStatsPanel } from '@/components/admin/GenerationStatsPanel';
import { PerformanceDashboard } from '@/components/performance';
import { AlertAnalyticsPanel } from '@/components/admin/AlertAnalyticsPanel';
import { AlertHistoryPanel } from '@/components/admin/AlertHistoryPanel';
import { ModerationReportsPanel } from '@/components/admin/ModerationReportsPanel';
import { BotMenuEditor } from '@/components/admin/BotMenuEditor';
import { MobileTelegramBotSettings } from '@/components/admin/MobileTelegramBotSettings';
import { AdminBotImagesPanel } from '@/components/admin/AdminBotImagesPanel';
import { StarsPaymentsPanel } from '@/components/admin/StarsPaymentsPanel';
import { GenerationLogsPanel } from '@/components/admin/GenerationLogsPanel';
import { UserBalancesPanel } from '@/components/admin/UserBalancesPanel';
import { DeeplinkAnalyticsPanel } from '@/components/admin/DeeplinkAnalyticsPanel';
import { BroadcastPanel } from '@/components/admin/BroadcastPanel';
import { EconomyConfigEditor } from '@/components/admin/economy';
import { FeatureFlagsEditor } from '@/components/admin/features';
import { SubscriptionTiersManager } from '@/components/admin/SubscriptionTiersManager';

// Dialogs
import { AdminUserCreditsDialog } from '@/components/admin/AdminUserCreditsDialog';
import { AdminUserSubscriptionDialog } from '@/components/admin/AdminUserSubscriptionDialog';
import { AdminSendMessageDialog } from '@/components/admin/AdminSendMessageDialog';
import { AdminTrackDetailsDialog } from '@/components/admin/AdminTrackDetailsDialog';

// Hook
import { useAdminDashboard } from '@/hooks/admin/useAdminDashboard';

// ============================================================================
// Main Component
// ============================================================================

/**
 * Admin Dashboard - main admin interface
 * 
 * Features:
 * - 18 different tab views for various admin tasks
 * - User management with bulk actions
 * - Track management and moderation
 * - Bot metrics and configuration
 * - Economy and feature flag management
 * - Broadcast messaging
 */
export default function AdminDashboard() {
  const dashboard = useAdminDashboard();
  
  // -------------------------------------------------------------------------
  // Loading State
  // -------------------------------------------------------------------------
  if (dashboard.isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Проверка доступа...
      </div>
    );
  }
  
  // -------------------------------------------------------------------------
  // Authorization Check
  // -------------------------------------------------------------------------
  if (!dashboard.isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div 
      className="container mx-auto p-3 md:p-4 space-y-4 pb-[calc(6rem+env(safe-area-inset-bottom))]"
      style={{
        paddingTop: 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 0.75rem), calc(env(safe-area-inset-top, 0px) + 0.75rem))'
      }}
    >
      {/* Header */}
      <AdminDashboardHeader onRefresh={dashboard.refetchMetrics} />
      
      {/* Tab Selector */}
      <AdminTabSelector
        activeTab={dashboard.activeTab}
        onTabChange={dashboard.setActiveTab}
        isMobile={dashboard.isMobile}
      />
      
      {/* Tab Content */}
      <div className="space-y-4">
        {dashboard.activeTab === 'overview' && (
          <OverviewTab stats={dashboard.stats} />
        )}
        
        {dashboard.activeTab === 'analytics' && (
          <EnhancedAnalyticsPanel />
        )}
        
        {dashboard.activeTab === 'generation-stats' && (
          <GenerationStatsPanel />
        )}
        
        {dashboard.activeTab === 'performance' && (
          <PerformanceDashboard />
        )}
        
        {dashboard.activeTab === 'alerts' && (
          <div className="space-y-6">
            <AlertAnalyticsPanel />
            <AlertHistoryPanel />
          </div>
        )}
        
        {dashboard.activeTab === 'tracks' && (
          <TracksTab
            tracks={dashboard.tracks}
            isLoading={dashboard.tracksLoading}
            searchQuery={dashboard.trackSearch}
            onSearchChange={dashboard.setTrackSearch}
            onSelectTrack={dashboard.openTrackDetails}
          />
        )}
        
        {dashboard.activeTab === 'moderation' && (
          <ModerationReportsPanel />
        )}
        
        {dashboard.activeTab === 'feedback' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Обратная связь
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Просмотр и ответ на сообщения пользователей из бота.
              </p>
              <Button 
                onClick={() => dashboard.navigate('/admin/feedback')} 
                className="w-full"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Открыть панель фидбека
              </Button>
            </CardContent>
          </Card>
        )}
        
        {dashboard.activeTab === 'bot' && (
          <BotTab metrics={dashboard.metrics} isMobile={dashboard.isMobile} />
        )}
        
        {dashboard.activeTab === 'telegram' && (
          <div className="space-y-6">
            <BotMenuEditor />
            <MobileTelegramBotSettings />
            <AdminBotImagesPanel />
          </div>
        )}
        
        {dashboard.activeTab === 'payments' && (
          <StarsPaymentsPanel />
        )}
        
        {dashboard.activeTab === 'logs' && (
          <GenerationLogsPanel />
        )}
        
        {dashboard.activeTab === 'balances' && (
          <UserBalancesPanel />
        )}
        
        {dashboard.activeTab === 'deeplinks' && (
          <DeeplinkAnalyticsPanel />
        )}
        
        {dashboard.activeTab === 'broadcast' && (
          <div className="grid gap-4 md:grid-cols-2">
            <BroadcastPanel />
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Блог
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Создавайте статьи и отправляйте их пользователям
                </p>
                <Button 
                  onClick={() => dashboard.navigate('/blog')} 
                  className="w-full"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Открыть блог
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        
        {dashboard.activeTab === 'economy' && (
          <div className="space-y-4">
            <EconomyConfigEditor />
            <FeatureFlagsEditor />
          </div>
        )}
        
        {dashboard.activeTab === 'tariffs' && (
          <Card>
            <CardContent className="pt-6">
              <SubscriptionTiersManager />
            </CardContent>
          </Card>
        )}
        
        {dashboard.activeTab === 'users' && (
          <UsersTab
            users={dashboard.filteredUsers}
            selectedUsers={dashboard.selectedUsers}
            searchQuery={dashboard.userSearch}
            filter={dashboard.userFilter}
            onSearchChange={dashboard.setUserSearch}
            onFilterChange={dashboard.setUserFilter}
            onSelectUser={dashboard.toggleUserSelection}
            onSelectAll={dashboard.selectAllUsers}
            onClearSelection={dashboard.clearSelection}
            onOpenCredits={dashboard.openCreditsDialog}
            onOpenSubscription={dashboard.openSubscriptionDialog}
            onOpenMessage={dashboard.openMessageDialog}
            onToggleAdmin={(userId, action) => 
              dashboard.toggleRole.mutate({ userId, role: 'admin', action })
            }
          />
        )}
      </div>
      
      {/* Dialogs */}
      <AdminUserCreditsDialog
        open={!!dashboard.dialogs.creditsDialogUser}
        onOpenChange={(open) => !open && dashboard.closeCreditsDialog()}
        user={dashboard.dialogs.creditsDialogUser}
        onSuccess={() => dashboard.refetchUsers()}
      />
      
      <AdminUserSubscriptionDialog
        open={!!dashboard.dialogs.subscriptionDialogUser}
        onOpenChange={(open) => !open && dashboard.closeSubscriptionDialog()}
        user={dashboard.dialogs.subscriptionDialogUser}
        currentTier={dashboard.dialogs.subscriptionDialogUser?.subscription_tier || 'free'}
        currentExpires={dashboard.dialogs.subscriptionDialogUser?.subscription_expires_at}
        onSuccess={() => dashboard.refetchUsers()}
      />
      
      <AdminSendMessageDialog
        open={dashboard.dialogs.messageDialogOpen}
        onOpenChange={(open) => !open && dashboard.closeMessageDialog()}
        selectedUsers={dashboard.selectedUsers}
        onClearSelection={dashboard.clearSelection}
      />
      
      <AdminTrackDetailsDialog
        open={!!dashboard.dialogs.selectedTrack}
        onOpenChange={(open) => !open && dashboard.closeTrackDetails()}
        track={dashboard.dialogs.selectedTrack as any}
      />
    </div>
  );
}
