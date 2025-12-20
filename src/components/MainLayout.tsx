import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
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

// Lazy load heavy dialogs - not needed on initial render
const OnboardingOverlay = lazy(() => import('./onboarding/OnboardingOverlay').then(m => ({ default: m.OnboardingOverlay })));
const SubscriptionRequiredDialog = lazy(() => import('./dialogs/SubscriptionRequiredDialog').then(m => ({ default: m.SubscriptionRequiredDialog })));
const GamificationOnboarding = lazy(() => import('./gamification/GamificationOnboarding').then(m => ({ default: m.GamificationOnboarding })));

export const MainLayout = () => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { isGuestMode } = useGuestMode();
  const location = useLocation();
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [gamificationOnboardingOpen, setGamificationOnboardingOpen] = useState(false);
  
  // Track play counts when tracks are played
  usePlaybackTracking();
  
  // Memoize pathname to prevent unnecessary re-renders
  const pathname = useMemo(() => location.pathname, [location.pathname]);
  
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

  return (
    <div className="flex h-screen bg-background">
      {/* Skip to content for keyboard navigation */}
      <SkipToContent />
      
      {/* Guest mode banner - subtle and compact */}
      {isGuestMode && <GuestModeBanner />}
      
      {/* Onboarding system */}
      <OnboardingTrigger />
      <Suspense fallback={null}>
        <OnboardingOverlay />
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
        <div className="w-64 fixed inset-y-0 z-50">
          <Sidebar />
        </div>
      )}
      <main
        id="main-content"
        className={cn(
          'flex-1 flex flex-col overflow-y-auto relative',
          isDesktop ? 'ml-64' : 'pb-[calc(4rem+env(safe-area-inset-bottom,0px))]',
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
        </div>
        <ResizablePlayer />
      </main>
      {!isDesktop && <BottomNavigation />}
    </div>
  );
};
