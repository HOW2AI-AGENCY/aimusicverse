import { useState, useEffect, useMemo, lazy, Suspense, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { Sidebar } from './Sidebar';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ResizablePlayer } from './ResizablePlayer';
import { usePlaybackTracking } from '@/hooks/usePlaybackTracking';
import { SkipToContent } from './ui/skip-to-content';
import { GuestModeBanner } from './GuestModeBanner';
import { ScreenshotNavigator } from './screenshot/ScreenshotNavigator';
import { ScreenshotModeBanner } from './screenshot/ScreenshotModeBanner';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { cn } from '@/lib/utils';
import { setSubscriptionDialogCallback } from '@/hooks/useTrackActions';
import { useTelegramSettingsButton } from '@/hooks/telegram';
import { SmartAlertProvider } from './notifications/smart-alerts';
import { useUserJourneyState } from '@/hooks/useUserJourneyState';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useGenerationResult } from '@/hooks/generation';
import { useWelcomeBonusCheck } from '@/hooks/useCreditsLimits';

import { useAdminDailyStats } from '@/hooks/useAdminDailyStats';

// Lazy load heavy dialogs - not needed on initial render
const TelegramOnboarding = lazy(() => import('./onboarding/TelegramOnboarding').then(m => ({ default: m.TelegramOnboarding })));
const QuickStartOverlay = lazy(() => import('./onboarding/QuickStartOverlay').then(m => ({ default: m.QuickStartOverlay })));
const SubscriptionRequiredDialog = lazy(() => import('./dialogs/SubscriptionRequiredDialog').then(m => ({ default: m.SubscriptionRequiredDialog })));
const GamificationOnboarding = lazy(() => import('./gamification/GamificationOnboarding').then(m => ({ default: m.GamificationOnboarding })));
const GenerateSheet = lazy(() => import('./GenerateSheet').then(m => ({ default: m.GenerateSheet })));
const GenerationResultSheet = lazy(() => import('./generate-form/GenerationResultSheet').then(m => ({ default: m.GenerationResultSheet })));
const WelcomeBonusPopup = lazy(() => import('./popups/WelcomeBonusPopup').then(m => ({ default: m.WelcomeBonusPopup })));

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

