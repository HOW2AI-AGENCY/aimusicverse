/**
 * Studio Track Row
 * Individual track lane with waveform, controls, stem-style UI, and MIDI preview
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Volume2, VolumeX, MoreHorizontal, Download, Eye,
  Mic2, Guitar, Drum, Music, Piano, Waves, Sliders,
  Trash2, Sparkles, GripVertical, Scissors, ArrowRight, FileMusic, Music2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { StudioTrack, TrackType } from '@/stores/useUnifiedStudioStore';
import { OptimizedStemWaveform } from '@/components/stem-studio/OptimizedStemWaveform';
import { StudioVersionSelector } from './StudioVersionSelector';
import { StemActionSheet } from './StemActionSheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { StemTranscriptionData } from '@/hooks/studio/useStemTypeTranscriptionStatus';

// Mini MIDI Notes Preview component
interface MidiNotesPreviewProps {
  notes: any[];
  duration: number;
  currentTime: number;
  notesCount: number;
  bpm: number | null;
  keyDetected: string | null;
  onViewFull?: () => void;
  onDownloadMidi?: () => void;
  onDownloadPdf?: () => void;
}

const MidiNotesPreview = memo(function MidiNotesPreview({
  notes,
  duration,
  currentTime,
  notesCount,
  bpm,
  keyDetected,
  onViewFull,
  onDownloadMidi,
  onDownloadPdf,
}: MidiNotesPreviewProps) {
  const { normalizedNotes, playheadPos } = useMemo(() => {
    if (!notes || notes.length === 0 || duration <= 0) {
      return { normalizedNotes: [], playheadPos: 0 };
    }

    const pitches = notes.map((n: any) => n.pitch);
    const min = Math.min(...pitches);
    const max = Math.max(...pitches);
    const range = max - min || 1;

    return {
      normalizedNotes: notes.map((n: any) => ({
        x: (n.startTime / duration) * 100,
        width: ((n.endTime - n.startTime) / duration) * 100,
        y: ((max - n.pitch) / range) * 100,
      })),
      playheadPos: (currentTime / duration) * 100,
    };
  }, [notes, duration, currentTime]);

  // Show info bar even without notes visualization (for PDF/GP5 only cases)
  const hasNotes = normalizedNotes.length > 0;
  const hasAnyFile = !!(onDownloadMidi || onDownloadPdf);

  if (!hasNotes && !hasAnyFile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="pt-1.5 space-y-1.5"
    >
      {/* Mini piano roll - only if we have notes */}
      {hasNotes && (
        <div className="relative h-8 rounded overflow-hidden bg-gradient-to-r from-primary/5 to-primary/10">
          {normalizedNotes.map((note, i) => (
            <div
              key={i}
              className="absolute bg-primary/60 rounded-[1px]"
              style={{
                left: `${note.x}%`,
                width: `${Math.max(note.width, 0.5)}%`,
                top: `${note.y}%`,
                height: '12%',
              }}
            />
          ))}
          {currentTime > 0 && (
            <div 
              className="absolute top-0 bottom-0 w-px bg-primary shadow-glow"
              style={{ left: `${playheadPos}%` }}
            />
          )}
        </div>
      )}

      {/* Info + actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
          <Music2 className="w-3 h-3 text-primary shrink-0" />
          <span className="text-[10px] text-muted-foreground truncate">
            {notesCount > 0 ? (
              <>
                {notesCount} {notesCount === 1 ? 'нота' : notesCount < 5 ? 'ноты' : 'нот'}
                {bpm && ` • ${Math.round(bpm)} BPM`}
                {keyDetected && ` • ${keyDetected}`}
              </>
            ) : (
              <>
                Транскрипция готова
                {bpm && ` • ${Math.round(bpm)} BPM`}
                {keyDetected && ` • ${keyDetected}`}
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onDownloadMidi && (
            <Button variant="ghost" size="sm" onClick={onDownloadMidi} className="h-5 w-5 p-0" title="Скачать MIDI">
              <Download className="w-3 h-3" />
            </Button>
          )}
          {onDownloadPdf && (
            <Button variant="ghost" size="sm" onClick={onDownloadPdf} className="h-5 w-5 p-0" title="Скачать PDF">
              <FileMusic className="w-3 h-3" />
            </Button>
          )}
          {onViewFull && (
            <Button variant="ghost" size="sm" onClick={onViewFull} className="h-5 gap-1 px-1.5 text-[10px]">
              <Eye className="w-3 h-3" />
              <span className="hidden sm:inline">Ноты</span>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
});


// Track type configuration
const trackConfig: Record<string, { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  shortLabel: string;
  gradient: string;
  accent: string;
}> = {
  main: { 
    icon: Music, 
    label: 'Основной', 
    shortLabel: 'MAIN',
    gradient: 'from-primary/20 to-primary/5',
    accent: 'text-primary bg-primary/20 border-primary/30'
  },
  vocal: { 
    icon: Mic2, 
    label: 'Вокал', 
    shortLabel: 'VOX',
    gradient: 'from-blue-500/20 to-blue-600/5',
    accent: 'text-blue-400 bg-blue-500/20 border-blue-500/30'
  },
  instrumental: { 
    icon: Guitar, 
    label: 'Инструментал', 
    shortLabel: 'INS',
    gradient: 'from-green-500/20 to-green-600/5',
    accent: 'text-green-400 bg-green-500/20 border-green-500/30'
  },
  drums: { 
    icon: Drum, 
    label: 'Ударные', 
    shortLabel: 'DRM',
    gradient: 'from-orange-500/20 to-orange-600/5',
    accent: 'text-orange-400 bg-orange-500/20 border-orange-500/30'
  },
  bass: { 
    icon: Waves, 
    label: 'Бас', 
    shortLabel: 'BAS',
    gradient: 'from-purple-500/20 to-purple-600/5',
    accent: 'text-purple-400 bg-purple-500/20 border-purple-500/30'
  },
  stem: { 
    icon: Sliders, 
    label: 'Стем', 
    shortLabel: 'STM',
    gradient: 'from-cyan-500/20 to-cyan-600/5',
    accent: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30'
  },
  sfx: { 
    icon: Sparkles, 
    label: 'SFX', 
    shortLabel: 'SFX',
    gradient: 'from-yellow-500/20 to-yellow-600/5',
    accent: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
  },
  other: { 
    icon: Music, 
    label: 'Другое', 
    shortLabel: 'OTH',
    gradient: 'from-gray-500/20 to-gray-600/5',
    accent: 'text-gray-400 bg-gray-500/20 border-gray-500/30'
  },
};

interface StudioTrackRowProps {
  track: StudioTrack;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  hasSoloTracks?: boolean;
  isSourceTrack?: boolean; // True if this is the main source track (can extend/replace)
  stemsExist?: boolean; // If stems exist, disable extend/replace
  hasTranscription?: boolean; // If track has MIDI/notation transcription
  transcription?: StemTranscriptionData | null; // Full transcription data for MIDI preview
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  onRemove: () => void;
  onVersionChange?: (versionLabel: string) => void;
  onAction?: (action: 'download' | 'effects' | 'reference' | 'add_vocals' | 'replace_instrumental' | 'extend' | 'replace_section' | 'transcribe' | 'view_notation') => void;
}

export const StudioTrackRow = memo(function StudioTrackRow({
  track,
  isPlaying,
  currentTime,
  duration,
  hasSoloTracks = false,
  isSourceTrack = false,
  stemsExist = false,
  hasTranscription = false,
  transcription,
  onToggleMute,
  onToggleSolo,
  onVolumeChange,
  onSeek,
  onRemove,
  onVersionChange,
  onAction,
}: StudioTrackRowProps) {
  const isMobile = useIsMobile();
  const [showVolume, setShowVolume] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const haptic = useHapticFeedback();
  
  const config = trackConfig[track.type] || trackConfig.other;
  const Icon = config.icon;

  // Get audio URL from track or first clip
  const audioUrl = track.audioUrl || track.clips[0]?.audioUrl;

  // Calculate effective mute: muted if explicitly muted OR if another track is solo and this isn't
  const effectiveMuted = track.muted || (hasSoloTracks && !track.solo);

  const handleToggle = useCallback((type: 'mute' | 'solo') => {
    haptic.select();
    if (type === 'mute') {
      onToggleMute();
    } else {
      onToggleSolo();
    }
  }, [haptic, onToggleMute, onToggleSolo]);

  const handleAction = useCallback((actionId: string) => {
    if (actionId === 'delete') {
      onRemove();
    } else if (onAction) {
      onAction(actionId as any);
    }
  }, [onAction, onRemove]);

  // Build disabled actions based on context
  const disabledActions: string[] = [];
  const disabledReasons: Record<string, string> = {};
  
  if (isSourceTrack && stemsExist) {
    disabledActions.push('extend', 'replace_section');
    disabledReasons['extend'] = 'Стемы блокируют изменения';
    disabledReasons['replace_section'] = 'Стемы блокируют изменения';
  }

  return (
    <>
      <StemActionSheet
        open={showActionSheet}
        onOpenChange={setShowActionSheet}
        trackId={track.id}
        trackName={track.name}
        trackType={track.type}
        trackColor={track.color}
        hasAudio={!!audioUrl}
        onAction={handleAction}
        disabledActions={disabledActions}
        disabledReasons={disabledReasons}
      />
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={cn(
        "relative group",
        effectiveMuted && "opacity-50"
      )}
    >
      <div className={cn(
        "flex flex-col rounded-xl overflow-hidden",
        "bg-gradient-to-r",
        config.gradient,
        "border border-border/30"
      )}>
        {/* Header row */}
        <div className="flex items-center gap-2 px-3 py-2">
          {/* Drag handle (desktop) */}
          {!isMobile && (
            <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab hover:text-muted-foreground" />
          )}
          
          {/* Track icon + label */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border",
              config.accent
            )}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-semibold tracking-wider truncate block">
                  {track.name}
                </span>
                {/* Transcription badge */}
                {hasTranscription && (
                  <button
                    onClick={() => onAction?.('view_notation')}
                    className="h-4 px-1 rounded text-[8px] bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors flex items-center gap-0.5"
                    title="Показать ноты"
                  >
                    <Music2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {config.shortLabel}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Mute - M button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggle('mute')}
              className={cn(
                "h-9 w-9 md:h-7 md:w-7 p-0 rounded-lg font-mono text-xs md:text-[10px] font-bold transition-all touch-manipulation",
                track.muted 
                  ? "bg-destructive text-destructive-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              M
            </Button>
            
            {/* Solo - S button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggle('solo')}
              className={cn(
                "h-9 w-9 md:h-7 md:w-7 p-0 rounded-lg font-mono text-xs md:text-[10px] font-bold transition-all touch-manipulation",
                track.solo 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              S
            </Button>

            {/* Version Selector */}
            {track.versions && track.versions.length > 1 && onVersionChange && (
              <StudioVersionSelector
                versions={track.versions}
                activeLabel={track.activeVersionLabel || 'A'}
                onSelect={onVersionChange}
                compact
              />
            )}

            {/* Volume toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVolume(!showVolume)}
              className={cn(
                "h-9 md:h-7 px-2 rounded-lg text-xs md:text-[10px] font-mono touch-manipulation",
                showVolume ? "bg-muted" : ""
              )}
            >
              {Math.round(track.volume * 100)}
            </Button>

            {/* Menu - Opens StemActionSheet */}
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 md:h-7 md:w-7 p-0 rounded-lg touch-manipulation"
              onClick={() => setShowActionSheet(true)}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Volume slider (expandable) */}
        <AnimatePresence>
          {showVolume && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-3 pb-2 overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onToggleMute}
                >
                  {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </Button>
                <Slider
                  value={[track.volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={(v) => onVolumeChange(v[0])}
                  className="flex-1"
                  disabled={track.muted}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waveform with progress overlay */}
        <div className="h-16 px-1 pb-1 relative">
          {audioUrl ? (
            <>
              <OptimizedStemWaveform
                audioUrl={audioUrl}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                isMuted={track.muted}
                color={track.type}
                height={64}
                onSeek={onSeek}
              />
              {/* Playhead line only - progress is rendered by OptimizedStemWaveform */}
              {duration > 0 && (
                <div 
                  className="absolute top-0 bottom-1 w-0.5 bg-primary pointer-events-none z-10"
                  style={{ 
                    left: `${(currentTime / duration) * 100}%`,
                    boxShadow: '0 0 6px var(--primary)',
                  }}
                />
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground bg-muted/20 rounded">
              Нет аудио
            </div>
          )}
        </div>

        {/* MIDI Notes Preview - show if we have transcription data */}
        {transcription && (transcription.notes?.length || transcription.midiUrl || transcription.pdfUrl || transcription.gp5Url) && (
          <div className="px-3 pb-2">
            <MidiNotesPreview
              notes={transcription.notes || []}
              duration={transcription.durationSeconds || duration}
              currentTime={currentTime}
              notesCount={transcription.notesCount || transcription.notes?.length || 0}
              bpm={transcription.bpm}
              keyDetected={transcription.keyDetected}
              onViewFull={() => onAction?.('view_notation')}
              onDownloadMidi={transcription.midiUrl ? () => window.open(transcription.midiUrl!, '_blank') : undefined}
              onDownloadPdf={transcription.pdfUrl ? () => window.open(transcription.pdfUrl!, '_blank') : undefined}
            />
          </div>
        )}
      </div>
    </motion.div>
    </>
  );
});
