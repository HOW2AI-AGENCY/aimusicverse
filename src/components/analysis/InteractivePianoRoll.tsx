/**
 * InteractivePianoRoll - Enhanced piano roll with zoom, scroll, and touch support
 */

import { memo, useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';
import { Music, ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NoteInput {
  pitch?: number;
  midi?: number;
  time?: number;
  startTime?: number;
  endTime?: number;
  duration?: number;
  velocity?: number;
  noteName?: string;
}

interface InteractivePianoRollProps {
  notes: NoteInput[];
  duration: number;
  height?: number;
  className?: string;
  currentTime?: number;
  onNoteClick?: (note: NoteInput, index: number) => void;
  /**
   * Show left pitch ruler (octave labels). When false, timeline/notes start at the very left edge.
   */
  showKeys?: boolean;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5];

export const InteractivePianoRoll = memo(function InteractivePianoRoll({ 
  notes, 
  duration, 
  height = 250,
  className,
  currentTime = 0,
  onNoteClick,
  showKeys = true,
}: InteractivePianoRollProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Process notes
  const { minPitch, maxPitch, normalizedNotes, pitchRange } = useMemo(() => {
    if (notes.length === 0) {
      return { minPitch: 48, maxPitch: 72, normalizedNotes: [], pitchRange: 24 };
    }
    
    const processed = notes.map(n => {
      const pitch = n.pitch ?? n.midi ?? 60;
      const startTime = n.startTime ?? n.time ?? 0;
      const endTime = n.endTime ?? (startTime + (n.duration ?? 0.5));
      return { 
        pitch, 
        startTime, 
        endTime, 
        velocity: n.velocity ?? 100,
        original: n,
      };
    });

    const pitches = processed.map(n => n.pitch);
    const min = Math.max(0, Math.min(...pitches) - 2);
    const max = Math.min(127, Math.max(...pitches) + 2);
    const range = max - min || 1;
    
    return { 
      minPitch: min, 
      maxPitch: max,
      pitchRange: range,
      normalizedNotes: processed.map(n => ({
        ...n,
        normalizedPitch: (n.pitch - min) / range,
      })),
    };
  }, [notes]);

  // Octave lines
  const octaveLines = useMemo(() => {
    const lines: { pitch: number; pos: number; label: string }[] = [];
    for (let pitch = minPitch; pitch <= maxPitch; pitch++) {
      if (pitch % 12 === 0) {
        lines.push({
          pitch,
          pos: (pitch - minPitch) / pitchRange,
          label: `C${Math.floor(pitch / 12) - 1}`
        });
      }
    }
    return lines;
  }, [minPitch, maxPitch, pitchRange]);

  // Time markers
  const timeMarkers = useMemo(() => {
    const interval = duration > 120 ? 30 : duration > 60 ? 15 : duration > 30 ? 10 : 5;
    const markers: { time: number; label: string }[] = [];
    for (let t = 0; t <= duration; t += interval) {
      markers.push({ time: t, label: formatTime(t) });
    }
    return markers;
  }, [duration]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    const currentIndex = ZOOM_LEVELS.findIndex(z => z >= zoom);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      setZoom(ZOOM_LEVELS[currentIndex + 1]);
    }
  }, [zoom]);

  const handleZoomOut = useCallback(() => {
    const currentIndex = ZOOM_LEVELS.findIndex(z => z >= zoom);
    if (currentIndex > 0) {
      setZoom(ZOOM_LEVELS[currentIndex - 1]);
    }
  }, [zoom]);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, []);

  const handleFitToScreen = useCallback(() => {
    // Calculate zoom to fit all notes
    if (scrollContainerRef.current && duration > 0) {
      const keysWidth = showKeys ? 40 : 0;
      const containerWidth = scrollContainerRef.current.clientWidth - keysWidth;
      const idealZoom = containerWidth / (duration * 10); // 10px per second base
      const clampedZoom = Math.max(0.5, Math.min(5, idealZoom));
      setZoom(clampedZoom);
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [duration, showKeys]);

  // Drag to scroll
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  }, [isDragging, startX, scrollLeft]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - (scrollContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  }, [isDragging, startX, scrollLeft]);

  // Scroll to playhead
  useEffect(() => {
    if (currentTime > 0 && scrollContainerRef.current) {
      const pixelsPerSecond = 10 * zoom;
      const playheadX = currentTime * pixelsPerSecond;
      const containerWidth = scrollContainerRef.current.clientWidth;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      
      if (playheadX < currentScroll || playheadX > currentScroll + containerWidth - 100) {
        scrollContainerRef.current.scrollLeft = playheadX - containerWidth / 2;
      }
    }
  }, [currentTime, zoom]);

  const contentWidth = duration * 10 * zoom; // 10px per second base * zoom
  const noteHeight = Math.max(4, Math.min(12, (height - 60) / pitchRange));

  if (notes.length === 0) {
    return (
      <div 
        className={cn(
          "rounded-lg bg-muted/30 flex flex-col items-center justify-center gap-2",
          className
        )}
        style={{ height }}
      >
        <Music className="w-8 h-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Ноты не обнаружены</p>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "relative rounded-lg bg-gradient-to-b from-background to-muted/20 border flex flex-col",
        className
      )}
      style={{ height }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b bg-muted/30 shrink-0">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleZoomOut}
            disabled={zoom <= ZOOM_LEVELS[0]}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs font-mono text-muted-foreground w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleZoomIn}
            disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleFitToScreen}
            title="Вписать в экран"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleResetZoom}
            title="Сбросить"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          {notes.length} нот · {formatTime(duration)}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Pitch ruler (optional) */}
        {showKeys && (
          <div className="w-9 shrink-0 bg-muted/40 border-r relative">
            {octaveLines.map((line, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 flex items-center justify-center"
                style={{ 
                  bottom: `${line.pos * 100}%`, 
                  transform: 'translateY(50%)',
                }}
              >
                <span className="text-[9px] font-mono text-muted-foreground bg-muted px-0.5 rounded">
                  {line.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Scrollable piano roll */}
        <div 
          ref={scrollContainerRef}
          className={cn(
            "flex-1 overflow-x-auto overflow-y-hidden relative",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          onWheel={(e) => {
            // Make vertical wheel scroll horizontally (like timeline/waveform scrubbing)
            if (!scrollContainerRef.current) return;
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
              scrollContainerRef.current.scrollLeft += e.deltaY;
            }
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          <div 
            className="relative h-full"
            style={{ width: Math.max(contentWidth, 300) }}
          >
            {/* Grid - octave lines */}
            {octaveLines.map((line, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-primary/10"
                style={{ bottom: `calc(${line.pos * 100}% + 16px)` }}
              />
            ))}

            {/* Grid - time lines */}
            {timeMarkers.map((marker, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-4 border-l border-muted-foreground/20"
                style={{ left: (marker.time / duration) * contentWidth }}
              >
                <span className="absolute bottom-0 -translate-x-1/2 text-[8px] font-mono text-muted-foreground bg-background/80 px-0.5">
                  {marker.label}
                </span>
              </div>
            ))}

            {/* Playhead */}
            {currentTime > 0 && currentTime < duration && (
              <div 
                className="absolute top-0 bottom-4 w-0.5 bg-primary shadow-[0_0_8px_hsl(var(--primary))] z-20"
                style={{ left: (currentTime / duration) * contentWidth }}
              />
            )}

            {/* Notes */}
            {normalizedNotes.map((note, i) => {
              const isBlackKey = NOTE_NAMES[note.pitch % 12].includes('#');
              const isPast = note.endTime < currentTime;
              const isActive = note.startTime <= currentTime && note.endTime >= currentTime;
              const noteName = NOTE_NAMES[note.pitch % 12] + Math.floor(note.pitch / 12 - 1);
              
              const noteLeft = (note.startTime / duration) * contentWidth;
              const noteWidth = Math.max(3, ((note.endTime - note.startTime) / duration) * contentWidth);
              const noteBottom = note.normalizedPitch * (height - 60) + 16;
              
              return (
                <div
                  key={i}
                  className={cn(
                    "absolute rounded-[2px] transition-all duration-75",
                    isBlackKey 
                      ? "bg-primary/70 hover:bg-primary/90" 
                      : "bg-primary hover:brightness-110",
                    isPast && "opacity-50",
                    isActive && "ring-1 ring-white shadow-lg shadow-primary/50 brightness-125",
                    onNoteClick && "cursor-pointer"
                  )}
                  style={{
                    left: noteLeft,
                    width: noteWidth,
                    bottom: noteBottom,
                    height: noteHeight,
                    opacity: isPast ? 0.5 : (0.5 + (note.velocity / 127) * 0.5),
                  }}
                  title={`${noteName} (${formatTime(note.startTime)} - ${formatTime(note.endTime)})`}
                  onClick={() => onNoteClick?.(note.original, i)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      {contentWidth > 300 && zoom > 0.5 && (
        <div className="absolute bottom-1 right-2 text-[9px] text-muted-foreground/60 pointer-events-none">
          ← перетащите для прокрутки →
        </div>
      )}
    </div>
  );
});

export default InteractivePianoRoll;
