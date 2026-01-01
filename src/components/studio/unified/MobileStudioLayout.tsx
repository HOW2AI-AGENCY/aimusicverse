/**
 * MobileStudioLayout - Full mobile studio experience with bottom tabs
 * Integrates all mobile studio components in a tab-based interface
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { MobileStudioTabs, MobileStudioTab } from './MobileStudioTabs';
import { MobilePlayerContent } from './MobilePlayerContent';
import { MobileTracksContent } from './MobileTracksContent';
import { MobileSectionsContent } from './MobileSectionsContent';
import { MobileMixerContent } from './MobileMixerContent';
import { MobileActionsContent } from './MobileActionsContent';
import { useUnifiedStudioStore, StudioTrack } from '@/stores/useUnifiedStudioStore';
import { cn } from '@/lib/utils';

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

  if (!project) return null;

  const renderTabContent = () => {
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
  };

  // Telegram safe area top
  const safeAreaTop = 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px)), env(safe-area-inset-top, 0px))';

  return (
    <div 
      className={cn("flex flex-col h-full bg-background", className)}
      style={{ paddingTop: `calc(${safeAreaTop} + 0.5rem)` }}
    >
      {/* Tab Content Area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {renderTabContent()}
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
