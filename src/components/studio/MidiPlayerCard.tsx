/**
 * MidiPlayerCard - Compact MIDI playback and visualization
 */
import { useState, useEffect, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Pause, Volume2, VolumeX, Music, 
  Piano, Loader2, Download 
} from 'lucide-react';
import { PianoRollPreview } from '@/components/analysis/PianoRollPreview';
import { useMidiFileParser, type ParsedMidiNote } from '@/hooks/useMidiFileParser';
import { useMidiSynth } from '@/hooks/useMidiSynth';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';

interface MidiPlayerCardProps {
  midiUrl: string;
  title?: string;
  className?: string;
  onDownload?: () => void;
}

export function MidiPlayerCard({
  midiUrl,
  title,
  className,
  onDownload,
}: MidiPlayerCardProps) {
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

  const handleNoteClick = useCallback(async (note: ParsedMidiNote) => {
    if (!isReady) await initialize();
    playNote(note.pitch, 0.5, note.velocity / 127);
  }, [isReady, initialize, playNote]);

  if (isParsing) {
    return (
      <Card className={cn("p-6 flex flex-col items-center justify-center gap-3", className)}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Загрузка MIDI...</p>
      </Card>
    );
  }

  if (parseError) {
    return (
      <Card className={cn("p-6 flex flex-col items-center justify-center gap-3", className)}>
        <Music className="w-8 h-8 text-destructive" />
        <p className="text-sm text-destructive">Ошибка загрузки MIDI</p>
        <p className="text-xs text-muted-foreground">{parseError}</p>
      </Card>
    );
  }

  if (!parsedMidi || parsedMidi.notes.length === 0) {
    return (
      <Card className={cn("p-6 flex flex-col items-center justify-center gap-3", className)}>
        <Piano className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Ноты не найдены</p>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header */}
      {title && (
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {parsedMidi.notes.length} нот
            </Badge>
            {parsedMidi.bpm && (
              <Badge variant="outline" className="text-xs">
                {Math.round(parsedMidi.bpm)} BPM
              </Badge>
            )}
            {onDownload && (
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onDownload}>
                <Download className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Piano Roll */}
      <div className="p-3">
        <PianoRollPreview
          notes={parsedMidi.notes}
          duration={parsedMidi.duration}
          currentTime={currentTime}
          height={160}
        />
      </div>

      {/* Controls */}
      <div className="px-4 pb-4 space-y-3">
        {/* Progress Bar */}
        <div 
          className="h-2 bg-muted rounded-full overflow-hidden cursor-pointer"
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
        <div className="flex items-center justify-between gap-3">
          <Button
            size="icon"
            variant={isPlaying ? "secondary" : "default"}
            onClick={handleTogglePlayback}
            className="h-10 w-10 rounded-full shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </Button>

          <div className="flex-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(parsedMidi.duration)}</span>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setMuted(!isMuted)}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            <Slider
              value={[volume]}
              onValueChange={([v]) => setVolume(v)}
              min={-40}
              max={0}
              step={1}
              disabled={isMuted}
              className="w-20"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
