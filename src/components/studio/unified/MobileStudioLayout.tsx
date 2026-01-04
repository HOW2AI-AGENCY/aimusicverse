/**
 * MobileStudioLayout - Full mobile studio experience with bottom tabs
 * Integrates all mobile studio components in a tab-based interface
 * With smooth animations and optimized performance
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { MobileStudioTabs, MobileStudioTab } from './MobileStudioTabs';
import { MobilePlayerContent } from './MobilePlayerContent';
import { MobileTracksContent } from './MobileTracksContent';
import { MobileSectionsContent } from './MobileSectionsContent';
import { MobileMixerContent } from './MobileMixerContent';
import { MobileActionsContent } from './MobileActionsContent';
import { useUnifiedStudioStore } from '@/stores/useUnifiedStudioStore';
import { cn } from '@/lib/utils';
import { useHaptic } from '@/hooks/useHaptic';

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
            onSeek={onSeek}
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
          />
        );

      default:
        return null;
    }
  }, [
    activeTab, project, isPlaying, currentTime, duration,
    onPlayPause, onSeek, setMasterVolume, toggleTrackMute,
    toggleTrackSolo, setTrackVolume, removeTrack, onAddTrack,
    onTrackAction, hasUnsavedChanges, isSaving, onSave, onExport
  ]);

  if (!project) return null;

  // Telegram safe area top
  const safeAreaTop = 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px)), env(safe-area-inset-top, 0px))';

  // Animation variants for smoother transitions
  const contentVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <div 
      className={cn("flex flex-col h-full bg-background", className)}
      style={{ paddingTop: `calc(${safeAreaTop} + 0.5rem)` }}
    >
      {/* Tab Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ 
              duration: 0.2,
              ease: [0.25, 0.1, 0.25, 1]
            }}
            className="h-full absolute inset-0"
          >
            {tabContent}
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
