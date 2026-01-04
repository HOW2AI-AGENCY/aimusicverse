/**
 * Editor Tab Content for Studio
 * Contains section editor with timeline visualization
 */

import { SectionEditorPanel } from '../SectionEditorPanel';
import { SectionTimelineVisualization } from '../SectionTimelineVisualization';
import { ReplacementHistoryPanel } from '../ReplacementHistoryPanel';
import { ReplacementProgressIndicator } from '../ReplacementProgressIndicator';
import { DetectedSection } from '@/hooks/useSectionDetection';

interface EditorTabContentProps {
  trackId: string;
  trackTitle: string;
  trackTags?: string | null;
  trackAudioUrl: string;
  detectedSections: DetectedSection[];
  duration: number;
  currentTime: number;
  selectedIndex: number | null;
  customRange: { start: number; end: number } | null;
  replacedRanges?: { start: number; end: number }[];
  onSectionClick: (section: DetectedSection, index: number) => void;
  onSeek: (time: number) => void;
  onEditorClose: () => void;
}

export function EditorTabContent({
  trackId,
  trackTitle,
  trackTags,
  trackAudioUrl,
  detectedSections,
  duration,
  currentTime,
  selectedIndex,
  customRange,
  replacedRanges,
  onSectionClick,
  onSeek,
  onEditorClose,
}: EditorTabContentProps) {
  return (
    <div className="space-y-4 p-4">
      {/* Section Timeline Visualization */}
      <div className="bg-card/50 border border-border/30 rounded-lg overflow-hidden">
        <SectionTimelineVisualization
          sections={detectedSections}
          duration={duration}
          currentTime={currentTime}
          selectedIndex={selectedIndex}
          customRange={customRange}
          replacedRanges={replacedRanges}
          onSectionClick={onSectionClick}
          onSeek={onSeek}
        />
      </div>

      {/* Replacement Progress Indicator */}
      <ReplacementProgressIndicator trackId={trackId} />

      {/* Section Editor Panel */}
      <SectionEditorPanel
        trackId={trackId}
        trackTitle={trackTitle}
        trackTags={trackTags}
        audioUrl={trackAudioUrl}
        duration={duration}
        onClose={onEditorClose}
      />

      {/* Replacement History */}
      <ReplacementHistoryPanel
        trackId={trackId}
        trackAudioUrl={trackAudioUrl}
      />
    </div>
  );
}