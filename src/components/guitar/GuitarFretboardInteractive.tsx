/**
 * GuitarFretboardInteractive - Interactive guitar fretboard with finger positions
 * Supports pinch-to-zoom, tap for note info, and real-time highlighting
 */

import { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { useGestures } from '@/hooks/useGestures';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface FretNote {
  string: number; // 0-5 (E to e)
  fret: number;   // 0-24
  time?: number;
  duration?: number;
  finger?: number; // 1-4 for finger suggestion
}

interface GuitarFretboardInteractiveProps {
  notes: FretNote[];
  currentNotes?: FretNote[];
  onNotePress?: (note: FretNote) => void;
  fretRange?: [number, number];
  showFingerNumbers?: boolean;
}

// Standard tuning note names
const stringNotes = ['E', 'A', 'D', 'G', 'B', 'E'];
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const openStringPitches = [40, 45, 50, 55, 59, 64]; // MIDI notes

// Finger colors
const fingerColors = [
  'hsl(var(--primary))',       // Default
  'hsl(200, 80%, 60%)',        // Index - Blue
  'hsl(160, 70%, 50%)',        // Middle - Teal
  'hsl(30, 80%, 60%)',         // Ring - Orange
  'hsl(280, 70%, 60%)',        // Pinky - Purple
];

// Get note name at position
function getNoteName(string: number, fret: number): string {
  const midiNote = openStringPitches[string] + fret;
  return noteNames[midiNote % 12];
}

export const GuitarFretboardInteractive = memo(function GuitarFretboardInteractive({
  notes,
  currentNotes = [],
  onNotePress,
  fretRange = [0, 12],
  showFingerNumbers = true,
}: GuitarFretboardInteractiveProps) {
  const haptic = useHapticFeedback();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [selectedNote, setSelectedNote] = useState<FretNote | null>(null);
  const [viewRange, setViewRange] = useState(fretRange);

  // Gesture handling for pinch-to-zoom
  const { gestureHandlers, isPinching } = useGestures({
    onPinch: (newScale) => {
      setScale(Math.max(0.5, Math.min(2, newScale)));
    },
    onSwipeLeft: () => {
      setViewRange(([start, end]) => {
        const width = end - start;
        const newStart = Math.min(start + 2, 24 - width);
        return [newStart, newStart + width];
      });
    },
    onSwipeRight: () => {
      setViewRange(([start, end]) => {
        const width = end - start;
        const newStart = Math.max(start - 2, 0);
        return [newStart, newStart + width];
      });
    },
  });

  // Calculate visible frets
  const visibleFrets = useMemo(() => {
    const [start, end] = viewRange;
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [viewRange]);

  // Group notes by position for quick lookup
  const noteMap = useMemo(() => {
    const map = new Map<string, FretNote[]>();
    notes.forEach(note => {
      const key = `${note.string}-${note.fret}`;
      const existing = map.get(key) || [];
      map.set(key, [...existing, note]);
    });
    return map;
  }, [notes]);

  // Current note positions
  const currentNoteSet = useMemo(() => {
    return new Set(currentNotes.map(n => `${n.string}-${n.fret}`));
  }, [currentNotes]);

  // Handle note tap
  const handleNotePress = useCallback((string: number, fret: number) => {
    const note: FretNote = { string, fret };
    const existing = noteMap.get(`${string}-${fret}`)?.[0];
    
    if (existing) {
      setSelectedNote(existing);
      onNotePress?.(existing);
    } else {
      setSelectedNote(note);
      onNotePress?.(note);
    }
    haptic.impact('medium');
  }, [noteMap, onNotePress, haptic]);

  // Fret markers positions (standard)
  const fretMarkers = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
  const doubleFretMarkers = [12, 24];

  return (
    <div className="relative">
      {/* Fret position indicator */}
      <div className="flex justify-between px-2 mb-2 text-xs text-muted-foreground">
        <span>Fret {viewRange[0]}</span>
        <span>Fret {viewRange[1]}</span>
      </div>

      {/* Fretboard container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl bg-gradient-to-b from-amber-900/90 to-amber-950 p-2"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
        {...gestureHandlers}
      >
        {/* Nut (if visible) */}
        {viewRange[0] === 0 && (
          <div className="absolute left-8 top-0 bottom-0 w-2 bg-stone-200 rounded-sm shadow-lg z-10" />
        )}

        {/* Fret wires */}
        <div className="absolute inset-0 flex">
          {visibleFrets.map((fret, i) => (
            <div
              key={fret}
              className="flex-1 border-r-2 border-stone-400/60"
              style={{ borderWidth: fret === 0 ? 0 : 2 }}
            />
          ))}
        </div>

        {/* Fret markers */}
        <div className="absolute inset-0 flex pointer-events-none">
          {visibleFrets.map((fret) => {
            if (!fretMarkers.includes(fret)) return null;
            const isDouble = doubleFretMarkers.includes(fret);
            const relativeIndex = fret - viewRange[0];
            const position = ((relativeIndex + 0.5) / visibleFrets.length) * 100;

            return (
              <div
                key={fret}
                className="absolute"
                style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
              >
                {isDouble ? (
                  <div className="flex flex-col gap-8 items-center h-full justify-center">
                    <div className="w-3 h-3 rounded-full bg-stone-300/80" />
                    <div className="w-3 h-3 rounded-full bg-stone-300/80" />
                  </div>
                ) : (
                  <div className="w-3 h-3 rounded-full bg-stone-300/80 absolute top-1/2 -translate-y-1/2" />
                )}
              </div>
            );
          })}
        </div>

        {/* Strings */}
        <div className="relative flex flex-col gap-3 py-4 px-8">
          {[0, 1, 2, 3, 4, 5].map((stringIndex) => (
            <div key={stringIndex} className="relative h-8">
              {/* String wire */}
              <div
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full"
                style={{
                  height: 2 + stringIndex * 0.5,
                  background: `linear-gradient(90deg, 
                    hsl(40, 30%, ${65 - stringIndex * 5}%) 0%, 
                    hsl(40, 40%, ${75 - stringIndex * 5}%) 50%,
                    hsl(40, 30%, ${65 - stringIndex * 5}%) 100%
                  )`,
                }}
              />

              {/* String label */}
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-xs font-mono text-amber-200/60">
                {stringNotes[stringIndex]}
              </div>

              {/* Fret positions */}
              <div className="absolute inset-0 flex">
                {visibleFrets.map((fret) => {
                  const key = `${stringIndex}-${fret}`;
                  const hasNote = noteMap.has(key);
                  const isCurrent = currentNoteSet.has(key);
                  const noteData = noteMap.get(key)?.[0];
                  const noteName = getNoteName(stringIndex, fret);

                  return (
                    <button
                      key={fret}
                      className="flex-1 flex items-center justify-center relative"
                      onClick={() => handleNotePress(stringIndex, fret)}
                    >
                      <AnimatePresence>
                        {(hasNote || isCurrent) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ 
                              scale: isCurrent ? [1, 1.2, 1] : 1,
                              boxShadow: isCurrent 
                                ? `0 0 20px ${fingerColors[noteData?.finger || 0]}`
                                : 'none'
                            }}
                            exit={{ scale: 0 }}
                            transition={{ 
                              duration: 0.2,
                              scale: isCurrent ? { repeat: Infinity, duration: 0.8 } : undefined
                            }}
                            className="absolute w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{
                              background: `radial-gradient(circle, 
                                ${fingerColors[noteData?.finger || 0]} 0%, 
                                ${fingerColors[noteData?.finger || 0].replace(')', ', 0.8)').replace('hsl', 'hsla')} 100%
                              )`,
                              color: '#fff',
                            }}
                          >
                            {showFingerNumbers && noteData?.finger ? (
                              noteData.finger
                            ) : (
                              noteName
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Fret numbers */}
        <div className="flex px-8 pt-2">
          {visibleFrets.map((fret) => (
            <div
              key={fret}
              className="flex-1 text-center text-xs text-amber-200/50 font-mono"
            >
              {fret}
            </div>
          ))}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="flex justify-center gap-2 mt-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="px-3 py-1 rounded-lg bg-muted text-sm"
          onClick={() => {
            setViewRange(([start, end]) => {
              const mid = (start + end) / 2;
              const newWidth = Math.min((end - start) + 4, 24);
              const newStart = Math.max(0, Math.floor(mid - newWidth / 2));
              return [newStart, Math.min(24, newStart + newWidth)];
            });
          }}
        >
          -
        </motion.button>
        <span className="text-sm text-muted-foreground px-2">
          Frets {viewRange[0]}-{viewRange[1]}
        </span>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="px-3 py-1 rounded-lg bg-muted text-sm"
          onClick={() => {
            setViewRange(([start, end]) => {
              const mid = (start + end) / 2;
              const newWidth = Math.max((end - start) - 2, 4);
              const newStart = Math.max(0, Math.floor(mid - newWidth / 2));
              return [newStart, Math.min(24, newStart + newWidth)];
            });
          }}
        >
          +
        </motion.button>
      </div>

      {/* Selected note info modal */}
      <AnimatePresence>
        {selectedNote && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 p-4 rounded-xl bg-card border shadow-xl"
          >
            <div className="text-center">
              <div className="text-2xl font-bold">
                {getNoteName(selectedNote.string, selectedNote.fret)}
              </div>
              <div className="text-sm text-muted-foreground">
                String {selectedNote.string + 1}, Fret {selectedNote.fret}
              </div>
              {selectedNote.finger && (
                <div className="text-xs mt-1" style={{ color: fingerColors[selectedNote.finger] }}>
                  Finger {selectedNote.finger}
                </div>
              )}
            </div>
            <button
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs"
              onClick={() => setSelectedNote(null)}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
