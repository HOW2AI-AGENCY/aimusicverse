import { useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useStudioStore, selectActiveTab } from '@/stores/useStudioStore';
import { StudioHeader } from './StudioHeader';
import { StudioTabNavigation } from './StudioTabNavigation';
import { StudioPlayer } from './StudioPlayer';

/**
 * StudioLayout - Responsive layout wrapper for Studio
 * Part of Sprint 015-A: Unified Studio Architecture
 */

interface StudioLayoutProps {
  children: ReactNode;
  headerRightContent?: ReactNode;
  onShowTutorial?: () => void;
  onExport?: () => void;
  onSettings?: () => void;
  showTabs?: boolean;
  showPlayer?: boolean;
  className?: string;
}

export function StudioLayout({
  children,
  headerRightContent,
  onShowTutorial,
  onExport,
  onSettings,
  showTabs = true,
  showPlayer = true,
  className,
}: StudioLayoutProps) {
  const isMobile = useIsMobile();
  const activeTab = useStudioStore(selectActiveTab);
  const setIsMobile = useStudioStore((state) => state.setIsMobile);

  // Sync mobile state
  useEffect(() => {
    setIsMobile(isMobile);
  }, [isMobile, setIsMobile]);

  return (
    <div className={cn(
      "h-screen flex flex-col bg-background overflow-hidden",
      className
    )}>
      {/* Header */}
      <StudioHeader
        onShowTutorial={onShowTutorial}
        onExport={onExport}
        onSettings={onSettings}
        rightContent={headerRightContent}
      />

      {/* Tab Navigation - Desktop at top, Mobile at bottom */}
      {showTabs && !isMobile && (
        <div className="px-4 py-2 border-b border-border/30">
          <StudioTabNavigation variant="default" />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full overflow-y-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sticky Player */}
      {showPlayer && (
        <StudioPlayer variant={isMobile ? 'compact' : 'default'} />
      )}

      {/* Mobile Tab Navigation - Fixed at bottom */}
      {showTabs && isMobile && (
        <div className="border-t border-border/50 bg-background/95 backdrop-blur safe-area-inset-bottom">
          <StudioTabNavigation variant="compact" />
        </div>
      )}
    </div>
  );
}
