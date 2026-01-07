/**
 * MobileDAWTimeline - Touch-optimized DAW Timeline
 * 
 * A mobile-first timeline component with:
 * - Horizontal scroll for long tracks
 * - Pinch-to-zoom gesture support
 * - Tap-to-seek functionality
 * - Real waveform visualization
 * - Touch-friendly track controls
 * - Vocals always at the top
 * 
 * @see ADR-011 for architecture decisions
 */

import { memo, useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from '@/lib/motion';
import { useGesture } from '@use-gesture/react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { snapToGrid, type SnapOptions } from '@/lib/audio/beatSnap';
import type { StudioTrack } from '@/stores/useUnifiedStudioStore';
import { Volume2, VolumeX, Headphones, Mic2, Music, Drum, Guitar, Piano, Waves } from 'lucide-react';
import { UnifiedWaveform, type StemType } from '@/components/waveform/UnifiedWaveform';

interface SectionMarker {
  label: string;
  type: string;
  startTime: number;
  endTime: number;
  isReplaced?: boolean;
}

interface MobileDAWTimelineProps {
  tracks: StudioTrack[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onToggleMute: (trackId: string) => void;
  onToggleSolo: (trackId: string) => void;
  onTrackSelect?: (trackId: string) => void;
  selectedTrackId?: string | null;
  /** Section markers (verse, chorus, bridge, etc.) */
  sections?: SectionMarker[];
  /** Callback when section is clicked */
  onSectionClick?: (section: SectionMarker, index: number) => void;
  /** BPM for beat markers (default: 120) */
  bpm?: number;
  className?: string;
}

// Track type colors with waveform color
const TRACK_TYPE_CONFIG: Record<string, { bg: string; border: string; waveColor: string; icon: React.ComponentType<any> }> = {
  main: { bg: 'bg-primary/20', border: 'border-primary', waveColor: 'blue', icon: Music },
  vocal: { bg: 'bg-pink-500/20', border: 'border-pink-500', waveColor: 'pink', icon: Mic2 },
  vocals: { bg: 'bg-pink-500/20', border: 'border-pink-500', waveColor: 'pink', icon: Mic2 },
  instrumental: { bg: 'bg-violet-500/20', border: 'border-violet-500', waveColor: 'violet', icon: Guitar },
  drums: { bg: 'bg-orange-500/20', border: 'border-orange-500', waveColor: 'orange', icon: Drum },
  bass: { bg: 'bg-emerald-500/20', border: 'border-emerald-500', waveColor: 'emerald', icon: Waves },
  guitar: { bg: 'bg-amber-500/20', border: 'border-amber-500', waveColor: 'amber', icon: Guitar },
  piano: { bg: 'bg-purple-500/20', border: 'border-purple-500', waveColor: 'purple', icon: Piano },
  keyboard: { bg: 'bg-purple-500/20', border: 'border-purple-500', waveColor: 'purple', icon: Piano },
  other: { bg: 'bg-muted', border: 'border-muted-foreground', waveColor: 'gray', icon: Music },
};

// Get track config with fallback
const getTrackConfig = (type: string) => 
  TRACK_TYPE_CONFIG[type.toLowerCase()] || TRACK_TYPE_CONFIG.other;

// Section type colors
const SECTION_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  verse: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400' },
  chorus: { bg: 'bg-pink-500/20', border: 'border-pink-500/40', text: 'text-pink-400' },
  bridge: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400' },
  intro: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400' },
  outro: { bg: 'bg-violet-500/20', border: 'border-violet-500/40', text: 'text-violet-400' },
  pre_chorus: { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400' },
  instrumental: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', text: 'text-cyan-400' },
};

export const MobileDAWTimeline = memo(function MobileDAWTimeline({
  tracks,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  onToggleMute,
  onToggleSolo,
  onTrackSelect,
  selectedTrackId,
  sections = [],
  onSectionClick,
  bpm = 120,
  className,
}: MobileDAWTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const haptic = useHapticFeedback();

  // Calculate timeline width based on zoom
  const timelineWidth = useMemo(() => {
    const baseWidth = 300; // Minimum width
    return Math.max(baseWidth, duration * zoom * 10);
  }, [duration, zoom]);

  // Progress percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle tap to seek
  const handleTimelineClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left + scrollLeft;
    const percent = x / timelineWidth;
    const newTime = Math.max(0, Math.min(duration, percent * duration));
    
    haptic.tap();
    onSeek(newTime);
  }, [timelineWidth, duration, scrollLeft, onSeek, haptic]);

  // Gesture handling for pinch-zoom and pan
  const bind = useGesture({
    onPinch: ({ offset: [scale] }) => {
      setZoom(Math.max(0.5, Math.min(3, scale)));
    },
    onDrag: ({ delta: [dx], pinching }) => {
      if (pinching) return;
      setScrollLeft(prev => Math.max(0, prev - dx));
    },
  }, {
    pinch: {
      scaleBounds: { min: 0.5, max: 3 },
    },
  });

  // BPM-based markers (beats and bars)
  const bpmMarkers = useMemo(() => {
    const beatDuration = 60 / bpm;
    const barDuration = beatDuration * 4;
    const markers: { time: number; position: number; isBeat: boolean; isBar: boolean; label: string }[] = [];
    
    // Show bars at low zoom, beats at high zoom
    const showBeats = zoom >= 1.5;
    const interval = showBeats ? beatDuration : barDuration;
    
    for (let t = 0; t <= duration; t += interval) {
      const barNum = Math.floor(t / barDuration) + 1;
      const beatInBar = Math.floor((t % barDuration) / beatDuration) + 1;
      const isBar = beatInBar === 1;
      
      markers.push({
        time: t,
        position: duration > 0 ? (t / duration) * 100 : 0,
        isBeat: !isBar && showBeats,
        isBar,
        label: isBar ? `${barNum}` : '',
      });
    }
    return markers;
  }, [duration, zoom, bpm]);

  // Time markers (seconds)
  const timeMarkers = useMemo(() => {
    const interval = zoom < 1 ? 30 : zoom < 2 ? 15 : 10; // seconds
    const markers = [];
    for (let t = 0; t <= duration; t += interval) {
      markers.push({
        time: t,
        position: (t / duration) * 100,
      });
    }
    return markers;
  }, [duration, zoom]);

  // Draggable playhead handlers
  const handlePlayheadDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingPlayhead(true);
    haptic.select();
  }, [haptic]);

  const handlePlayheadDrag = useCallback((e: TouchEvent | MouseEvent) => {
    if (!isDraggingPlayhead || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left + scrollLeft;
    const percent = x / timelineWidth;
    const newTime = Math.max(0, Math.min(duration, percent * duration));

    // Snap to grid if BPM is available (T065)
    const snapOptions: SnapOptions = {
      bpm: bpm || null,
      snapDivision: 4, // Quarter note snap
      timeSignature: 4,
    };

    const snapped = snapToGrid(newTime, snapOptions);
    onSeek(snapped.snappedTime);
  }, [isDraggingPlayhead, timelineWidth, duration, scrollLeft, onSeek, bpm]);

  const handlePlayheadDragEnd = useCallback(() => {
    if (isDraggingPlayhead) {
      setIsDraggingPlayhead(false);
      haptic.tap();
    }
  }, [isDraggingPlayhead, haptic]);

  // Global listeners for playhead drag
  useEffect(() => {
    if (!isDraggingPlayhead) return;
    
    const handleMove = (e: TouchEvent | MouseEvent) => handlePlayheadDrag(e);
    const handleEnd = () => handlePlayheadDragEnd();
    
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('mouseup', handleEnd);
    
    return () => {
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [isDraggingPlayhead, handlePlayheadDrag, handlePlayheadDragEnd]);

  // Auto-scroll to follow playhead when playing
  useEffect(() => {
    if (!isPlaying || !containerRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    const playheadPosition = (currentTime / duration) * timelineWidth;
    
    // If playhead is near the right edge, scroll to follow
    if (playheadPosition > scrollLeft + containerWidth * 0.8) {
      setScrollLeft(playheadPosition - containerWidth * 0.2);
    }
  }, [currentTime, isPlaying, duration, timelineWidth, scrollLeft]);

  return (
    <div className={cn("flex flex-col bg-card rounded-lg overflow-hidden", className)}>
      {/* Mini overview bar */}
      <div className="h-8 bg-muted/50 relative border-b border-border">
        {/* Progress indicator */}
        <div 
          className="absolute top-0 left-0 h-full bg-primary/30"
          style={{ width: `${progressPercent}%` }}
        />
        
        {/* Time display */}
        <div className="absolute inset-0 flex items-center justify-between px-3 text-xs text-muted-foreground font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        
        {/* Playhead indicator */}
        <div 
          className="absolute top-0 h-full w-0.5 bg-primary"
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      {/* Timeline area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden touch-pan-x"
        {...bind()}
      >
        <div 
          ref={timelineRef}
          className="relative min-h-[200px]"
          style={{ width: timelineWidth }}
          onClick={handleTimelineClick}
        >
          {/* BPM indicator + Time ruler */}
          <div className="h-8 border-b border-border relative bg-muted/30">
            {/* BPM badge */}
            <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-medium text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded">
              {bpm} BPM
            </div>
            
            {/* Beat/Bar markers */}
            {bpmMarkers.map((marker, idx) => (
              <div
                key={idx}
                className="absolute top-0 h-full flex flex-col items-center justify-end"
                style={{ left: `${marker.position}%` }}
              >
                <div className={cn(
                  "w-px",
                  marker.isBar ? "h-4 bg-primary/60" : "h-2 bg-border/50"
                )} />
                {marker.isBar && marker.label && (
                  <span className="absolute top-0.5 text-[9px] font-mono text-primary/80 -translate-x-1/2">
                    {marker.label}
                  </span>
                )}
              </div>
            ))}
            
            {/* Time overlay (seconds) */}
            <div className="absolute bottom-0 left-0 right-0 h-3 pointer-events-none">
              {timeMarkers.map(marker => (
                <span
                  key={marker.time}
                  className="absolute text-[8px] text-muted-foreground/60 -translate-x-1/2"
                  style={{ left: `${marker.position}%` }}
                >
                  {formatTime(marker.time)}
                </span>
              ))}
            </div>
          </div>

          {/* Section markers overlay */}
          {sections.length > 0 && (
            <div className="h-7 border-b border-border/50 relative flex items-stretch">
              {sections.map((section, index) => {
                const leftPercent = (section.startTime / duration) * 100;
                const widthPercent = ((section.endTime - section.startTime) / duration) * 100;
                const colors = SECTION_COLORS[section.type] || SECTION_COLORS.verse;
                
                return (
                  <button
                    key={`${section.type}-${index}`}
                    className={cn(
                      "absolute top-0.5 bottom-0.5 rounded border transition-all",
                      "flex items-center justify-center overflow-hidden",
                      "hover:scale-[1.02] active:scale-[0.98]",
                      colors.bg,
                      colors.border,
                      section.isReplaced && "ring-1 ring-primary"
                    )}
                    style={{ 
                      left: `${leftPercent}%`, 
                      width: `${Math.max(widthPercent, 3)}%` 
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic.select();
                      onSectionClick?.(section, index);
                    }}
                  >
                    <span className={cn(
                      "text-[9px] font-medium truncate px-1",
                      colors.text
                    )}>
                      {section.label}
                    </span>
                    {section.isReplaced && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tracks */}
          <div className="space-y-1.5 p-2">
            {tracks.map(track => (
              <MobileTrackRow
                key={track.id}
                track={track}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                isSelected={selectedTrackId === track.id}
                onToggleMute={() => onToggleMute(track.id)}
                onToggleSolo={() => onToggleSolo(track.id)}
                onSelect={() => onTrackSelect?.(track.id)}
                onSeek={onSeek}
              />
            ))}
          </div>

          {/* Draggable Playhead */}
          <div 
            ref={playheadRef}
            className={cn(
              "absolute top-0 bottom-0 z-20 cursor-grab touch-none",
              isDraggingPlayhead && "cursor-grabbing"
            )}
            style={{ left: `calc(${progressPercent}% - 8px)`, width: '16px' }}
            onMouseDown={handlePlayheadDragStart}
            onTouchStart={handlePlayheadDragStart}
          >
            {/* Playhead line */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-primary" />
            
            {/* Playhead handle (top) */}
            <div className={cn(
              "absolute left-1/2 -translate-x-1/2 -top-1 w-4 h-4 rounded-full transition-transform",
              "bg-primary shadow-lg border-2 border-background",
              isDraggingPlayhead && "scale-125"
            )} />
            
            {/* Playhead handle (bottom grab area) */}
            <div className={cn(
              "absolute left-1/2 -translate-x-1/2 bottom-0 w-3 h-3",
              "bg-primary/80 rounded-sm"
            )} />
          </div>
        </div>
      </div>
    </div>
  );
});

// Individual track row with real waveform
interface MobileTrackRowProps {
  track: StudioTrack;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isSelected: boolean;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onSelect: () => void;
  onSeek: (time: number) => void;
}

const MobileTrackRow = memo(function MobileTrackRow({
  track,
  currentTime,
  duration,
  isPlaying,
  isSelected,
  onToggleMute,
  onToggleSolo,
  onSelect,
  onSeek,
}: MobileTrackRowProps) {
  const haptic = useHapticFeedback();
  const config = getTrackConfig(track.type);
  const Icon = config.icon;

  const handleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.tap();
    onToggleMute();
  }, [onToggleMute, haptic]);

  const handleSolo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.tap();
    onToggleSolo();
  }, [onToggleSolo, haptic]);

  // Calculate effective muted state (muted or not solo when others are soloed)
  const hasSoloTrack = false; // Would need to be passed from parent
  const effectiveMuted = track.muted || (hasSoloTrack && !track.solo);

  return (
    <motion.div
      className={cn(
        "flex flex-col gap-1 rounded-lg border-l-4 p-2 transition-colors touch-manipulation",
        config.bg,
        config.border,
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2">
        {/* Track icon & name - more visible */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={cn(
            "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
            config.bg, "border", config.border
          )}>
            <Icon className="w-4 h-4 text-foreground" />
          </div>
          <span className="text-sm font-medium truncate text-foreground">
            {track.name}
          </span>
        </div>

        {/* Controls - more visible */}
        <div className="flex items-center gap-1.5">
          {/* Mute */}
          <button
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors touch-manipulation",
              "border",
              track.muted 
                ? "bg-destructive/20 border-destructive/50 text-destructive" 
                : "bg-background/80 border-border/50 text-foreground/70 active:bg-muted"
            )}
            onClick={handleMute}
            aria-label={track.muted ? 'Unmute' : 'Mute'}
          >
            {track.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Solo */}
          <button
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors touch-manipulation",
              "border",
              track.solo 
                ? "bg-amber-500/20 border-amber-500/50 text-amber-400" 
                : "bg-background/80 border-border/50 text-foreground/70 active:bg-muted"
            )}
            onClick={handleSolo}
            aria-label={track.solo ? 'Unsolo' : 'Solo'}
          >
            <Headphones className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real waveform visualization */}
      <div className="h-10 bg-background/30 rounded overflow-hidden">
        {track.audioUrl ? (
          <UnifiedWaveform
            audioUrl={track.audioUrl}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            isMuted={effectiveMuted}
            stemType={config.waveColor as StemType}
            mode="stem"
            height={40}
            onSeek={onSeek}
          />
        ) : (
          // Fallback placeholder for tracks without audio
          <div 
            className="h-full flex items-center gap-px px-1"
            style={{ opacity: effectiveMuted ? 0.3 : 1 }}
          >
            {Array.from({ length: 30 }).map((_, i) => {
              const height = 20 + Math.sin(i * 0.5) * 15 + Math.random() * 10;
              return (
                <div
                  key={i}
                  className="flex-1 bg-foreground/20 rounded-sm"
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
});

MobileDAWTimeline.displayName = 'MobileDAWTimeline';
MobileTrackRow.displayName = 'MobileTrackRow';
