/**
 * UnifiedStudioLayout - Main layout wrapper for all studio modes
 * Provides consistent structure regardless of stem availability
 */

import { ReactNode } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface UnifiedStudioLayoutProps {
  // Header section
  header: ReactNode;
  
  // Timeline/Waveform section
  timeline: ReactNode;
  
  // Main content area (stems mixer, lyrics, analysis, etc.)
  content: ReactNode;
  
  // Player bar (bottom)
  playerBar: ReactNode;
  
  // Optional floating actions
  floatingActions?: ReactNode;
  
  // Optional overlay (section editor, compare panel)
  overlay?: ReactNode;
  
  // Optional dialogs
  dialogs?: ReactNode;
  
  className?: string;
}

export function UnifiedStudioLayout({
  header,
  timeline,
  content,
  playerBar,
  floatingActions,
  overlay,
  dialogs,
  className,
}: UnifiedStudioLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      "h-screen flex flex-col bg-background overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="shrink-0">
        {header}
      </div>

      {/* Timeline/Waveform Section */}
      <div className="shrink-0 border-b border-border/30">
        {timeline}
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Overlay (Section Editor, Compare Panel) */}
      <AnimatePresence>
        {overlay && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="shrink-0"
          >
            {overlay}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Bar - Fixed at bottom */}
      <div className="shrink-0">
        {playerBar}
      </div>

      {/* Floating Actions (FAB) */}
      {floatingActions && !isMobile && (
        <div className="fixed bottom-24 right-6 z-40">
          {floatingActions}
        </div>
      )}

      {/* Dialogs */}
      {dialogs}
    </div>
  );
}
