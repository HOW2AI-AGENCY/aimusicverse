import { Outlet } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { Sidebar } from './Sidebar';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ResizablePlayer } from './ResizablePlayer';
import { EnhancedGenerationIndicator } from './notifications';
import { OnboardingOverlay } from './onboarding/OnboardingOverlay';
import { OnboardingTrigger } from './onboarding/OnboardingTrigger';
import { usePlaybackTracking } from '@/hooks/usePlaybackTracking';
import { SkipToContent } from './ui/skip-to-content';
import { GuestModeBanner } from './GuestModeBanner';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { cn } from '@/lib/utils';

export const MainLayout = () => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { isGuestMode } = useGuestMode();
  
  // Track play counts when tracks are played
  usePlaybackTracking();

  return (
    <div className="flex h-screen bg-background">
      {/* Skip to content for keyboard navigation */}
      <SkipToContent />
      
      {/* Guest mode banner - subtle and compact */}
      {isGuestMode && <GuestModeBanner />}
      
      {/* Onboarding system */}
      <OnboardingTrigger />
      <OnboardingOverlay />
      
      {/* Enhanced Generation Indicator with progress */}
      <EnhancedGenerationIndicator />
      
      {isDesktop && (
        <div className="w-64 fixed inset-y-0 z-50">
          <Sidebar />
        </div>
      )}
      <main
        id="main-content"
        className={cn(
          'flex-1 flex flex-col overflow-y-auto',
          isDesktop ? 'ml-64' : 'pb-[calc(4rem+env(safe-area-inset-bottom,0px))]',
          isGuestMode && 'pt-9'
        )}
      >
        <div className={cn('flex-1', isDesktop ? 'p-6' : 'p-3')}>
          <Outlet />
        </div>
        <ResizablePlayer />
      </main>
      {!isDesktop && <BottomNavigation />}
    </div>
  );
};
