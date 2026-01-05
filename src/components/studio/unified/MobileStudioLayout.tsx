/**
 * MobileStudioLayout - Full mobile studio experience with bottom tabs
 * Integrates all mobile studio components in a tab-based interface
 * With smooth animations, swipe navigation, and optimized performance
 * 
 * OPTIMIZATION:
 * - Lazy loading for tab content components
 * - Memoized tab content rendering
 * - Smooth 60 FPS animations with optimized transitions
 * - Swipe navigation with haptic feedback
 */

import { memo, useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { MobileStudioTabs, MobileStudioTab } from './MobileStudioTabs';
import { useUnifiedStudioStore } from '@/stores/useUnifiedStudioStore';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// Lazy load tab components for better code splitting
const MobilePlayerContent = lazy(() => import('./MobilePlayerContent').then(m => ({ default: m.MobilePlayerContent })));
const MobileTracksContent = lazy(() => import('./MobileTracksContent').then(m => ({ default: m.MobileTracksContent })));
const MobileSectionsContent = lazy(() => import('./MobileSectionsContent').then(m => ({ default: m.MobileSectionsContent })));
const MobileMixerContent = lazy(() => import('./MobileMixerContent').then(m => ({ default: m.MobileMixerContent })));
const MobileActionsContent = lazy(() => import('./MobileActionsContent').then(m => ({ default: m.MobileActionsContent })));

// Tab order for swipe navigation
const TAB_ORDER: MobileStudioTab[] = ['player', 'tracks', 'sections', 'mixer', 'actions'];

interface MobileStudioLayoutProps {
  className?: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onPlayPause: () => void;
  onTrackAction: (trackId: string, action: string) => void;
  onAddTrack: () => void;
  onSave: () => void;
  onExport: () => void;
  onOpenDownloadPanel?: () => void;
}

export const MobileStudioLayout = memo(function MobileStudioLayout({
  className,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  onPlayPause,
  onTrackAction,
  onAddTrack,
  onSave,
  onExport,
  onOpenDownloadPanel,
}: MobileStudioLayoutProps) {
  const [activeTab, setActiveTab] = useState<MobileStudioTab>('player');
  
  const {
    project,
    hasUnsavedChanges,
    isSaving,
    toggleTrackMute,
    toggleTrackSolo,
    setTrackVolume,
    removeTrack,
    setMasterVolume,
  } = useUnifiedStudioStore();

  const handleTabChange = useCallback((tab: MobileStudioTab) => {
    setActiveTab(tab);
  }, []);

  // Swipe navigation between tabs
  const { handlers: swipeHandlers } = useSwipeNavigation(
    TAB_ORDER,
    activeTab,
    handleTabChange,
    { threshold: 50, maxTime: 300, hapticFeedback: true }
  );

  // Memoize tab content to prevent unnecessary re-renders
  const tabContent = useMemo(() => {
    if (!project) return null;
    
    switch (activeTab) {
      case 'player':
        return (
          <MobilePlayerContent
            project={project}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            masterVolume={project.masterVolume}
            onPlayPause={onPlayPause}
            onSeek={onSeek}
            onVolumeChange={setMasterVolume}
          />
        );

      case 'tracks':
        return (
          <MobileTracksContent
            project={project}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onToggleMute={toggleTrackMute}
            onToggleSolo={toggleTrackSolo}
            onVolumeChange={setTrackVolume}
            onRemoveTrack={removeTrack}
            onAddTrack={onAddTrack}
            onTrackAction={onTrackAction}
          />
        );

      case 'sections':
        return (
          <MobileSectionsContent
            project={project}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onSeek={onSeek}
            onPlayPause={onPlayPause}
          />
        );

      case 'mixer':
        return (
          <MobileMixerContent
            project={project}
            masterVolume={project.masterVolume}
            onMasterVolumeChange={setMasterVolume}
            onToggleMute={toggleTrackMute}
            onToggleSolo={toggleTrackSolo}
            onVolumeChange={setTrackVolume}
          />
        );

      case 'actions':
        return (
          <MobileActionsContent
            project={project}
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={isSaving}
            onSave={onSave}
            onExport={onExport}
            onDownloadStems={onOpenDownloadPanel}
          />
        );

      default:
        return null;
    }
  }, [
    activeTab, project, isPlaying, currentTime, duration,
    onPlayPause, onSeek, setMasterVolume, toggleTrackMute,
    toggleTrackSolo, setTrackVolume, removeTrack, onAddTrack,
    onTrackAction, hasUnsavedChanges, isSaving, onSave, onExport,
    onOpenDownloadPanel
  ]);

  if (!project) return null;

  // Telegram safe area top
  const safeAreaTop = 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px)), env(safe-area-inset-top, 0px))';

  // Animation variants for smoother 60 FPS transitions
  const contentVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  // Loading fallback for lazy-loaded tabs
  const LoadingFallback = () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  return (
    <div 
      className={cn("flex flex-col h-full bg-background", className)}
      style={{ paddingTop: `calc(${safeAreaTop} + 0.5rem)` }}
    >
      {/* Tab Content Area - with swipe support */}
      <div 
        className="flex-1 overflow-hidden relative"
        {...swipeHandlers}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ 
              duration: 0.15,
              ease: [0.25, 0.1, 0.25, 1]
            }}
            className="h-full absolute inset-0"
          >
            <Suspense fallback={<LoadingFallback />}>
              {tabContent}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <MobileStudioTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        trackCount={project.tracks.length}
      />
    </div>
  );
});
