/**
 * StudioTimeline Component
 *
 * Timeline with sections for the unified studio.
 * Extracted from UnifiedStudioContent for better maintainability.
 *
 * @feature Spec 001 - Phase 3: Component Maintainability
 * @priority P1 - Split UnifiedStudioContent (1477 lines → 5 components)
 */

import * as React from 'react';
import { UnifiedWaveformTimeline } from '@/components/stem-studio/UnifiedWaveformTimeline';
import { VersionTimeline } from '@/components/stem-studio/VersionTimeline';
import { ReplacementProgressIndicator } from '@/components/stem-studio/ReplacementProgressIndicator';
import { StudioLyricsPanel } from '@/components/stem-studio/StudioLyricsPanel';
import { cn } from '@/lib/utils';
import type { DetectedSection, ReplacedRange } from '@/types/section';

export interface StudioTimelineProps {
  // Audio
  audioUrl: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;

  // Timeline interaction
  onSeek: (time: number) => void;

  // Sections
  sections: DetectedSection[];
  selectedSectionIndex: number | null;
  replacedRanges: ReplacedRange[];
  onSectionClick: (section: DetectedSection, index: number) => void;

  // Lyrics
  taskId?: string | null;
  audioId?: string | null;
  plainLyrics?: string | null;

  // Variant comparison
  showVariantComparison: boolean;
  onVariantSelect?: (variantLabel: string) => void;

  // Layout
  isMobile: boolean;
  className?: string;
}

export const StudioTimeline = React.forwardRef<
  HTMLDivElement,
  StudioTimelineProps
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
  taskId,
  audioId,
  plainLyrics,
  showVariantComparison,
  onVariantSelect,
  isMobile,
  className,
}, ref) => {
  return (
    <div ref={ref} className={cn("space-y-4", className)}>
      {/* Unified Waveform Timeline */}
      <div className="px-4">
        <UnifiedWaveformTimeline
          audioUrl={audioUrl}
          duration={duration}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onSeek={onSeek}
          sections={sections}
          selectedSectionIndex={selectedSectionIndex}
          replacedRanges={replacedRanges}
          onSectionClick={onSectionClick}
          height={isMobile ? 80 : 120}
        />
      </div>

      {/* Replacement Progress Indicator */}
      {replacedRanges.length > 0 && (
        <div className="px-4">
          <ReplacementProgressIndicator
            replacedRanges={replacedRanges}
            sections={sections}
          />
        </div>
      )}

      {/* Variant Comparison Timeline */}
      {showVariantComparison && (
        <div className="px-4">
          <VersionTimeline
            trackId={audioId || ''}
            onVariantSelect={onVariantSelect}
          />
        </div>
      )}

      {/* Lyrics Panel */}
      {(taskId || audioId) && (
        <div className="px-4">
          <StudioLyricsPanel
            taskId={taskId || null}
            audioId={audioId || null}
            plainLyrics={plainLyrics || null}
            currentTime={currentTime}
            isPlaying={isPlaying}
            onSeek={onSeek}
          />
        </div>
      )}
    </div>
  );
});

StudioTimeline.displayName = 'StudioTimeline';
