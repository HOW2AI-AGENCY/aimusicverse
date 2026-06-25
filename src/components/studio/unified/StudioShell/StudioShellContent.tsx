/**
 * StudioShellContent Component
 *
 * Main content area of the studio with timeline, lyrics, and track list.
 *
 * @feature Spec 001 - Phase 3: Component Maintainability
 * @priority P1 - Split StudioShell (1852 lines → 6 components)
 */

import * as React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { StudioWaveformTimeline } from '../StudioWaveformTimeline';
import { StudioLyricsPanelCompact } from '@/components/stem-studio/StudioLyricsPanelCompact';
import { SortableTrackList } from '../SortableTrackList';
import { MobileAudioWarning } from '@/components/studio/MobileAudioWarning';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import type { DetectedSection, ReplacedRange } from '@/types/sections';

export interface StudioShellContentProps {
  // Timeline data
  audioUrl: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;

  // Sections
  sections: DetectedSection[];
  selectedSectionIndex: number | null;
  replacedRanges: ReplacedRange[];
  onSectionClick: (section: DetectedSection, index: number) => void;

  // Lyrics
  sourceTrack: {
    suno_task_id?: string;
    suno_id?: string;
    lyrics?: string;
  } | null;

  // Tracks
  tracks: any[];
  hasSoloTracks: boolean;
  sourceTrackId: string | null;
  stemsExist: boolean;

  // Track callbacks
  onReorder: (oldIndex: number, newIndex: number) => void;
  onToggleMute: (trackId: string) => void;
  onToggleSolo: (trackId: string) => void;
  onVolumeChange: (trackId: string, volume: number) => void;
  onRemove: (trackId: string) => void;
  onVersionChange: (trackId: string, versionLabel: string) => void;
  onTrackAction: (trackId: string, action: string) => void;

  // Mobile audio warning
  showFallbackWarning: boolean;
  activeStemsCount: number;
  limitedStems: any[];
  onDismissWarning: () => void;

  // Add track dialog
  onShowAddTrackDialog: () => void;

  // Layout
  isMobile: boolean;
  className?: string;
}


export const StudioShellContent = React.forwardRef<
  HTMLDivElement,
  StudioShellContentProps
>(({
  audioUrl,
  duration,
  currentTime,
  isPlaying,
  onSeek,
  sections,
  selectedSectionIndex,
  replacedRanges,
  onSectionClick,
  sourceTrack,
  tracks,
  hasSoloTracks,
  sourceTrackId,
  stemsExist,
  onReorder,
  onToggleMute,
  onToggleSolo,
  onVolumeChange,
  onRemove,
  onVersionChange,
  onTrackAction,
  showFallbackWarning,
  activeStemsCount,
  limitedStems,
  onDismissWarning,
  onShowAddTrackDialog,
  isMobile,
  className,
}, ref) => {
  return (
    <div ref={ref} className={cn('flex flex-col flex-1 overflow-hidden', className)}>
      {/* Main Timeline with Sections */}
      <div className={cn(
        "px-3 py-2 border-b border-border/30 bg-card/30",
        isMobile && "sticky top-12 z-30"
      )}>
        <StudioWaveformTimeline
          audioUrl={audioUrl}
          duration={duration}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onSeek={onSeek}
          height={isMobile ? 60 : 80}
          sections={sections}
          selectedSectionIndex={selectedSectionIndex}
          replacedRanges={replacedRanges}
          onSectionClick={onSectionClick}
        />
      </div>

      {/* Synchronized Lyrics Panel (collapsible) */}
      {sourceTrack && (
        <StudioLyricsPanelCompact
          taskId={sourceTrack.suno_task_id}
          audioId={sourceTrack.suno_id}
          plainLyrics={sourceTrack.lyrics}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onSeek={onSeek}
        />
      )}

      {/* Mobile Audio Fallback Warning */}
      <MobileAudioWarning
        show={showFallbackWarning}
        activeCount={activeStemsCount}
        limitedStems={limitedStems}
        onDismiss={onDismissWarning}
      />

      {/* Unified Tracks List - always visible, no tabs */}
      <ScrollArea className="flex-1">
        <div className={cn(
          "p-3 space-y-2",
          isMobile && "pb-4"
        )}>
          <SortableTrackList
            tracks={tracks}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            hasSoloTracks={hasSoloTracks}
            sourceTrackId={sourceTrackId}
            stemsExist={stemsExist}
            onReorder={onReorder}
            onToggleMute={onToggleMute}
            onToggleSolo={onToggleSolo}
            onVolumeChange={onVolumeChange}
            onSeek={onSeek}
            onRemove={onRemove}
            onVersionChange={onVersionChange}
            onAction={onTrackAction}
          />

          {tracks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Нет дорожек в проекте
              </p>
              <Button onClick={onShowAddTrackDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить дорожку
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
});

StudioShellContent.displayName = 'StudioShellContent';
