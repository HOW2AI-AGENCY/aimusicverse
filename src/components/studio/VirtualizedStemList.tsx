/**
 * VirtualizedStemList - Efficiently renders large lists of stems
 * 
 * Uses react-virtuoso for windowed rendering when stems > threshold
 * Falls back to regular rendering for smaller lists
 */

import { memo, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { motion } from '@/lib/motion';
import { TrackStem } from '@/hooks/useTrackStems';
import { StemTranscription } from '@/hooks/useStemTranscription';

// Virtualization threshold - only use for larger lists
const VIRTUALIZATION_THRESHOLD = 6;

// Estimated row heights for virtualization
const MOBILE_ROW_HEIGHT = 140; // Including waveform, controls, notes
const DESKTOP_ROW_HEIGHT = 44;

export interface StemState {
  muted: boolean;
  solo: boolean;
  volume: number;
}

export interface StemRowProps {
  stem: TrackStem;
  state: StemState;
  transcription?: StemTranscription | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onToggle: (type: 'mute' | 'solo') => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  onAction: (action: 'midi' | 'reference' | 'download' | 'effects' | 'view-notes' | 'delete') => void;
}

export interface VirtualizedStemListProps {
  stems: TrackStem[];
  stemStates: Record<string, StemState>;
  transcriptionsByStem?: Record<string, StemTranscription>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isMobile: boolean;
  onStemToggle: (stemId: string, type: 'mute' | 'solo') => void;
  onStemVolumeChange: (stemId: string, volume: number) => void;
  onSeek: (time: number) => void;
  onStemAction: (stem: TrackStem, action: 'midi' | 'reference' | 'download' | 'effects' | 'view-notes' | 'delete') => void;
  renderMobileRow: (props: StemRowProps) => React.ReactNode;
  renderDesktopRow: (props: StemRowProps) => React.ReactNode;
  className?: string;
}

function VirtualizedStemListComponent({
  stems,
  stemStates,
  transcriptionsByStem,
  isPlaying,
  currentTime,
  duration,
  isMobile,
  onStemToggle,
  onStemVolumeChange,
  onSeek,
  onStemAction,
  renderMobileRow,
  renderDesktopRow,
  className,
}: VirtualizedStemListProps) {
  const shouldVirtualize = stems.length > VIRTUALIZATION_THRESHOLD;
  const rowHeight = isMobile ? MOBILE_ROW_HEIGHT : DESKTOP_ROW_HEIGHT;

  // Item renderer for virtuoso
  const itemContent = useCallback(
    (index: number) => {
      const stem = stems[index];
      const state = stemStates[stem.id] || { muted: false, solo: false, volume: 0.85 };
      const transcription = transcriptionsByStem?.[stem.id];

      const props = {
        stem,
        state,
        transcription,
        isPlaying,
        currentTime,
        duration,
        onToggle: (type: 'mute' | 'solo') => onStemToggle(stem.id, type),
        onVolumeChange: (vol: number) => onStemVolumeChange(stem.id, vol),
        onSeek,
        onAction: (action: 'midi' | 'reference' | 'download' | 'effects' | 'view-notes' | 'delete') =>
          onStemAction(stem, action),
      };

      return (
        <div style={{ paddingBottom: isMobile ? 8 : 0 }}>
          {isMobile ? renderMobileRow(props) : renderDesktopRow(props)}
        </div>
      );
    },
    [
      stems,
      stemStates,
      transcriptionsByStem,
      isPlaying,
      currentTime,
      duration,
      isMobile,
      onStemToggle,
      onStemVolumeChange,
      onSeek,
      onStemAction,
      renderMobileRow,
      renderDesktopRow,
    ]
  );

  // Non-virtualized rendering for small lists
  if (!shouldVirtualize) {
    return (
      <div className={className}>
        {isMobile ? (
          <div className="p-2 space-y-2">
            {stems.map((stem, index) => {
              const state = stemStates[stem.id] || { muted: false, solo: false, volume: 0.85 };
              const transcription = transcriptionsByStem?.[stem.id];
              
              return (
                <motion.div
                  key={stem.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {renderMobileRow({
                    stem,
                    state,
                    transcription,
                    isPlaying,
                    currentTime,
                    duration,
                    onToggle: (type) => onStemToggle(stem.id, type),
                    onVolumeChange: (vol) => onStemVolumeChange(stem.id, vol),
                    onSeek,
                    onAction: (action) => onStemAction(stem, action),
                  })}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card/20">
            {stems.map((stem, index) => {
              const state = stemStates[stem.id] || { muted: false, solo: false, volume: 0.85 };
              const transcription = transcriptionsByStem?.[stem.id];
              
              return (
                <motion.div
                  key={stem.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                >
                  {renderDesktopRow({
                    stem,
                    state,
                    transcription,
                    isPlaying,
                    currentTime,
                    duration,
                    onToggle: (type) => onStemToggle(stem.id, type),
                    onVolumeChange: (vol) => onStemVolumeChange(stem.id, vol),
                    onSeek,
                    onAction: (action) => onStemAction(stem, action),
                  })}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Virtualized rendering for large lists
  return (
    <Virtuoso
      className={className}
      style={{ height: Math.min(stems.length * rowHeight, isMobile ? 400 : 300) }}
      totalCount={stems.length}
      itemContent={itemContent}
      defaultItemHeight={rowHeight}
      overscan={2}
    />
  );
}

export const VirtualizedStemList = memo(VirtualizedStemListComponent);
