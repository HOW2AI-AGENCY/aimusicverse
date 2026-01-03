import { useState, useEffect, useMemo, lazy, Suspense, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { Sidebar } from './Sidebar';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ResizablePlayer } from './ResizablePlayer';
import { OnboardingTrigger } from './onboarding/OnboardingTrigger';
import { usePlaybackTracking } from '@/hooks/usePlaybackTracking';
import { SkipToContent } from './ui/skip-to-content';
import { GuestModeBanner } from './GuestModeBanner';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { cn } from '@/lib/utils';
import { setSubscriptionDialogCallback } from '@/hooks/useTrackActions';
import { useTelegramSettingsButton } from '@/hooks/telegram';
import { SmartAlertProvider } from './notifications/smart-alerts';
import { BetaFooter } from './BetaFooter';
import { useAdminDailyStats } from '@/hooks/useAdminDailyStats';

// Lazy load heavy dialogs - not needed on initial render
const TelegramOnboarding = lazy(() => import('./onboarding/TelegramOnboarding').then(m => ({ default: m.TelegramOnboarding })));
const SubscriptionRequiredDialog = lazy(() => import('./dialogs/SubscriptionRequiredDialog').then(m => ({ default: m.SubscriptionRequiredDialog })));
const GamificationOnboarding = lazy(() => import('./gamification/GamificationOnboarding').then(m => ({ default: m.GamificationOnboarding })));

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

export const MainLayout = () => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { isGuestMode } = useGuestMode();
  const location = useLocation();
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [gamificationOnboardingOpen, setGamificationOnboardingOpen] = useState(false);
  
  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    }
    return false;
  });
  
  // Track play counts when tracks are played
  usePlaybackTracking();
  
  // Show daily admin stats notification (only for admins)
  useAdminDailyStats();
  
  // Memoize pathname to prevent unnecessary re-renders
  const pathname = useMemo(() => location.pathname, [location.pathname]);
  
  // Pages that have their own bottom navigation/tabs - don't show global BottomNavigation
  const hasOwnBottomNav = useMemo(() => {
    return pathname.startsWith('/studio') || 
           pathname.startsWith('/stem-studio') ||
           pathname.startsWith('/project/') && pathname.includes('/studio');
  }, [pathname]);
  
  // Show Telegram Settings Button on all pages except /settings
  const showSettingsButton = pathname !== '/settings';
  useTelegramSettingsButton({ visible: showSettingsButton });

  // Register subscription dialog callback
  useEffect(() => {
    setSubscriptionDialogCallback(setSubscriptionDialogOpen);
    return () => setSubscriptionDialogCallback(() => {});
  }, []);

  // Check if gamification onboarding should show (after first checkin)
  useEffect(() => {
    const hasSeenGamificationOnboarding = localStorage.getItem('gamification-onboarding-completed');
    const hasCompletedFirstCheckin = localStorage.getItem('first-checkin-completed');
    
    if (hasCompletedFirstCheckin && !hasSeenGamificationOnboarding) {
      // Delay to show after checkin celebration
      const timer = setTimeout(() => {
        setGamificationOnboardingOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleGamificationOnboardingComplete = () => {
    localStorage.setItem('gamification-onboarding-completed', 'true');
    setGamificationOnboardingOpen(false);
  };
  
  const handleSidebarCollapsedChange = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, []);

  // Calculate sidebar width based on collapsed state
  const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-64';
  const mainMargin = sidebarCollapsed ? 'ml-16' : 'ml-64';

  return (
    <SmartAlertProvider>
    <div className="flex flex-col h-screen bg-background">
      <div className="flex flex-1 overflow-hidden">
      {/* Skip to content for keyboard navigation */}
      <SkipToContent />
      
      {/* Guest mode banner - subtle and compact */}
      {isGuestMode && <GuestModeBanner />}
      
      {/* Telegram-native Onboarding */}
      <OnboardingTrigger />
      <Suspense fallback={null}>
        <TelegramOnboarding />
      </Suspense>
      
      {/* Subscription Required Dialog - lazy loaded */}
      {subscriptionDialogOpen && (
        <Suspense fallback={null}>
          <SubscriptionRequiredDialog 
            open={subscriptionDialogOpen} 
            onOpenChange={setSubscriptionDialogOpen} 
          />
        </Suspense>
      )}
      
      {/* Gamification Onboarding - lazy loaded */}
      {gamificationOnboardingOpen && (
        <Suspense fallback={null}>
          <GamificationOnboarding
            open={gamificationOnboardingOpen}
            onComplete={handleGamificationOnboardingComplete}
          />
        </Suspense>
      )}
      
      {isDesktop && (
        <div className={cn("fixed inset-y-0 z-50 transition-all duration-300", sidebarWidth)}>
          <Sidebar 
            collapsed={sidebarCollapsed} 
            onCollapsedChange={handleSidebarCollapsedChange} 
          />
        </div>
      )}
      <main
        id="main-content"
        className={cn(
          'flex-1 flex flex-col overflow-y-auto relative transition-all duration-300',
          isDesktop ? mainMargin : 'pb-[calc(4rem+env(safe-area-inset-bottom,0px))]',
          isGuestMode && 'pt-9'
          // Note: Safe area padding is handled by individual page headers (HomeHeader, AppHeader)
          // to avoid double padding and allow proper sticky header behavior
        )}
      >
        <div className={cn(
          'flex-1',
          isDesktop 
            ? 'p-6' 
            : 'px-4 py-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]'
        )}>
          <Outlet />
          <BetaFooter />
        </div>
        <ResizablePlayer />
      </main>
      {!isDesktop && !hasOwnBottomNav && <BottomNavigation />}
    </div>
    </div>
    </SmartAlertProvider>
  );
};
