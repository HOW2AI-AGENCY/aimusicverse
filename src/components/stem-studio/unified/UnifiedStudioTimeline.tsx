/**
 * UnifiedStudioTimeline
 * 
 * Combined timeline showing sections and stems together.
 * - Section markers at top (clickable for replacement)
 * - Stem tracks below (clickable for stem focus)
 * - Shared playhead crossing all layers
 * - Section highlighting on stem tracks
 */

import { memo, useMemo, useRef } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { DetectedSection } from '@/hooks/useSectionDetection';
import { TrackStem } from '@/hooks/useTrackStems';
import { SectionMarkersRow } from './SectionMarkersRow';
import { StemTrackRow } from './StemTrackRow';
import { Slider } from '@/components/ui/slider';

interface StemState {
  muted: boolean;
  solo: boolean;
  volume: number;
}

interface UnifiedStudioTimelineProps {
  // Sections
  sections: DetectedSection[];
  selectedSectionIndex: number | null;
  replacedRanges?: { start: number; end: number }[];
  onSectionClick: (section: DetectedSection, index: number) => void;
  
  // Stems
  stems: TrackStem[];
  stemStates: Record<string, StemState>;
  focusedStemId: string | null;
  onStemToggle: (stemId: string, type: 'mute' | 'solo') => void;
  onStemClick: (stem: TrackStem) => void;
  
  // Focused section (for highlighting on stems)
  focusedSection?: DetectedSection | null;
  
  // Playback
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  
  // Config
  showSections?: boolean;
  showStems?: boolean;
  showPlayhead?: boolean;
  className?: string;
}

export const UnifiedStudioTimeline = memo(({
  sections,
  selectedSectionIndex,
  replacedRanges = [],
  onSectionClick,
  stems,
  stemStates,
  focusedStemId,
  onStemToggle,
  onStemClick,
  focusedSection,
  duration,
  currentTime,
  isPlaying,
  onSeek,
  showSections = true,
  showStems = true,
  showPlayhead = true,
  className,
}: UnifiedStudioTimelineProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasSolo = useMemo(() => Object.values(stemStates).some(s => s.solo), [stemStates]);

  // Calculate focused section bounds for overlay
  const focusedSectionBounds = useMemo(() => {
    if (!focusedSection || duration <= 0) return null;
    return {
      left: (focusedSection.startTime / duration) * 100,
      width: ((focusedSection.endTime - focusedSection.startTime) / duration) * 100,
    };
  }, [focusedSection, duration]);

  return (
    <div ref={containerRef} className={cn("space-y-2 relative", className)}>
      {/* Section Markers Row */}
      {showSections && sections.length > 0 && (
        <div className="relative">
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground font-medium uppercase tracking-wider rotate-[-90deg] origin-center whitespace-nowrap">
            Секции
          </div>
          <div className="ml-4 relative">
            <SectionMarkersRow
              sections={sections}
              duration={duration}
              currentTime={currentTime}
              selectedIndex={selectedSectionIndex}
              replacedRanges={replacedRanges}
              onSectionClick={onSectionClick}
            />
            
            {/* Playhead line on sections */}
            {showPlayhead && duration > 0 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
                style={{ 
                  left: `${progress}%`,
                  boxShadow: '0 0 6px hsl(var(--primary) / 0.4)',
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Divider */}
      {showSections && showStems && sections.length > 0 && stems.length > 0 && (
        <div className="h-px bg-border/30 mx-4" />
      )}

      {/* Stem Tracks */}
      {showStems && stems.length > 0 && (
        <div className="relative">
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground font-medium uppercase tracking-wider rotate-[-90deg] origin-center whitespace-nowrap">
            Стемы
          </div>
          <div className="ml-4 space-y-0.5 relative">
            {/* Focused section overlay on stems */}
            {focusedSectionBounds && (
              <motion.div
                className="absolute top-0 bottom-0 bg-primary/10 border-x border-primary/30 z-10 pointer-events-none"
                style={{
                  left: `calc(100px + ${focusedSectionBounds.left}%)`,
                  width: `calc(${focusedSectionBounds.width}% - 100px)`,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
            
            {stems.map((stem) => (
              <StemTrackRow
                key={stem.id}
                stem={stem}
                state={stemStates[stem.id] || { muted: false, solo: false, volume: 0.85 }}
                hasSolo={hasSolo}
                duration={duration}
                currentTime={currentTime}
                isPlaying={isPlaying}
                isFocused={focusedStemId === stem.id}
                onToggle={(type) => onStemToggle(stem.id, type)}
                onSeek={onSeek}
                onClick={() => onStemClick(stem)}
              />
            ))}
            
            {/* Playhead line on stems */}
            {showPlayhead && duration > 0 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
                style={{ 
                  left: `calc(100px + ${progress}%)`,
                  boxShadow: '0 0 6px hsl(var(--primary) / 0.4)',
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="ml-4 pt-2">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground font-mono tabular-nums w-10">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={(v) => onSeek(v[0])}
            className="flex-1"
          />
          <span className="text-[10px] text-muted-foreground font-mono tabular-nums w-10 text-right">
            {formatTime(duration)}
          </span>
        </div>
        
        {/* Playhead position indicator */}
        <motion.div
          className="h-0.5 bg-primary/30 rounded-full mt-1 ml-10 mr-10"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
});

UnifiedStudioTimeline.displayName = 'UnifiedStudioTimeline';
