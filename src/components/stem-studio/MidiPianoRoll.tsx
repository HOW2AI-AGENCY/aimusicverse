import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PianoKeyboard } from './PianoKeyboard';
import type { MidiNote } from '@/hooks/useMidiVisualization';

interface MidiPianoRollProps {
  notes: MidiNote[];
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  selectedNotes: Set<string>;
  pixelsPerSecond?: number;
  noteHeight?: number;
  startNote?: number;
  endNote?: number;
  snapValue?: number; // in beats
  tempo?: number;
  readOnly?: boolean;
  onNoteSelect?: (noteId: string, addToSelection?: boolean) => void;
  onNoteMove?: (noteId: string, newTime: number, newPitch: number) => void;
  onNoteResize?: (noteId: string, newDuration: number) => void;
  onNoteDelete?: (noteId: string) => void;
  onNoteAdd?: (note: Omit<MidiNote, 'id'>) => void;
  onSeek?: (time: number) => void;
}

// Color palette for tracks
const TRACK_COLORS = [
  'hsl(var(--primary))',
  'hsl(262, 83%, 58%)', // purple
  'hsl(142, 71%, 45%)', // green
  'hsl(38, 92%, 50%)',  // orange
  'hsl(355, 78%, 56%)', // red
  'hsl(187, 92%, 45%)', // cyan
];

function getTrackColor(trackIndex: number): string {
  return TRACK_COLORS[trackIndex % TRACK_COLORS.length];
}

