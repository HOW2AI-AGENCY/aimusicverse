/**
 * Multi-Track Timeline Component
 * DAW-style timeline with draggable/resizable clips
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { useStudioProjectStore, StudioTrack, StudioClip } from '@/stores/useStudioProjectStore';
import { TrackLaneRow } from './TrackLaneRow';
import { TimelineRuler } from './TimelineRuler';
import { Playhead } from './Playhead';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, ZoomIn, ZoomOut, Magnet } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface MultiTrackTimelineProps {
  onAddTrack: () => void;
  className?: string;
}

export function MultiTrackTimeline({ onAddTrack, className }: MultiTrackTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const {
    currentProject,
    currentTime,
    isPlaying,
    zoom,
    snapToGrid,
    selectedClipId,
    setCurrentTime,
    setZoom,
    setSnapToGrid,
    selectClip,
    moveClip,
  } = useStudioProjectStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragClipId, setDragClipId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const duration = currentProject?.duration || 180;
  const timelineWidth = duration * zoom;

  // Auto-scroll to follow playhead
  useEffect(() => {
    if (isPlaying && scrollRef.current) {
      const playheadPosition = currentTime * zoom;
      const scrollLeft = scrollRef.current.scrollLeft;
      const containerWidth = scrollRef.current.clientWidth;
      
      if (playheadPosition > scrollLeft + containerWidth - 100) {
        scrollRef.current.scrollLeft = playheadPosition - 100;
      }
    }
  }, [currentTime, zoom, isPlaying]);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + (scrollRef.current?.scrollLeft || 0);
    const newTime = Math.max(0, Math.min(duration, x / zoom));
    
    setCurrentTime(newTime);
    selectClip(null);
  }, [isDragging, zoom, duration, setCurrentTime, selectClip]);

  const handleClipDragStart = useCallback((clipId: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragClipId(clipId);
    selectClip(clipId);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragOffset({ x: clientX, y: clientY });
  }, [selectClip]);

  const handleClipDragEnd = useCallback((trackId: string, newStartTime: number) => {
    if (dragClipId && snapToGrid && currentProject) {
      const beatDuration = 60 / currentProject.bpm;
      const gridStep = beatDuration / 4;
      newStartTime = Math.round(newStartTime / gridStep) * gridStep;
    }
    
    if (dragClipId) {
      moveClip(dragClipId, trackId, Math.max(0, newStartTime));
    }
    
    setIsDragging(false);
    setDragClipId(null);
  }, [dragClipId, snapToGrid, currentProject, moveClip]);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64 bg-background/50 rounded-lg border border-border/30">
        <p className="text-muted-foreground">Нет открытого проекта</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col bg-background/80 rounded-lg border border-border/30 overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/30 bg-muted/30">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.max(10, zoom - 10))}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[40px] text-center">{zoom}px/s</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.min(200, zoom + 10))}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant={snapToGrid ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSnapToGrid(!snapToGrid)}
            className="h-8"
          >
            <Magnet className="h-4 w-4 mr-1" />
            {!isMobile && "Snap"}
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onAddTrack}
          className="h-8"
        >
          <Plus className="h-4 w-4 mr-1" />
          Дорожка
        </Button>
      </div>

      {/* Timeline Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-auto relative"
        style={{ minHeight: isMobile ? 200 : 300 }}
      >
        <div 
          ref={containerRef}
          className="relative"
          style={{ width: timelineWidth + 200, minWidth: '100%' }}
          onClick={handleTimelineClick}
        >
          {/* Timeline Ruler */}
          <TimelineRuler 
            duration={duration} 
            zoom={zoom} 
            bpm={currentProject.bpm}
          />

          {/* Tracks */}
          <div className="relative">
            {currentProject.tracks.map((track, index) => (
              <TrackLaneRow
                key={track.id}
                track={track}
                zoom={zoom}
                duration={duration}
                selectedClipId={selectedClipId}
                isDragging={isDragging && dragClipId !== null}
                onClipSelect={selectClip}
                onClipDragStart={handleClipDragStart}
                onClipDragEnd={handleClipDragEnd}
              />
            ))}
          </div>

          {/* Playhead */}
          <Playhead 
            currentTime={currentTime} 
            zoom={zoom}
            height={(currentProject.tracks.length * (isMobile ? 60 : 80)) + 40}
          />
        </div>
      </div>
    </div>
  );
}
