/**
 * Track Lanes Panel
 * Multi-track timeline view with waveforms and clips
 */

import { memo, useRef, useCallback, useState, useEffect } from 'react';
import { useUnifiedStudioStore, StudioTrack, StudioClip, TRACK_COLORS } from '@/stores/useUnifiedStudioStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  Volume2, 
  VolumeX, 
  Headphones,
  Plus,
  Trash2,
  GripVertical,
  ZoomIn,
  ZoomOut,
  Magnet,
} from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface TrackLanesPanelProps {
  className?: string;
  onAddTrack?: () => void;
}

export const TrackLanesPanel = memo(function TrackLanesPanel({
  className,
  onAddTrack,
}: TrackLanesPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const {
    project,
    currentTime,
    isPlaying,
    zoom,
    snapToGrid,
    selectedTrackId,
    selectedClipId,
    setZoom,
    setSnapToGrid,
    selectTrack,
    selectClip,
    seek,
  } = useUnifiedStudioStore();

  const duration = project?.durationSeconds || 180;
  const timelineWidth = duration * zoom;
  const trackHeight = isMobile ? 64 : 80;

  // Handle timeline click to seek
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = x / zoom;
    seek(Math.max(0, Math.min(duration, time)));
  }, [zoom, duration, seek]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(Math.min(200, zoom + 10));
  }, [zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(Math.max(10, zoom - 10));
  }, [zoom, setZoom]);

  if (!project) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        Нет открытого проекта
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/50 bg-card/30">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddTrack}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Дорожка</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={snapToGrid ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setSnapToGrid(!snapToGrid)}
            title="Привязка к сетке"
          >
            <Magnet className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={handleZoomOut}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-mono px-2 min-w-[40px] text-center">
              {Math.round(zoom)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={handleZoomIn}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers */}
        <div className="w-48 flex-shrink-0 border-r border-border/50 bg-card/20">
          {/* Timeline Ruler Header */}
          <div className="h-8 border-b border-border/50 bg-muted/30" />
          
          {/* Track Headers */}
          {project.tracks.map((track) => (
            <TrackHeader
              key={track.id}
              track={track}
              height={trackHeight}
              isSelected={selectedTrackId === track.id}
              onSelect={() => selectTrack(track.id)}
            />
          ))}
        </div>

        {/* Scrollable Timeline */}
        <ScrollArea className="flex-1">
          <div 
            ref={containerRef}
            className="relative"
            style={{ width: timelineWidth, minHeight: '100%' }}
            onClick={handleTimelineClick}
          >
            {/* Timeline Ruler */}
            <TimelineRuler duration={duration} zoom={zoom} />

            {/* Track Lanes */}
            {project.tracks.map((track, index) => (
              <TrackLane
                key={track.id}
                track={track}
                height={trackHeight}
                zoom={zoom}
                isSelected={selectedTrackId === track.id}
                selectedClipId={selectedClipId}
                onSelectClip={selectClip}
              />
            ))}

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
              style={{ left: currentTime * zoom }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45" />
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
});

// ============ Track Header ============

interface TrackHeaderProps {
  track: StudioTrack;
  height: number;
  isSelected: boolean;
  onSelect: () => void;
}

const TrackHeader = memo(function TrackHeader({
  track,
  height,
  isSelected,
  onSelect,
}: TrackHeaderProps) {
  const {
    setTrackVolume,
    toggleTrackMute,
    toggleTrackSolo,
    removeTrack,
  } = useUnifiedStudioStore();

  return (
    <div
      className={cn(
        'flex flex-col gap-1 px-2 py-1 border-b border-border/30 cursor-pointer transition-colors',
        isSelected && 'bg-accent/20',
      )}
      style={{ height }}
      onClick={onSelect}
    >
      {/* Track Name */}
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: track.color }}
        />
        <span className="text-sm font-medium truncate flex-1">{track.name}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            removeTrack(track.id);
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant={track.muted ? 'destructive' : 'ghost'}
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            toggleTrackMute(track.id);
          }}
        >
          {track.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
        </Button>

        <Button
          variant={track.solo ? 'secondary' : 'ghost'}
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            toggleTrackSolo(track.id);
          }}
        >
          <Headphones className="h-3 w-3" />
        </Button>

        <Slider
          value={[track.volume]}
          max={1}
          step={0.01}
          className="flex-1 ml-1"
          onValueChange={(value) => setTrackVolume(track.id, value[0])}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
});

