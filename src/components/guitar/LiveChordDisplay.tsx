/**
 * LiveChordDisplay - Real-time chord visualization during recording
 * Shows current chord with guitar diagram, chromagram, and history
 */

import { memo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Waves, Volume2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChordDiagram } from '@/components/guitar/ChordDiagram';
import { getChordColor, getChordNotes, type DetectedChord } from '@/lib/chord-detection';
import { cn } from '@/lib/utils';

const NOTE_LABELS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface LiveChordDisplayProps {
  currentChord: DetectedChord | null;
  chromagram: number[];
  chordHistory: DetectedChord[];
  volume: number;
  isListening: boolean;
  className?: string;
}

export const LiveChordDisplay = memo(function LiveChordDisplay({
  currentChord,
  chromagram,
  chordHistory,
  volume,
  isListening,
  className,
}: LiveChordDisplayProps) {
  const chordNotes = currentChord ? getChordNotes(currentChord.name) : [];
  const hasValidChord = currentChord && currentChord.name !== 'N/C';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Volume indicator */}
      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <Progress 
          value={volume * 100} 
          className="h-2 flex-1"
        />
        <span className="text-xs text-muted-foreground w-8 text-right">
          {Math.round(volume * 100)}%
        </span>
      </div>

      {/* Main chord display with diagram */}
      <div className="flex items-center justify-center gap-6">
        {/* Chord name and info */}
        <AnimatePresence mode="wait">
          {hasValidChord ? (
            <motion.div
              key={currentChord.name}
              initial={{ scale: 0.8, opacity: 0, x: -20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.8, opacity: 0, x: -20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="text-center min-w-[100px]"
            >
              <div
                className="text-5xl sm:text-6xl font-bold mb-1"
                style={{ color: getChordColor(currentChord.quality) }}
              >
                {currentChord.name}
              </div>
              
              {/* Confidence bar */}
              <div className="flex justify-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ 
                      scale: 1,
                      opacity: i < Math.floor(currentChord.confidence * 5) ? 1 : 0.2 
                    }}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getChordColor(currentChord.quality) }}
                  />
                ))}
              </div>

              {/* Quality label */}
              <div className="text-xs text-muted-foreground">
                {currentChord.quality === 'major' && 'Мажор'}
                {currentChord.quality === 'minor' && 'Минор'}
                {currentChord.quality === '7' && 'Септаккорд'}
                {currentChord.quality === 'sus4' && 'Sus4'}
                {currentChord.quality === 'dim' && 'Уменьшенный'}
                {currentChord.quality === 'aug' && 'Увеличенный'}
              </div>

              {/* Chord notes */}
              <div className="flex justify-center gap-1 mt-2 flex-wrap">
                {chordNotes.map(note => (
                  <Badge 
                    key={note} 
                    variant="outline"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {note}
                  </Badge>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-4"
            >
              <Waves className="w-10 h-10 mx-auto text-muted-foreground animate-pulse mb-2" />
              <p className="text-sm text-muted-foreground">
                Сыграйте аккорд...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guitar Diagram */}
        <AnimatePresence mode="wait">
          {hasValidChord && (
            <motion.div
              key={`diagram-${currentChord.name}`}
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="hidden sm:block"
            >
              <ChordDiagram chord={currentChord.name} size="lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chromagram visualization */}
      <div className="bg-muted/30 rounded-lg p-3">
        <p className="text-xs text-muted-foreground mb-2">Хромаграмма (частоты нот)</p>
        <div className="flex justify-between gap-0.5 h-16">
          {chromagram.map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="flex-1 w-full flex items-end">
                <motion.div
                  className="w-full rounded-t-sm"
                  animate={{ 
                    height: `${Math.max(value * 100, 2)}%`,
                  }}
                  style={{
                    backgroundColor: chordNotes.includes(NOTE_LABELS[index])
                      ? 'hsl(var(--primary))'
                      : `hsl(var(--muted-foreground) / ${0.2 + value * 0.5})`,
                  }}
                  transition={{ duration: 0.05 }}
                />
              </div>
              <span className={cn(
                "text-[9px] mt-0.5",
                chordNotes.includes(NOTE_LABELS[index])
                  ? "text-primary font-bold"
                  : "text-muted-foreground"
              )}>
                {NOTE_LABELS[index]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chord History */}
      {chordHistory.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Обнаруженные аккорды</p>
            <Badge variant="secondary" className="text-[10px]">
              {chordHistory.length}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-1.5">
            {chordHistory.slice(0, 16).map((chord, i) => (
              <motion.div
                key={`${chord.name}-${i}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.02 }}
              >
                <Badge 
                  variant={i === 0 ? "default" : "outline"}
                  className={cn(
                    "text-xs transition-all",
                    i === 0 && "ring-2 ring-primary/50"
                  )}
                  style={i > 0 ? { 
                    borderColor: getChordColor(chord.quality),
                    color: getChordColor(chord.quality),
                  } : undefined}
                >
                  {chord.name}
                </Badge>
              </motion.div>
            ))}
            {chordHistory.length > 16 && (
              <Badge variant="outline" className="text-xs opacity-60">
                +{chordHistory.length - 16}
              </Badge>
            )}
          </div>

          {/* Progression preview */}
          <div className="bg-muted/30 rounded px-2 py-1.5 mt-2">
            <p className="text-[10px] text-muted-foreground truncate font-mono">
              {chordHistory.slice(0, 8).map(c => c.name).reverse().join(' → ')}
              {chordHistory.length > 8 && ' ...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
