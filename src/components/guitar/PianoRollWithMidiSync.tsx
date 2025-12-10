/**
 * Piano Roll with MIDI synchronized playback
 * Plays MIDI notes in real-time with audio
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Play, Pause, Volume2, VolumeX, Music, 
  Piano, Settings2, Loader2 
} from 'lucide-react';
import { PianoRollPreview } from '@/components/analysis/PianoRollPreview';
import { useMidiSync } from '@/hooks/studio/useMidiSync';
import type { MidiNote } from '@/hooks/useMidiVisualization';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';

interface NoteData {
  pitch: number;
  startTime?: number;
  time?: number;
  endTime?: number;
  duration?: number;
  velocity?: number;
  noteName?: string;
}

interface PianoRollWithMidiSyncProps {
  notes: NoteData[];
  audioUrl: string;
  duration: number;
  className?: string;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTE_NAMES[midi % 12];
  return `${note}${octave}`;
}

// Convert our note data to MidiNote format
function toMidiNotes(notes: NoteData[]): MidiNote[] {
  return notes.map((note, index) => ({
    id: `note_${index}_${note.pitch}`,
    name: note.noteName || midiToNoteName(note.pitch),
    pitch: note.pitch,
    time: note.startTime ?? note.time ?? 0,
    duration: note.duration ?? (note.endTime ? note.endTime - (note.startTime ?? note.time ?? 0) : 0.5),
    velocity: note.velocity ?? 80,
    track: 0,
  }));
}

export function PianoRollWithMidiSync({
  notes,
  audioUrl,
  duration,
  className,
}: PianoRollWithMidiSyncProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  const midiNotes = toMidiNotes(notes);
  
  const {
    isReady,
    isSyncEnabled,
    isMuted,
    volume,
    setVolume,
    setMuted,
    setSyncEnabled,
    initialize,
    playNotePreview,
    stopAll,
  } = useMidiSync({
    notes: midiNotes,
    currentTime,
    isPlaying,
    enabled: true,
  });

  // Audio time tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      stopAll();
    };
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, [stopAll]);

  const handleTogglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Initialize MIDI synth if needed
    if (!isReady) {
      await initialize();
    }

    if (isPlaying) {
      audio.pause();
      stopAll();
    } else {
      audio.play();
    }
  };

  const handleNoteClick = (note: NoteData) => {
    if (!isReady) {
      initialize().then(() => {
        playNotePreview(toMidiNotes([note])[0]);
      });
    } else {
      playNotePreview(toMidiNotes([note])[0]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (notes.length === 0) {
    return (
      <Card className={cn("p-6 text-center", className)}>
        <Piano className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">Ноты не найдены</p>
        <p className="text-sm text-muted-foreground mt-1">
          Проанализируйте аудио для отображения нот
        </p>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <audio ref={audioRef} src={audioUrl} className="hidden" />
      
      {/* Controls */}
      <Card className="p-3">
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <Button
            size="icon"
            variant={isPlaying ? "secondary" : "default"}
            onClick={handleTogglePlayback}
            className="h-12 w-12 rounded-full shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>

          {/* Progress */}
          <div className="flex-1 min-w-0">
            <div 
              className="h-2 bg-muted rounded-full overflow-hidden cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const newTime = percent * duration;
                if (audioRef.current) {
                  audioRef.current.currentTime = newTime;
                  setCurrentTime(newTime);
                }
              }}
            >
              <motion.div 
                className="h-full bg-primary"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                {formatTime(currentTime)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* MIDI Sync Status */}
          <Badge 
            variant={isSyncEnabled ? "default" : "secondary"} 
            className="gap-1 shrink-0"
          >
            {isReady ? (
              <>
                <Music className="w-3 h-3" />
                MIDI
              </>
            ) : (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Init
              </>
            )}
          </Badge>

          {/* Settings Toggle */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
            className="h-9 w-9"
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t space-y-4"
          >
            {/* MIDI Sync Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="midi-sync" className="flex items-center gap-2">
                <Piano className="w-4 h-4" />
                Воспроизводить MIDI ноты
              </Label>
              <Switch
                id="midi-sync"
                checked={isSyncEnabled}
                onCheckedChange={setSyncEnabled}
              />
            </div>

            {/* Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                  Громкость MIDI
                </Label>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setMuted(!isMuted)}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <Slider
                value={[volume]}
                onValueChange={([v]) => setVolume(v)}
                min={-40}
                max={0}
                step={1}
                disabled={isMuted}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground text-right">
                {volume} dB
              </p>
            </div>
          </motion.div>
        )}
      </Card>

      {/* Piano Roll */}
      <PianoRollPreview
        notes={notes}
        duration={duration}
        currentTime={currentTime}
        height={200}
      />

      {/* Note count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{notes.length} нот</span>
        <span>Нажмите на ноту для предпрослушивания</span>
      </div>
    </div>
  );
}