// ============ Track Lane ============

interface TrackLaneProps {
  track: StudioTrack;
  height: number;
  zoom: number;
  isSelected: boolean;
  selectedClipId: string | null;
  onSelectClip: (clipId: string | null) => void;
}

const TrackLane = memo(function TrackLane({
  track,
  height,
  zoom,
  isSelected,
  selectedClipId,
  onSelectClip,
}: TrackLaneProps) {
  return (
    <div
      className={cn(
        'relative border-b border-border/30',
        isSelected && 'bg-accent/10',
        track.muted && 'opacity-50',
      )}
      style={{ height }}
    >
      {/* Clips */}
      {track.clips.map((clip) => (
        <ClipBlock
          key={clip.id}
          clip={clip}
          trackColor={track.color}
          zoom={zoom}
          isSelected={selectedClipId === clip.id}
          onSelect={() => onSelectClip(clip.id)}
        />
      ))}
    </div>
  );
});

// ============ Clip Block ============

interface ClipBlockProps {
  clip: StudioClip;
  trackColor: string;
  zoom: number;
  isSelected: boolean;
  onSelect: () => void;
}

const ClipBlock = memo(function ClipBlock({
  clip,
  trackColor,
  zoom,
  isSelected,
  onSelect,
}: ClipBlockProps) {
  const effectiveDuration = clip.duration - clip.trimStart - clip.trimEnd;
  const width = effectiveDuration * zoom;
  const left = (clip.startTime + clip.trimStart) * zoom;

  return (
    <div
      className={cn(
        'absolute top-1 bottom-1 rounded-md cursor-pointer transition-all overflow-hidden',
        isSelected && 'ring-2 ring-primary ring-offset-1',
      )}
      style={{
        left,
        width,
        backgroundColor: `${trackColor}40`,
        borderLeft: `3px solid ${trackColor}`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Clip Name */}
      <div className="absolute inset-x-0 top-0 px-2 py-0.5 text-xs font-medium truncate bg-gradient-to-b from-black/20 to-transparent">
        {clip.name}
      </div>

      {/* Waveform Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <div className="flex items-end gap-px h-full w-full px-1 py-4">
          {Array.from({ length: Math.min(50, Math.floor(width / 4)) }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-current rounded-full"
              style={{ height: `${20 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </div>

      {/* Fade indicators */}
      {clip.fadeIn > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-background/50 to-transparent"
          style={{ width: clip.fadeIn * zoom }}
        />
      )}
      {clip.fadeOut > 0 && (
        <div
          className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-background/50 to-transparent"
          style={{ width: clip.fadeOut * zoom }}
        />
      )}
    </div>
  );
});

// ============ Timeline Ruler ============

interface TimelineRulerProps {
  duration: number;
  zoom: number;
}

const TimelineRuler = memo(function TimelineRuler({
  duration,
  zoom,
}: TimelineRulerProps) {
  const markers: { time: number; label: string; major: boolean }[] = [];
  
  // Calculate marker interval based on zoom
  let interval = 1;
  if (zoom < 20) interval = 10;
  else if (zoom < 40) interval = 5;
  else if (zoom >= 100) interval = 0.5;

  for (let t = 0; t <= duration; t += interval) {
    const isMajor = t % (interval * 5) === 0 || interval >= 5;
    markers.push({
      time: t,
      label: formatRulerTime(t),
      major: isMajor,
    });
  }

  return (
    <div className="h-8 border-b border-border/50 bg-muted/30 relative">
      {markers.map(({ time, label, major }) => (
        <div
          key={time}
          className="absolute top-0 h-full flex flex-col items-center"
          style={{ left: time * zoom }}
        >
          <div className={cn(
            'w-px bg-border',
            major ? 'h-full' : 'h-2',
          )} />
          {major && (
            <span className="text-[10px] text-muted-foreground absolute top-2">
              {label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
});

function formatRulerTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
