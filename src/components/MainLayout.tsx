import { Outlet } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { Sidebar } from './Sidebar';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ResizablePlayer } from './ResizablePlayer';
import { GlobalGenerationIndicator } from './GlobalGenerationIndicator';
import { OnboardingOverlay } from './onboarding/OnboardingOverlay';
import { OnboardingTrigger } from './onboarding/OnboardingTrigger';
import { cn } from '@/lib/utils';

export const MainLayout = () => {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <div className="flex h-screen bg-background">
      {/* Onboarding system */}
      <OnboardingTrigger />
      <OnboardingOverlay />
      
      {/* Global Generation Indicator - shows on all pages */}
      <GlobalGenerationIndicator />
      
      {isDesktop && (
        <div className="w-64 fixed inset-y-0 z-50">
          <Sidebar />
        </div>
      )}
      <main
        className={cn(
          'flex-1 flex flex-col overflow-y-auto',
          isDesktop ? 'ml-64' : 'pb-16'
        )}
      >
        <div className="flex-1 p-4 sm:p-6">
          <Outlet />
        </div>
        <ResizablePlayer />
      </main>
      {!isDesktop && <BottomNavigation />}
    </div>
  );
};
