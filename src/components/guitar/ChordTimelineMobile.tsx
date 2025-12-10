import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { ChordData } from '@/hooks/useGuitarAnalysis';
import { ChordDiagramEnhanced } from './ChordDiagramEnhanced';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';

interface ChordTimelineMobileProps {
  chords: ChordData[];
  duration: number;
  currentTime: number;
  onSeek?: (time: number) => void;
  className?: string;
}

export function ChordTimelineMobile({
  chords,
  duration,
  currentTime,
  onSeek,
  className,
}: ChordTimelineMobileProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { tap, selectionChanged } = useHapticFeedback();
  const [activeChordIndex, setActiveChordIndex] = useState(0);
  const [showDiagram, setShowDiagram] = useState(false);

  // Find current chord
  useEffect(() => {
    const index = chords.findIndex(
      c => currentTime >= c.startTime && currentTime < c.endTime
    );
    if (index !== -1 && index !== activeChordIndex) {
      setActiveChordIndex(index);
      selectionChanged();
      
      // Auto-scroll to active chord
      if (scrollRef.current) {
        const chordElement = scrollRef.current.children[index] as HTMLElement;
        if (chordElement) {
          chordElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
    }
  }, [currentTime, chords, activeChordIndex, selectionChanged]);

  const handleChordTap = useCallback((chord: ChordData, index: number) => {
    tap();
    onSeek?.(chord.startTime);
    setActiveChordIndex(index);
  }, [onSeek, tap]);

  const handleShowDiagram = useCallback(() => {
    tap();
    setShowDiagram(true);
  }, [tap]);

  const navigateChord = useCallback((direction: 'prev' | 'next') => {
    selectionChanged();
    const newIndex = direction === 'prev' 
      ? Math.max(0, activeChordIndex - 1)
      : Math.min(chords.length - 1, activeChordIndex + 1);
    
    if (newIndex !== activeChordIndex) {
      setActiveChordIndex(newIndex);
      onSeek?.(chords[newIndex].startTime);
    }
  }, [activeChordIndex, chords, onSeek, selectionChanged]);

  const activeChord = chords[activeChordIndex];
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (chords.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Current Chord Display */}
      <motion.div 
        className="flex items-center justify-between gap-4 p-3 rounded-xl bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-primary/20"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <button
          onClick={() => navigateChord('prev')}
          disabled={activeChordIndex === 0}
          className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform touch-manipulation"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <motion.div 
          key={activeChord?.chord}
          className="flex-1 text-center cursor-pointer"
          onClick={handleShowDiagram}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div 
            className="text-3xl sm:text-4xl font-bold font-mono text-primary"
            animate={{ 
              scale: [1, 1.05, 1],
              textShadow: ['0 0 0px hsl(var(--primary))', '0 0 20px hsl(var(--primary))', '0 0 0px hsl(var(--primary))']
            }}
            transition={{ duration: 0.3 }}
          >
            {activeChord?.chord || '-'}
          </motion.div>
          <p className="text-xs text-muted-foreground mt-1">
            Нажмите для просмотра диаграммы
          </p>
        </motion.div>

        <button
          onClick={() => navigateChord('next')}
          disabled={activeChordIndex === chords.length - 1}
          className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform touch-manipulation"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Progress Bar with Chord Regions */}
      <div className="relative h-3 rounded-full bg-muted/50 overflow-hidden">
        {/* Chord regions */}
        {chords.map((chord, i) => {
          const left = (chord.startTime / duration) * 100;
          const width = ((chord.endTime - chord.startTime) / duration) * 100;
          const isActive = i === activeChordIndex;
          
          return (
            <motion.div
              key={i}
              className={cn(
                "absolute top-0 bottom-0 border-r border-background/50 cursor-pointer transition-colors",
                isActive ? 'bg-primary/40' : 'bg-muted-foreground/20'
              )}
              style={{ left: `${left}%`, width: `${width}%` }}
              onClick={() => handleChordTap(chord, i)}
              whileHover={{ backgroundColor: 'hsl(var(--primary) / 0.3)' }}
            />
          );
        })}
        
        {/* Playhead */}
        <motion.div
          className="absolute top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_hsl(var(--primary))]"
          style={{ left: `${progress}%` }}
          animate={{ 
            boxShadow: ['0 0 5px hsl(var(--primary))', '0 0 15px hsl(var(--primary))', '0 0 5px hsl(var(--primary))']
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>

      {/* Horizontal Chord Pills */}
      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-2 px-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {chords.map((chord, i) => {
          const isActive = i === activeChordIndex;
          const isPast = chord.endTime < currentTime;
          
          return (
            <motion.button
              key={i}
              className={cn(
                "flex-shrink-0 px-4 py-2.5 rounded-xl font-mono text-sm font-medium transition-all snap-center touch-manipulation min-w-[60px]",
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105' 
                  : isPast 
                    ? 'bg-muted/50 text-muted-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
              )}
              onClick={() => handleChordTap(chord, i)}
              whileTap={{ scale: 0.95 }}
              animate={isActive ? { 
                boxShadow: ['0 0 10px hsl(var(--primary) / 0.3)', '0 0 20px hsl(var(--primary) / 0.5)', '0 0 10px hsl(var(--primary) / 0.3)']
              } : {}}
              transition={isActive ? { duration: 1.5, repeat: Infinity } : {}}
            >
              {chord.chord}
            </motion.button>
          );
        })}
      </div>

      {/* Chord Diagram Modal */}
      <AnimatePresence>
        {showDiagram && activeChord && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDiagram(false)}
          >
            <motion.div
              className="bg-card border rounded-2xl p-6 shadow-2xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ChordDiagramEnhanced 
                chord={activeChord.chord} 
                size="lg" 
                showFingers
                animated
              />
              <p className="text-center text-sm text-muted-foreground mt-4">
                Нажмите вне диаграммы для закрытия
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
