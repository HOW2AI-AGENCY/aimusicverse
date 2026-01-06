/**
 * InteractivePianoRoll - Enhanced piano roll with zoom, scroll, velocity colors, and mini-map
 */

import { memo, useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';
import { Music, ZoomIn, ZoomOut, Maximize2, RotateCcw, Keyboard, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from '@/lib/motion';

interface NoteInput {
  pitch?: number;
  midi?: number;
  time?: number;
  startTime?: number;
  start_time?: number;
  endTime?: number;
  end_time?: number;
  duration?: number;
  dur?: number;
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
  onSeek?: (time: number) => void;
  showKeys?: boolean;
  showMiniMap?: boolean;
  colorByVelocity?: boolean;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8];

// Velocity-based colors (from blue/soft to red/loud)
const getVelocityColor = (velocity: number, isBlackKey: boolean, isActive: boolean) => {
  const v = Math.max(0, Math.min(127, velocity)) / 127;
  
  if (isActive) {
    return 'hsl(var(--primary))';
  }
  
  // Gradient from cool (soft) to warm (loud)
  if (v < 0.33) {
    // Soft: blue-ish
    return isBlackKey ? 'hsl(210 70% 50% / 0.8)' : 'hsl(210 80% 60%)';
  } else if (v < 0.66) {
    // Medium: primary
    return isBlackKey ? 'hsl(var(--primary) / 0.75)' : 'hsl(var(--primary))';
  } else {
    // Loud: orange/red
    return isBlackKey ? 'hsl(25 90% 50% / 0.85)' : 'hsl(25 95% 55%)';
  }
};

export const InteractivePianoRoll = memo(function InteractivePianoRoll({ 
  notes, 
  duration, 
  height = 280,
  className,
  currentTime = 0,
  onNoteClick,
  onSeek,
  showKeys = true,
  showMiniMap = true,
  colorByVelocity = true,
}: InteractivePianoRollProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [showVelocity, setShowVelocity] = useState(colorByVelocity);
  const [hoveredNote, setHoveredNote] = useState<number | null>(null);

  // Process notes with normalization for different input formats
  const { minPitch, maxPitch, normalizedNotes, pitchRange } = useMemo(() => {
    if (notes.length === 0) {
      return { minPitch: 48, maxPitch: 72, normalizedNotes: [], pitchRange: 24 };
    }
    
    const processed = notes.map(n => {
      const pitch = n.pitch ?? n.midi ?? 60;
      const startTime = n.startTime ?? n.start_time ?? n.time ?? 0;
      const dur = n.duration ?? n.dur ?? 0.5;
      const endTime = n.endTime ?? n.end_time ?? (startTime + dur);
      return { 
        pitch, 
        startTime, 
        endTime, 
        duration: dur,
        velocity: n.velocity ?? 100,
        original: n,
      };
    }).filter(n => 
      Number.isFinite(n.pitch) && 
      Number.isFinite(n.startTime) && 
      Number.isFinite(n.endTime) &&
      n.endTime > n.startTime
    );

    if (processed.length === 0) {
      return { minPitch: 48, maxPitch: 72, normalizedNotes: [], pitchRange: 24 };
    }

    const pitches = processed.map(n => n.pitch);
    const min = Math.max(0, Math.min(...pitches) - 3);
    const max = Math.min(127, Math.max(...pitches) + 3);
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

  // Octave lines for grid
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
    const interval = duration > 180 ? 60 : duration > 60 ? 15 : duration > 30 ? 10 : 5;
    const markers: { time: number; label: string }[] = [];
    for (let t = 0; t <= duration; t += interval) {
      markers.push({ time: t, label: formatTime(t) });
    }
    return markers;
  }, [duration]);

  // Beat grid lines (assuming 4/4 at current BPM estimate)
  const beatLines = useMemo(() => {
    const estimatedBpm = 120;
    const beatDuration = 60 / estimatedBpm;
    const lines: number[] = [];
    for (let t = 0; t <= duration; t += beatDuration) {
      lines.push(t);
    }
    return lines;
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
    if (scrollContainerRef.current && duration > 0) {
      const keysWidth = showKeys ? 44 : 0;
      const containerWidth = scrollContainerRef.current.clientWidth - keysWidth;
      const idealZoom = containerWidth / (duration * 12);
      const clampedZoom = Math.max(0.25, Math.min(8, idealZoom));
      setZoom(clampedZoom);
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [duration, showKeys]);

  // Drag to scroll
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
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
    const walk = (x - startX) * 1.5;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  }, [isDragging, startX, scrollLeft]);

  // Click to seek
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const keysWidth = showKeys ? 44 : 0;
    const clickX = e.clientX - rect.left - keysWidth + (scrollContainerRef.current?.scrollLeft || 0);
    const contentWidth = duration * 12 * zoom;
    const time = (clickX / contentWidth) * duration;
    if (time >= 0 && time <= duration) {
      onSeek(time);
    }
  }, [onSeek, isDragging, duration, zoom, showKeys]);

  // Scroll to playhead
  useEffect(() => {
    if (currentTime > 0 && scrollContainerRef.current) {
      const pixelsPerSecond = 12 * zoom;
      const playheadX = currentTime * pixelsPerSecond;
      const containerWidth = scrollContainerRef.current.clientWidth;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      
      if (playheadX < currentScroll + 50 || playheadX > currentScroll + containerWidth - 80) {
        scrollContainerRef.current.scrollTo({
          left: playheadX - containerWidth / 3,
          behavior: 'smooth'
        });
      }
    }
  }, [currentTime, zoom]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleFitToScreen();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleFitToScreen]);

  const contentWidth = Math.max(300, duration * 12 * zoom);
  const noteHeight = Math.max(5, Math.min(14, (height - 80) / pitchRange));
  const rollHeight = height - 56; // Subtract toolbar height

  if (notes.length === 0) {
    return (
      <div 
        className={cn(
          "rounded-xl bg-gradient-to-b from-muted/20 to-muted/40 flex flex-col items-center justify-center gap-3",
          className
        )}
        style={{ height }}
      >
        <Music className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Ноты не обнаружены</p>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "relative rounded-xl bg-gradient-to-b from-background via-background to-muted/10 border overflow-hidden flex flex-col",
        className
      )}
      style={{ height }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b bg-muted/20 backdrop-blur-sm shrink-0 z-10">
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleZoomOut}
            disabled={zoom <= ZOOM_LEVELS[0]}
            title="Уменьшить (−)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-[10px] font-mono text-muted-foreground w-10 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleZoomIn}
            disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
            title="Увеличить (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowVelocity(!showVelocity)}
            title={showVelocity ? "Скрыть velocity" : "Показать velocity"}
          >
            {showVelocity ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleFitToScreen}
            title="Вписать в экран (0)"
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

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="font-medium tabular-nums">{normalizedNotes.length}</span>
          <span>нот</span>
          <span className="text-muted-foreground/60">·</span>
          <span className="tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Pitch ruler */}
        {showKeys && (
          <div className="w-11 shrink-0 bg-gradient-to-r from-muted/50 to-muted/20 border-r relative overflow-hidden">
            {/* Piano keys visualization */}
            {Array.from({ length: pitchRange + 1 }, (_, i) => {
              const pitch = minPitch + i;
              const isBlack = NOTE_NAMES[pitch % 12].includes('#');
              const isC = pitch % 12 === 0;
              return (
                <div
                  key={i}
                  className={cn(
                    "absolute left-0 right-0 border-b",
                    isBlack 
                      ? "bg-zinc-800/80 border-zinc-700" 
                      : "bg-white/90 border-zinc-200",
                    isC && "border-b-2 border-b-primary/30"
                  )}
                  style={{ 
                    bottom: `${(i / pitchRange) * 100}%`,
                    height: `${Math.max(2, 100 / pitchRange)}%`,
                  }}
                >
                  {isC && (
                    <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] font-mono font-medium text-zinc-600">
                      C{Math.floor(pitch / 12) - 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Scrollable piano roll */}
        <div 
          ref={scrollContainerRef}
          className={cn(
            "flex-1 overflow-x-auto overflow-y-hidden relative",
            isDragging ? "cursor-grabbing select-none" : "cursor-grab"
          )}
          onWheel={(e) => {
            if (!scrollContainerRef.current) return;
            // Shift+wheel for horizontal scroll, or vertical wheel scrolls horizontally
            if (e.shiftKey || Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
              e.preventDefault();
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
          onClick={handleCanvasClick}
        >
          <div 
            className="relative"
            style={{ width: contentWidth, height: rollHeight }}
          >
            {/* Beat grid (subtle) */}
            {beatLines.map((t, i) => (
              <div
                key={`beat-${i}`}
                className="absolute top-0 bottom-4 border-l border-muted/30"
                style={{ left: (t / duration) * contentWidth }}
              />
            ))}

            {/* Octave lines */}
            {octaveLines.map((line, i) => (
              <div
                key={`octave-${i}`}
                className="absolute left-0 right-0 border-t border-primary/15"
                style={{ bottom: `calc(${line.pos * 100}% + 16px)` }}
              />
            ))}

            {/* Time markers */}
            {timeMarkers.map((marker, i) => (
              <div
                key={`time-${i}`}
                className="absolute top-0 bottom-4 border-l border-muted-foreground/25"
                style={{ left: (marker.time / duration) * contentWidth }}
              >
                <span className="absolute bottom-0 -translate-x-1/2 text-[9px] font-mono text-muted-foreground/70 bg-background/90 px-0.5 rounded">
                  {marker.label}
                </span>
              </div>
            ))}

            {/* Playhead */}
            <AnimatePresence>
              {currentTime >= 0 && currentTime <= duration && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-0 bottom-4 w-0.5 bg-primary z-20 pointer-events-none"
                  style={{ 
                    left: (currentTime / duration) * contentWidth,
                    boxShadow: '0 0 12px 2px hsl(var(--primary) / 0.6)',
                  }}
                >
                  {/* Playhead head */}
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notes */}
            {normalizedNotes.map((note, i) => {
              const isBlackKey = NOTE_NAMES[note.pitch % 12].includes('#');
              const isPast = note.endTime < currentTime;
              const isActive = note.startTime <= currentTime && note.endTime >= currentTime;
              const isHovered = hoveredNote === i;
              const noteName = NOTE_NAMES[note.pitch % 12] + Math.floor(note.pitch / 12 - 1);
              
              const noteLeft = (note.startTime / duration) * contentWidth;
              const noteWidth = Math.max(4, ((note.endTime - note.startTime) / duration) * contentWidth);
              const noteBottom = note.normalizedPitch * (rollHeight - 20) + 16;
              
              const bgColor = showVelocity 
                ? getVelocityColor(note.velocity, isBlackKey, isActive)
                : isBlackKey 
                  ? 'hsl(var(--primary) / 0.7)' 
                  : 'hsl(var(--primary))';
              
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: isPast ? 0.4 : 1, 
                    scale: isActive ? 1.05 : 1,
                  }}
                  className={cn(
                    "absolute rounded-sm transition-shadow",
                    isActive && "ring-2 ring-white shadow-lg z-10",
                    isHovered && "ring-1 ring-white/50 z-10",
                    onNoteClick && "cursor-pointer"
                  )}
                  style={{
                    left: noteLeft,
                    width: noteWidth,
                    bottom: noteBottom,
                    height: noteHeight,
                    backgroundColor: bgColor,
                    boxShadow: isActive 
                      ? '0 0 16px hsl(var(--primary) / 0.5)' 
                      : isHovered 
                        ? '0 2px 8px rgba(0,0,0,0.3)' 
                        : 'none',
                  }}
                  onMouseEnter={() => setHoveredNote(i)}
                  onMouseLeave={() => setHoveredNote(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNoteClick?.(note.original, i);
                  }}
                >
                  {/* Velocity indicator bar */}
                  {showVelocity && noteWidth > 20 && (
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-black/20 rounded-b-sm"
                      style={{ height: `${100 - (note.velocity / 127) * 100}%` }}
                    />
                  )}
                  
                  {/* Note label on hover */}
                  {isHovered && noteWidth > 30 && (
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono text-white font-bold drop-shadow-lg">
                      {noteName}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mini-map overview */}
      {showMiniMap && normalizedNotes.length > 0 && contentWidth > 400 && (
        <div className="h-4 border-t bg-muted/30 relative overflow-hidden">
          {/* Visible region indicator */}
          <div 
            className="absolute top-0 bottom-0 bg-primary/20 border-x border-primary/40"
            style={{
              left: `${((scrollContainerRef.current?.scrollLeft || 0) / contentWidth) * 100}%`,
              width: `${((scrollContainerRef.current?.clientWidth || 200) / contentWidth) * 100}%`,
            }}
          />
          
          {/* Mini notes */}
          {normalizedNotes.map((note, i) => (
            <div
              key={i}
              className="absolute bg-primary/60"
              style={{
                left: `${(note.startTime / duration) * 100}%`,
                width: `${Math.max(1, ((note.endTime - note.startTime) / duration) * 100)}%`,
                bottom: `${note.normalizedPitch * 100}%`,
                height: '2px',
              }}
            />
          ))}
          
          {/* Mini playhead */}
          {currentTime > 0 && (
            <div 
              className="absolute top-0 bottom-0 w-px bg-primary"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            />
          )}
        </div>
      )}

      {/* Keyboard hint */}
      <div className="absolute bottom-5 right-2 flex items-center gap-1 text-[9px] text-muted-foreground/50 pointer-events-none">
        <Keyboard className="w-3 h-3" />
        <span>+/− зум · 0 вписать</span>
      </div>
    </div>
  );
});

export default InteractivePianoRoll;
