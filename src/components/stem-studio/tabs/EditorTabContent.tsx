/**
 * Editor Tab Content for Studio
 * Contains section editor with timeline visualization
 */

import { SectionEditorPanel } from '../SectionEditorPanel';
import { SectionTimelineVisualization } from '../SectionTimelineVisualization';
import { ReplacementHistoryPanel } from '../ReplacementHistoryPanel';
import { ReplacementProgressIndicator } from '../ReplacementProgressIndicator';
import { QuickComparePanel } from '../QuickComparePanel';

interface EditorTabContentProps {
  trackId: string;
  trackAudioUrl: string;
  detectedSections: any[];
  replacedSections: any[];
  selectedSectionIndex: number | null;
  customRange: { start: number; end: number } | null;
  editMode: 'replace' | 'trim' | null;
  latestCompletion: any;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSelectSection: (index: number) => void;
  onSetCustomRange: (range: { start: number; end: number } | null) => void;
  onSeek: (time: number[]) => void;
}

export function EditorTabContent({
  trackId,
  trackAudioUrl,
  detectedSections,
  replacedSections,
  selectedSectionIndex,
  customRange,
  editMode,
  latestCompletion,
  isPlaying,
  currentTime,
  duration,
  onSelectSection,
  onSetCustomRange,
  onSeek,
}: EditorTabContentProps) {
  return (
    <div className="space-y-4 p-4">
      {/* Section Timeline Visualization */}
      <div className="bg-card/50 border border-border/30 rounded-lg overflow-hidden">
        <SectionTimelineVisualization
          sections={detectedSections}
          replacedSections={replacedSections}
          selectedSectionIndex={selectedSectionIndex}
          customRange={customRange}
          onSelectSection={onSelectSection}
          onSetCustomRange={onSetCustomRange}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          onSeek={onSeek}
        />
      </div>

      {/* Replacement Progress Indicator */}
      {latestCompletion && (
        <ReplacementProgressIndicator completion={latestCompletion} />
      )}

      {/* Quick Compare Panel */}
      {latestCompletion && (
        <QuickComparePanel
          originalUrl={trackAudioUrl}
          replacedUrl={latestCompletion.replaced_audio_url}
          trackId={trackId}
          replacementId={latestCompletion.id}
        />
      )}

      {/* Section Editor Panel */}
      <SectionEditorPanel
        trackId={trackId}
        selectedSectionIndex={selectedSectionIndex}
        customRange={customRange}
        sections={detectedSections}
        replacedSections={replacedSections}
        editMode={editMode}
      />

      {/* Replacement History */}
      {replacedSections && replacedSections.length > 0 && (
        <ReplacementHistoryPanel
          trackId={trackId}
          replacements={replacedSections}
        />
      )}
    </div>
  );
}
