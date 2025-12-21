/**
 * MidiPlayerCard - Compact MIDI playback and visualization
 * Supports Piano Roll and Sheet Music (MusicXML) view modes
 */
import { useState, useEffect, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  Play, Pause, Volume2, VolumeX, Music, 
  Piano, Loader2, Download, Music2
} from 'lucide-react';
import { PianoRollPreview } from '@/components/analysis/PianoRollPreview';
import { MusicXMLViewer } from '@/components/guitar/MusicXMLViewer';
import { useMidiFileParser, type ParsedMidiNote } from '@/hooks/useMidiFileParser';
import { useMidiSynth } from '@/hooks/useMidiSynth';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MidiPlayerCardProps {
  midiUrl: string;
  musicXmlUrl?: string;
  title?: string;
  className?: string;
  onDownload?: () => void;
  defaultViewMode?: 'piano' | 'notation';
}

export function MidiPlayerCard({
  midiUrl,
  musicXmlUrl,
  title,
  className,
  onDownload,
  defaultViewMode,
}: MidiPlayerCardProps) {
  const isMobile = useIsMobile();
  const { parseMidiFromUrl, parsedMidi, isLoading: isParsing, error: parseError } = useMidiFileParser();
  const {
    isReady,
    isMuted,
    volume,
    playNote,
    stopAll,
    setVolume,
    setMuted,
    initialize,
  } = useMidiSynth();

  // Auto-select notation mode if MusicXML available
  const [viewMode, setViewMode] = useState<'piano' | 'notation'>(
    defaultViewMode || (musicXmlUrl ? 'notation' : 'piano')
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackInterval, setPlaybackInterval] = useState<NodeJS.Timeout | null>(null);
  const [playedNotes, setPlayedNotes] = useState<Set<number>>(new Set());

  // Parse MIDI on mount or when URL changes
  useEffect(() => {
    if (midiUrl) {
      parseMidiFromUrl(midiUrl);
    }
  }, [midiUrl, parseMidiFromUrl]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying || !parsedMidi) return;

    const startTime = Date.now() - currentTime * 1000;
    
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      
      if (elapsed >= parsedMidi.duration) {
        setIsPlaying(false);
        setCurrentTime(0);
        setPlayedNotes(new Set());
        stopAll();
        return;
      }

      setCurrentTime(elapsed);

      // Play notes that should be triggered
      parsedMidi.notes.forEach((note, index) => {
        if (!playedNotes.has(index) && note.startTime <= elapsed && note.startTime > elapsed - 0.05) {
          playNote(note.pitch, note.duration, note.velocity / 127);
          setPlayedNotes(prev => new Set(prev).add(index));
        }
      });
    }, 16); // ~60fps

    setPlaybackInterval(interval);

    return () => {
      clearInterval(interval);
      setPlaybackInterval(null);
    };
  }, [isPlaying, parsedMidi, currentTime, playNote, stopAll, playedNotes]);

  const handleTogglePlayback = useCallback(async () => {
    if (!isReady) {
      await initialize();
    }

    if (isPlaying) {
      setIsPlaying(false);
      stopAll();
    } else {
      if (currentTime >= (parsedMidi?.duration ?? 0)) {
        setCurrentTime(0);
        setPlayedNotes(new Set());
      }
      setIsPlaying(true);
    }
  }, [isReady, isPlaying, currentTime, parsedMidi?.duration, initialize, stopAll]);

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
    setPlayedNotes(new Set());
    stopAll();
  }, [stopAll]);

  if (isParsing) {
    return (
      <Card className={cn("p-4 sm:p-6 flex flex-col items-center justify-center gap-3", className)}>
        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" />
        <p className="text-xs sm:text-sm text-muted-foreground">Загрузка MIDI...</p>
      </Card>
    );
  }

  if (parseError) {
    return (
      <Card className={cn("p-4 sm:p-6 flex flex-col items-center justify-center gap-3", className)}>
        <Music className="w-6 h-6 sm:w-8 sm:h-8 text-destructive" />
        <p className="text-xs sm:text-sm text-destructive">Ошибка загрузки MIDI</p>
        <p className="text-[10px] sm:text-xs text-muted-foreground">{parseError}</p>
      </Card>
    );
  }

  if (!parsedMidi || parsedMidi.notes.length === 0) {
    return (
      <Card className={cn("p-4 sm:p-6 flex flex-col items-center justify-center gap-3", className)}>
        <Piano className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
        <p className="text-xs sm:text-sm text-muted-foreground">Ноты не найдены</p>
      </Card>
    );
  }

  const hasNotation = !!musicXmlUrl;

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header */}
      <div className="px-2 sm:px-4 py-2 sm:py-3 border-b bg-muted/30">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Music className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
            {title && <span className="text-xs sm:text-sm font-medium truncate">{title}</span>}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Badge variant="secondary" className="text-[10px] sm:text-xs">
              {parsedMidi.notes.length} нот
            </Badge>
            {parsedMidi.bpm && (
              <Badge variant="outline" className="text-[10px] sm:text-xs hidden sm:inline-flex">
                {Math.round(parsedMidi.bpm)} BPM
              </Badge>
            )}
            {onDownload && (
              <Button size="icon" variant="ghost" className="h-6 w-6 sm:h-7 sm:w-7" onClick={onDownload}>
                <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* View Mode Toggle - show if MusicXML available */}
        {hasNotation && (
          <div className="mt-2">
            <ToggleGroup 
              type="single" 
              value={viewMode} 
              onValueChange={(v) => v && setViewMode(v as 'piano' | 'notation')}
              className="justify-start"
            >
              <ToggleGroupItem value="piano" size="sm" className="h-7 px-2 sm:px-3 text-[10px] sm:text-xs gap-1">
                <Piano className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Piano Roll
              </ToggleGroupItem>
              <ToggleGroupItem value="notation" size="sm" className="h-7 px-2 sm:px-3 text-[10px] sm:text-xs gap-1">
                <Music2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Ноты
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}
      </div>

      {/* Visualization Area - scrollable on mobile */}
      <div className="p-2 sm:p-3 overflow-x-auto">
        {viewMode === 'piano' ? (
          <div className="min-w-[280px]">
            <PianoRollPreview
              notes={parsedMidi.notes}
              duration={parsedMidi.duration}
              currentTime={currentTime}
              height={isMobile ? 120 : 160}
            />
          </div>
        ) : musicXmlUrl ? (
          <div className="min-w-[280px]">
            <MusicXMLViewer
              url={musicXmlUrl}
              zoom={isMobile ? 60 : 80}
              className="min-h-[120px] sm:min-h-[160px]"
            />
          </div>
        ) : (
          <div className="min-w-[280px]">
            <PianoRollPreview
              notes={parsedMidi.notes}
              duration={parsedMidi.duration}
              currentTime={currentTime}
              height={isMobile ? 120 : 160}
            />
          </div>
        )}
      </div>

      {/* Controls - compact on mobile */}
      <div className="px-2 sm:px-4 pb-2 sm:pb-4 space-y-2 sm:space-y-3">
        {/* Progress Bar */}
        <div 
          className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            handleSeek(percent * parsedMidi.duration);
          }}
        >
          <motion.div 
            className="h-full bg-primary"
            style={{ width: `${(currentTime / parsedMidi.duration) * 100}%` }}
          />
        </div>

        {/* Time and Controls */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <Button
            size="icon"
            variant={isPlaying ? "secondary" : "default"}
            onClick={handleTogglePlayback}
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            ) : (
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />
            )}
          </Button>

          <div className="flex-1 flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(parsedMidi.duration)}</span>
          </div>

          {/* Volume - hidden on very small screens */}
          <div className="hidden xs:flex items-center gap-1 sm:gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 sm:h-8 sm:w-8"
              onClick={() => setMuted(!isMuted)}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </Button>
            <Slider
              value={[volume]}
              onValueChange={([v]) => setVolume(v)}
              min={-40}
              max={0}
              step={1}
              disabled={isMuted}
              className="w-14 sm:w-20"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
