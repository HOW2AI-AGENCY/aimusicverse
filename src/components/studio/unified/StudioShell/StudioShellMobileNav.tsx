/**
 * StudioShellMobileNav Component
 *
 * Mobile-specific navigation and FAB buttons for the studio.
 * Includes AI Actions FAB and mobile-specific controls.
 *
 * @feature Spec 001 - Phase 3: Component Maintainability
 * @priority P1 - Split StudioShell (1852 lines → 6 components)
 */

import * as React from 'react';
import { AIActionsFAB } from '../AIActionsFAB';
import { MobileStudioPlayerBar } from '../MobileStudioPlayerBar';
import type { StudioTrack } from '@/stores/useUnifiedStudioStore';

export interface StudioShellMobileNavProps {
  // Tracks
  tracks: StudioTrack[];

  // AI Actions
  onGenerate: () => void;
  onExtend: () => void;
  onCover: () => void;
  onAddVocals: () => void;

  // Player
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;

  // Layout
  className?: string;
}

export const StudioShellMobileNav = React.forwardRef<
  HTMLDivElement,
  StudioShellMobileNavProps
>(({
  tracks,
  onGenerate,
  onExtend,
  onCover,
  onAddVocals,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
  onSeekBackward,
  onSeekForward,
  className,
}, ref) => {
  return (
    <div ref={ref} className={className}>
      {/* AI Actions FAB - Mobile only */}
      {tracks.length > 0 && (
        <AIActionsFAB
          onGenerate={onGenerate}
          onExtend={onExtend}
          onCover={onCover}
          onAddVocals={onAddVocals}
        />
      )}

      {/* Mobile Studio Player Bar - Bottom fixed player for mobile */}
      <MobileStudioPlayerBar
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onPlayPause={onPlayPause}
        onSeek={onSeek}
        onSeekBackward={onSeekBackward}
        onSeekForward={onSeekForward}
      />
    </div>
  );
});

StudioShellMobileNav.displayName = 'StudioShellMobileNav';
