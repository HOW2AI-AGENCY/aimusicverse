/**
 * InlineStemNotes - Integrated MIDI/Notes visualization for stem
 * 
 * Features:
 * - Compact inline piano roll visualization
 * - Auto-loads existing transcriptions from stem_transcriptions table
 * - Shows mini notes preview with current time sync
 * - Click to expand full notes view
 * - Quick transcription button if no data exists
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { FileMusic, Loader2, Music2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStemTranscription } from '@/hooks/useStemTranscription';
import { UnifiedNotesViewer } from '@/components/studio/UnifiedNotesViewer';
import { TrackStem } from '@/hooks/useTrackStems';

interface InlineStemNotesProps {
  stem: TrackStem;
  trackTitle: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  className?: string;
}

export const InlineStemNotes = memo(function InlineStemNotes({
  stem,
  trackTitle,
  currentTime,
  duration,
  isPlaying,
  className,
}: InlineStemNotesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { latestTranscription, hasTranscription, isLoading } = useStemTranscription(stem.id);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Don't show if no transcription and not loading
  if (!hasTranscription && !isLoading) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn("pt-1.5", className)}>
        <div className="h-8 rounded bg-muted/30 animate-pulse flex items-center justify-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Загрузка нот...</span>
        </div>
      </div>
    );
  }

  if (!latestTranscription) return null;

  return (
    <div className={cn("pt-1.5 space-y-1.5", className)}>
      {/* Collapsed View - Mini preview */}
      {!isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="flex items-center gap-1.5">
            {/* Mini indicator */}
            <div className="flex-1 h-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5">
                <Music2 className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">
                  {latestTranscription.notes_count || 0} нот
                  {latestTranscription.bpm && ` • ${Math.round(latestTranscription.bpm)} BPM`}
                  {latestTranscription.key_detected && ` • ${latestTranscription.key_detected}`}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleExpand}
                className="h-5 w-5 p-0"
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Expanded View - Full notes viewer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {/* Collapse button */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <FileMusic className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium">Ноты и MIDI</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleExpand}
                className="h-5 w-5 p-0"
              >
                <ChevronUp className="w-3 h-3" />
              </Button>
            </div>

            {/* Unified Notes Viewer */}
            <UnifiedNotesViewer
              midiUrl={latestTranscription.midi_url}
              musicXmlUrl={latestTranscription.mxml_url}
              files={{
                midiUrl: latestTranscription.midi_url,
                midiQuantUrl: latestTranscription.midi_quant_url,
                pdfUrl: latestTranscription.pdf_url,
                gp5Url: latestTranscription.gp5_url,
                musicXmlUrl: latestTranscription.mxml_url,
              }}
              bpm={latestTranscription.bpm || undefined}
              timeSignature={latestTranscription.time_signature || undefined}
              keySignature={latestTranscription.key_detected || undefined}
              notesCount={latestTranscription.notes_count || undefined}
              model={latestTranscription.model}
              currentTime={currentTime}
              isPlaying={isPlaying}
              duration={duration}
              trackTitle={trackTitle}
              compact={true}
              height={120}
              enablePlayback={false} // Disable separate playback, sync with main audio
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
