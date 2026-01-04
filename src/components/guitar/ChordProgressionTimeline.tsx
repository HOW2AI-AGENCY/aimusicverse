/**
 * ChordProgressionTimeline - Enhanced mobile chord progression visualization
 * Shows chord changes over time with interactive playback
 * Based on klang.io chord recognition results
 */

import { useRef, useEffect, useState, useId } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Music2, PlayCircle, PauseCircle, SkipBack, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import type { ChordData } from '@/hooks/useGuitarAnalysis';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { registerStudioAudio, unregisterStudioAudio, pauseAllStudioAudio } from '@/hooks/studio/useStudioAudio';

interface ChordProgressionTimelineProps {
  chords: ChordData[];
  audioUrl?: string;
  duration: number;
  keySignature?: string;
  className?: string;
}

const CHORD_COLORS = [
  'bg-purple-500/20 border-purple-500/40 text-purple-700 dark:text-purple-300',
  'bg-blue-500/20 border-blue-500/40 text-blue-700 dark:text-blue-300',
  'bg-cyan-500/20 border-cyan-500/40 text-cyan-700 dark:text-cyan-300',
  'bg-green-500/20 border-green-500/40 text-green-700 dark:text-green-300',
  'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300',
  'bg-orange-500/20 border-orange-500/40 text-orange-700 dark:text-orange-300',
  'bg-red-500/20 border-red-500/40 text-red-700 dark:text-red-300',
  'bg-pink-500/20 border-pink-500/40 text-pink-700 dark:text-pink-300',
];

export function ChordProgressionTimeline({
  chords,
  audioUrl,
  duration,
  keySignature = 'Unknown',
  className,
}: ChordProgressionTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const sourceId = useId();
  const { pauseTrack, isPlaying: globalIsPlaying } = usePlayerStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentChordIndex, setCurrentChordIndex] = useState<number>(-1);

  // Register for studio audio coordination
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      registerStudioAudio(sourceId, () => {
        audio.pause();
        setIsPlaying(false);
      });
    }
    return () => unregisterStudioAudio(sourceId);
  }, [sourceId]);

  // Pause if global player starts
  useEffect(() => {
    if (globalIsPlaying && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  }, [globalIsPlaying, isPlaying]);

  // Map unique chords to colors
  const uniqueChords = Array.from(new Set(chords.map(c => c.chord)));
  const chordColorMap = new Map(
    uniqueChords.map((chord, i) => [chord, CHORD_COLORS[i % CHORD_COLORS.length]])
  );

  // Update current chord based on time
  useEffect(() => {
    const chord = chords.findIndex(
      c => currentTime >= c.startTime && currentTime < c.endTime
    );
    setCurrentChordIndex(chord);
  }, [currentTime, chords]);

  // Animation loop for time tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) return;

    let rafId: number;
    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      rafId = requestAnimationFrame(updateTime);
    };

    rafId = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      pauseTrack();
      pauseAllStudioAudio(sourceId);
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (chordIndex: number) => {
    const audio = audioRef.current;
    const chord = chords[chordIndex];
    if (!audio || !chord) return;

    audio.currentTime = chord.startTime;
    setCurrentTime(chord.startTime);
  };

  const handlePrevChord = () => {
    if (currentChordIndex > 0) {
      handleSeek(currentChordIndex - 1);
    }
  };

  const handleNextChord = () => {
    if (currentChordIndex < chords.length - 1) {
      handleSeek(currentChordIndex + 1);
    }
  };

  const formatChordName = (chord: string) => {
    // Format chord name for display
    return chord === 'N' || chord === '' ? '—' : chord;
  };

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold">Прогрессия аккордов</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {keySignature}
        </Badge>
      </div>

      {/* Current Chord Display */}
      <AnimatePresence mode="wait">
        {currentChordIndex >= 0 && (
          <motion.div
            key={currentChordIndex}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="text-center py-4"
          >
            <div className="text-4xl font-bold mb-2">
              {formatChordName(chords[currentChordIndex].chord)}
            </div>
            <div className="text-xs text-muted-foreground">
              Аккорд {currentChordIndex + 1} из {chords.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      <div 
        ref={containerRef}
        className="relative h-20 bg-muted/20 rounded-lg border overflow-x-auto overflow-y-hidden"
        style={{ touchAction: 'pan-x' }}
      >
        <div className="absolute inset-0 flex">
          {chords.map((chord, index) => {
            const widthPercent = ((chord.endTime - chord.startTime) / duration) * 100;
            const leftPercent = (chord.startTime / duration) * 100;
            const isActive = index === currentChordIndex;
            const colorClass = chordColorMap.get(chord.chord) || CHORD_COLORS[0];

            return (
              <motion.button
                key={`${chord.chord}-${index}`}
                onClick={() => handleSeek(index)}
                className={cn(
                  "absolute h-full border-r flex flex-col items-center justify-center",
                  "transition-all duration-200 touch-manipulation",
                  "hover:brightness-110",
                  colorClass,
                  isActive && "ring-2 ring-primary ring-inset z-10 brightness-125"
                )}
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  minWidth: '40px',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <span className="text-xs font-semibold truncate px-1">
                  {formatChordName(chord.chord)}
                </span>
                <span className="text-[10px] opacity-70">
                  {formatTime(chord.startTime)}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Playhead */}
        {duration > 0 && (
          <motion.div
            className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-20 pointer-events-none"
            style={{
              left: `${(currentTime / duration) * 100}%`,
            }}
            initial={false}
            animate={{ left: `${(currentTime / duration) * 100}%` }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full">
              <div className="w-3 h-3 rotate-45 bg-green-500 -mb-1.5" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      {audioUrl && (
        <>
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
          />

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrevChord}
              disabled={currentChordIndex <= 0}
              className="touch-manipulation"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="default"
              onClick={handlePlayPause}
              className="flex-1 touch-manipulation"
            >
              {isPlaying ? (
                <PauseCircle className="w-4 h-4 mr-2" />
              ) : (
                <PlayCircle className="w-4 h-4 mr-2" />
              )}
              {isPlaying ? 'Пауза' : 'Играть'}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleNextChord}
              disabled={currentChordIndex >= chords.length - 1}
              className="touch-manipulation"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}

      {/* Chord Palette */}
      <div className="pt-3 border-t">
        <div className="text-xs text-muted-foreground mb-2">
          Найдено аккордов: {uniqueChords.length}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {uniqueChords.slice(0, 12).map(chord => {
            const colorClass = chordColorMap.get(chord) || CHORD_COLORS[0];
            const isPlaying = currentChordIndex >= 0 && 
              chords[currentChordIndex].chord === chord;

            return (
              <Badge
                key={chord}
                variant="outline"
                className={cn(
                  "text-xs transition-all",
                  colorClass,
                  isPlaying && "ring-2 ring-primary"
                )}
              >
                {formatChordName(chord)}
              </Badge>
            );
          })}
          {uniqueChords.length > 12 && (
            <Badge variant="outline" className="text-xs">
              +{uniqueChords.length - 12}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
