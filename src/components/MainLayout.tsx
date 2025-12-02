
import { Outlet } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { Sidebar } from './Sidebar';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { GenerationProgress } from './GenerationProgress';
import { ResizablePlayer } from './ResizablePlayer';
import { cn } from '@/lib/utils';

export const MainLayout = () => {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <div className="flex h-screen bg-background">
      {isDesktop && (
        <div className="w-64 fixed inset-y-0 z-50">
          <Sidebar />
        </div>
      )}
      <main
        className={cn(
          'flex-1 flex flex-col overflow-y-auto',
          isDesktop ? 'ml-64' : 'pb-16' // Adjust margin for sidebar or padding for bottom nav
        )}
      >
        <GenerationProgress />
        <div className="flex-1 p-4 sm:p-6">
          <Outlet />
        </div>
        <ResizablePlayer />
      </main>
      {!isDesktop && <BottomNavigation />}
    </div>
  );
};