export const MidiPianoRoll = memo(function MidiPianoRoll({
  notes,
  duration,
  currentTime,
  isPlaying,
  selectedNotes,
  pixelsPerSecond = 100,
  noteHeight = 12,
  startNote = 24,
  endNote = 96,
  snapValue = 0.25,
  tempo = 120,
  readOnly = false,
  onNoteSelect,
  onNoteMove,
  onNoteResize,
  onNoteDelete,
  onNoteAdd,
  onSeek,
}: MidiPianoRollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize' | null>(null);
  const [dragNoteId, setDragNoteId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalNote, setOriginalNote] = useState<MidiNote | null>(null);

  const totalPitches = endNote - startNote + 1;
  const gridHeight = totalPitches * noteHeight;
  const gridWidth = Math.max(duration * pixelsPerSecond, 800);

  // Get active notes at current time
  const activeNotes = new Set(
    notes
      .filter(note => currentTime >= note.time && currentTime < note.time + note.duration)
      .map(note => note.pitch)
  );

  // Snap time to grid
  const snapTime = useCallback((time: number): number => {
    if (snapValue <= 0) return time;
    const beatDuration = 60 / tempo;
    const snapDuration = beatDuration * snapValue;
    return Math.round(time / snapDuration) * snapDuration;
  }, [snapValue, tempo]);

  // Convert screen position to note position
  const screenToNote = useCallback((x: number, y: number) => {
    const time = x / pixelsPerSecond;
    const pitch = endNote - Math.floor(y / noteHeight);
    return { time: snapTime(time), pitch: Math.max(startNote, Math.min(endNote, pitch)) };
  }, [pixelsPerSecond, noteHeight, endNote, startNote, snapTime]);

  // Handle note drag start
  const handleNoteMouseDown = useCallback((
    e: React.MouseEvent, 
    note: MidiNote, 
    type: 'move' | 'resize'
  ) => {
    if (readOnly) return;
    e.stopPropagation();
    
    setIsDragging(true);
    setDragType(type);
    setDragNoteId(note.id);
    setDragStart({ x: e.clientX, y: e.clientY });
    setOriginalNote({ ...note });
    
    if (!selectedNotes.has(note.id)) {
      onNoteSelect?.(note.id, e.shiftKey);
    }
  }, [readOnly, selectedNotes, onNoteSelect]);

  // Handle mouse move during drag
  useEffect(() => {
    if (!isDragging || !dragNoteId || !originalNote) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      if (dragType === 'move') {
        const deltaTime = deltaX / pixelsPerSecond;
        const deltaPitch = -Math.round(deltaY / noteHeight);
        const newTime = snapTime(Math.max(0, originalNote.time + deltaTime));
        const newPitch = Math.max(startNote, Math.min(endNote, originalNote.pitch + deltaPitch));
        onNoteMove?.(dragNoteId, newTime, newPitch);
      } else if (dragType === 'resize') {
        const deltaTime = deltaX / pixelsPerSecond;
        const newDuration = snapTime(Math.max(0.05, originalNote.duration + deltaTime));
        onNoteResize?.(dragNoteId, newDuration);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
      setDragNoteId(null);
      setOriginalNote(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragNoteId, originalNote, dragStart, dragType, pixelsPerSecond, noteHeight, snapTime, startNote, endNote, onNoteMove, onNoteResize]);

  // Handle double click to add note
  const handleGridDoubleClick = useCallback((e: React.MouseEvent) => {
    if (readOnly || !gridRef.current) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { time, pitch } = screenToNote(x, y);
    
    onNoteAdd?.({
      pitch,
      name: '',
      time,
      duration: (60 / tempo) * snapValue,
      velocity: 100,
      track: 0,
    });
  }, [readOnly, screenToNote, onNoteAdd, tempo, snapValue]);

  // Handle click to seek
  const handleGridClick = useCallback((e: React.MouseEvent) => {
    if (!gridRef.current || isDragging) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = x / pixelsPerSecond;
    onSeek?.(time);
  }, [pixelsPerSecond, onSeek, isDragging]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        selectedNotes.forEach(noteId => onNoteDelete?.(noteId));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [readOnly, selectedNotes, onNoteDelete]);

  // Auto-scroll to playhead during playback
  useEffect(() => {
    if (!isPlaying || !containerRef.current) return;
    
    const playheadX = currentTime * pixelsPerSecond;
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const scrollLeft = container.scrollLeft;
    
    if (playheadX > scrollLeft + containerWidth - 100 || playheadX < scrollLeft) {
      container.scrollTo({
        left: Math.max(0, playheadX - 100),
        behavior: 'smooth',
      });
    }
  }, [currentTime, isPlaying, pixelsPerSecond]);

  // Draw grid lines
  const gridLines = [];
  const beatDuration = 60 / tempo;
  const beatsCount = Math.ceil(duration / beatDuration) + 4;
  
  for (let i = 0; i <= beatsCount; i++) {
    const x = i * beatDuration * pixelsPerSecond;
    const isMeasure = i % 4 === 0;
    gridLines.push(
      <line
        key={`beat-${i}`}
        x1={x}
        y1={0}
        x2={x}
        y2={gridHeight}
        stroke="currentColor"
        strokeOpacity={isMeasure ? 0.3 : 0.1}
        strokeWidth={isMeasure ? 1 : 0.5}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border overflow-hidden">
      {/* Timeline */}
      <div className="flex h-6 border-b bg-muted/30">
        <div className="w-12 shrink-0" />
        <div 
          className="flex-1 overflow-hidden"
          style={{ width: gridWidth }}
        >
          <svg width={gridWidth} height={24} className="text-muted-foreground">
            {Array.from({ length: beatsCount }).map((_, i) => {
              const x = i * beatDuration * pixelsPerSecond;
              const isMeasure = i % 4 === 0;
              if (!isMeasure) return null;
              return (
                <text
                  key={i}
                  x={x + 4}
                  y={16}
                  fontSize={10}
                  fill="currentColor"
                >
                  {Math.floor(i / 4) + 1}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Piano keyboard */}
        <PianoKeyboard
          startNote={startNote}
          endNote={endNote}
          noteHeight={noteHeight}
          activeNotes={activeNotes}
        />

        {/* Grid and notes */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto relative"
        >
          <div
            ref={gridRef}
            className="relative"
            style={{ width: gridWidth, height: gridHeight }}
            onClick={handleGridClick}
            onDoubleClick={handleGridDoubleClick}
          >
            {/* Grid */}
            <svg 
              width={gridWidth} 
              height={gridHeight} 
              className="absolute inset-0 pointer-events-none text-border"
            >
              {gridLines}
              {/* Horizontal pitch lines */}
              {Array.from({ length: totalPitches }).map((_, i) => (
                <line
                  key={`pitch-${i}`}
                  x1={0}
                  y1={i * noteHeight}
                  x2={gridWidth}
                  y2={i * noteHeight}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                />
              ))}
            </svg>

            {/* Notes */}
            {notes.map(note => {
              const x = note.time * pixelsPerSecond;
              const y = (endNote - note.pitch) * noteHeight;
              const width = note.duration * pixelsPerSecond;
              const isSelected = selectedNotes.has(note.id);
              const color = getTrackColor(note.track);
              
              return (
                <motion.div
                  key={note.id}
                  className={cn(
                    "absolute rounded-sm cursor-pointer hover:brightness-110",
                    "border border-white/20",
                    isSelected && "ring-2 ring-white ring-offset-1 ring-offset-background"
                  )}
                  style={{
                    left: x,
                    top: y,
                    width: Math.max(width, 4),
                    height: noteHeight - 1,
                    backgroundColor: color,
                    opacity: note.velocity / 127,
                  }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: note.velocity / 127 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNoteSelect?.(note.id, e.shiftKey);
                  }}
                  onMouseDown={(e) => handleNoteMouseDown(e, note, 'move')}
                >
                  {/* Resize handle */}
                  {!readOnly && width > 20 && (
                    <div
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30"
                      onMouseDown={(e) => handleNoteMouseDown(e, note, 'resize')}
                    />
                  )}
                </motion.div>
              );
            })}

            {/* Playhead */}
            <motion.div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-10"
              style={{ left: currentTime * pixelsPerSecond }}
              animate={{ left: currentTime * pixelsPerSecond }}
              transition={{ duration: 0.05 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