export const MainLayout = () => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { isGuestMode } = useGuestMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [gamificationOnboardingOpen, setGamificationOnboardingOpen] = useState(false);
  const [quickStartOpen, setQuickStartOpen] = useState(false);
  const [generateSheetOpen, setGenerateSheetOpen] = useState(false);
  const [welcomeBonusOpen, setWelcomeBonusOpen] = useState(false);
  
  // Welcome bonus check
  const { shouldShowWelcomeBonus, markWelcomeBonusShown } = useWelcomeBonusCheck();

  // Generation result sheet for post-generation A/B selection
  const { 
    resultOpen, 
    resultTrackId, 
    resultTrackTitle, 
    setResultOpen 
  } = useGenerationResult();

  // User journey tracking
  const { shouldShowQuickStart, isNewUser, completedOnboarding } = useUserJourneyState();
  const { isActive: isOldOnboardingActive, completeOnboarding: completeOldOnboarding } = useOnboarding();
  
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

  // Show Quick Start for new users (replacing old onboarding)
  useEffect(() => {
    if (shouldShowQuickStart && !isOldOnboardingActive) {
      const timer = setTimeout(() => {
        setQuickStartOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [shouldShowQuickStart, isOldOnboardingActive]);

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

  // Show welcome bonus popup for new users
  useEffect(() => {
    if (shouldShowWelcomeBonus && !welcomeBonusOpen) {
      const timer = setTimeout(() => {
        setWelcomeBonusOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldShowWelcomeBonus, welcomeBonusOpen]);

  const handleWelcomeBonusClose = useCallback(() => {
    setWelcomeBonusOpen(false);
    markWelcomeBonusShown();
  }, [markWelcomeBonusShown]);

  const handleGamificationOnboardingComplete = () => {
    localStorage.setItem('gamification-onboarding-completed', 'true');
    setGamificationOnboardingOpen(false);
  };

  // Quick Start handlers
  const handleQuickStartClose = useCallback(() => {
    setQuickStartOpen(false);
    // Also complete old onboarding if it was pending
    completeOldOnboarding();
  }, [completeOldOnboarding]);

  const handleStartGeneration = useCallback(() => {
    setQuickStartOpen(false);
    setGenerateSheetOpen(true);
    completeOldOnboarding();
  }, [completeOldOnboarding]);

  const handleStartListening = useCallback(() => {
    setQuickStartOpen(false);
    completeOldOnboarding();
    // Scroll to popular tracks on homepage
    navigate('/');
  }, [navigate, completeOldOnboarding]);

  const handleStartTour = useCallback(() => {
    setQuickStartOpen(false);
    // Trigger old onboarding for full tour
  }, []);
  
  const handleSidebarCollapsedChange = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, []);

  // Calculate sidebar width based on collapsed state
  const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-64';
  const mainMargin = sidebarCollapsed ? 'ml-16' : 'ml-64';

  return (
    <SmartAlertProvider>
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <div className="flex flex-1 min-h-0">
      {/* Skip to content for keyboard navigation */}
      <SkipToContent />
      
      {/* Guest mode banner - subtle and compact */}
      {isGuestMode && <GuestModeBanner />}
      
      {/* Screenshot mode components */}
      <ScreenshotModeBanner />
      <ScreenshotNavigator />
      
      {/* Quick Start Overlay for new users */}
      {quickStartOpen && (
        <Suspense fallback={null}>
          <QuickStartOverlay
            isOpen={quickStartOpen}
            onClose={handleQuickStartClose}
            onStartGeneration={handleStartGeneration}
            onStartListening={handleStartListening}
            onStartTour={handleStartTour}
          />
        </Suspense>
      )}

      {/* Legacy Telegram Onboarding - for full tour */}
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

      {/* Welcome Bonus Popup - for new users */}
      {welcomeBonusOpen && (
        <Suspense fallback={null}>
          <WelcomeBonusPopup
            open={welcomeBonusOpen}
            onClose={handleWelcomeBonusClose}
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
          isDesktop 
            ? mainMargin 
            : 'pb-[calc(max(var(--tg-content-safe-area-inset-bottom,60px),var(--tg-safe-area-inset-bottom,34px),env(safe-area-inset-bottom,34px))+4rem)]',
          isGuestMode && 'pt-9'
          // ВАЖНО: Safe area padding обрабатывается ТОЛЬКО в page headers (HomeHeader, AppHeader)
          // НЕ добавлять paddingTop здесь - это вызывает двойной отступ!
        )}
        style={{
          minHeight: 'var(--tg-viewport-stable-height, 100vh)',
          // НЕ добавляем paddingTop - это делают sticky headers на каждой странице
        }}
      >
        <div 
          className={cn(
            'flex-1',
            isDesktop 
              ? 'p-6' 
              : 'px-4 py-3'
          )}
          style={!isDesktop ? {
            // Enhanced horizontal safe area handling for notched/curved edge devices
            paddingLeft: 'max(1rem, var(--tg-safe-area-inset-left, 0px), env(safe-area-inset-left, 0px))',
            paddingRight: 'max(1rem, var(--tg-safe-area-inset-right, 0px), env(safe-area-inset-right, 0px))',
          } : undefined}
        >
          <Outlet />
          
        </div>
        <ResizablePlayer />
      </main>
      {!isDesktop && !hasOwnBottomNav && <BottomNavigation />}
      
      {/* Generate Sheet - triggered from Quick Start */}
      {generateSheetOpen && (
        <Suspense fallback={null}>
          <GenerateSheet open={generateSheetOpen} onOpenChange={setGenerateSheetOpen} />
        </Suspense>
      )}
      
      {/* Generation Result Sheet - shows A/B versions after track creation */}
      {resultOpen && resultTrackId && (
        <Suspense fallback={null}>
          <GenerationResultSheet 
            open={resultOpen} 
            onOpenChange={setResultOpen}
            trackId={resultTrackId}
            trackTitle={resultTrackTitle || undefined}
          />
        </Suspense>
      )}
    </div>
    </div>
    </SmartAlertProvider>
  );
};
