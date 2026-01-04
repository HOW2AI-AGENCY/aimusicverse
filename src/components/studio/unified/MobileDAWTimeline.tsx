/**
 * MobileDAWTimeline - Touch-optimized DAW Timeline
 * 
 * A mobile-first timeline component with:
 * - Horizontal scroll for long tracks
 * - Pinch-to-zoom gesture support
 * - Tap-to-seek functionality
 * - Mini waveform overview
 * - Touch-friendly track controls
 * 
 * @see ADR-011 for architecture decisions
 */

import { memo, useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from '@/lib/motion';
import { useGesture } from '@use-gesture/react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { StudioTrack } from '@/stores/useUnifiedStudioStore';
import { Volume2, VolumeX, Headphones } from 'lucide-react';

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
  className?: string;
}

// Track type colors
const TRACK_TYPE_COLORS: Record<string, string> = {
  main: 'bg-primary/20 border-primary',
  vocal: 'bg-pink-500/20 border-pink-500',
  instrumental: 'bg-violet-500/20 border-violet-500',
  drums: 'bg-orange-500/20 border-orange-500',
  bass: 'bg-blue-500/20 border-blue-500',
  other: 'bg-muted border-muted-foreground',
};

// Track type icons
const getTrackIcon = (type: string) => {
  switch (type) {
    case 'vocal': return '🎤';
    case 'instrumental': return '🎸';
    case 'drums': return '🥁';
    case 'bass': return '🎸';
    default: return '🎵';
  }
};

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
  className,
}: MobileDAWTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [scrollLeft, setScrollLeft] = useState(0);
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

  // Time markers
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
          {/* Time ruler */}
          <div className="h-6 border-b border-border relative">
            {timeMarkers.map(marker => (
              <div
                key={marker.time}
                className="absolute top-0 h-full flex flex-col items-center"
                style={{ left: `${marker.position}%` }}
              >
                <div className="h-2 w-px bg-border" />
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {formatTime(marker.time)}
                </span>
              </div>
            ))}
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
          <div className="space-y-1 p-2">
            {tracks.map(track => (
              <MobileTrackRow
                key={track.id}
                track={track}
                duration={duration}
                isSelected={selectedTrackId === track.id}
                onToggleMute={() => onToggleMute(track.id)}
                onToggleSolo={() => onToggleSolo(track.id)}
                onSelect={() => onTrackSelect?.(track.id)}
              />
            ))}
          </div>

          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
            style={{ left: `${progressPercent}%` }}
          >
            {/* Playhead head */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
});

// Individual track row
interface MobileTrackRowProps {
  track: StudioTrack;
  duration: number;
  isSelected: boolean;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onSelect: () => void;
}

const MobileTrackRow = memo(function MobileTrackRow({
  track,
  duration,
  isSelected,
  onToggleMute,
  onToggleSolo,
  onSelect,
}: MobileTrackRowProps) {
  const haptic = useHapticFeedback();
  const colorClass = TRACK_TYPE_COLORS[track.type] || TRACK_TYPE_COLORS.other;

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

  return (
    <motion.div
      className={cn(
        "flex items-center gap-2 h-14 rounded-lg border-l-4 px-3 transition-colors",
        colorClass,
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
    >
      {/* Track info */}
      <div className="flex items-center gap-2 min-w-[100px]">
        <span className="text-lg">{getTrackIcon(track.type)}</span>
        <span className="text-sm font-medium truncate max-w-[80px]">
          {track.name}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 ml-auto">
        {/* Mute */}
        <button
          className={cn(
            "w-8 h-8 rounded flex items-center justify-center transition-colors",
            track.muted 
              ? "bg-destructive/20 text-destructive" 
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
          onClick={handleMute}
        >
          {track.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Solo */}
        <button
          className={cn(
            "w-8 h-8 rounded flex items-center justify-center transition-colors",
            track.solo 
              ? "bg-amber-500/20 text-amber-500" 
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
          onClick={handleSolo}
        >
          <Headphones className="w-4 h-4" />
        </button>
      </div>

      {/* Waveform placeholder / clip visualization */}
      <div className="flex-1 h-8 bg-background/50 rounded overflow-hidden">
        {/* Simple waveform visualization */}
        <div 
          className="h-full flex items-center gap-px px-1"
          style={{ opacity: track.muted ? 0.3 : 1 }}
        >
          {Array.from({ length: 40 }).map((_, i) => {
            const height = 20 + Math.sin(i * 0.5) * 15 + Math.random() * 10;
            return (
              <div
                key={i}
                className="flex-1 bg-foreground/30 rounded-sm"
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
});

MobileDAWTimeline.displayName = 'MobileDAWTimeline';
MobileTrackRow.displayName = 'MobileTrackRow';
