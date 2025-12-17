/**
 * Track Lane Row - Single track with clips
 */

import { useCallback, useRef, useState } from 'react';
import { StudioTrack, StudioClip, useStudioProjectStore } from '@/stores/useStudioProjectStore';
import { AudioClipBlock } from './AudioClipBlock';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Headphones, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface TrackLaneRowProps {
  track: StudioTrack;
  zoom: number;
  duration: number;
  selectedClipId: string | null;
  isDragging: boolean;
  onClipSelect: (clipId: string | null) => void;
  onClipDragStart: (clipId: string, e: React.MouseEvent | React.TouchEvent) => void;
  onClipDragEnd: (trackId: string, newStartTime: number) => void;
}

export function TrackLaneRow({
  track,
  zoom,
  duration,
  selectedClipId,
  isDragging,
  onClipSelect,
  onClipDragStart,
  onClipDragEnd,
}: TrackLaneRowProps) {
  const laneRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const {
    toggleTrackMute,
    toggleTrackSolo,
    setTrackVolume,
    removeTrack,
    currentProject,
  } = useStudioProjectStore();

  const trackHeight = isMobile ? 60 : 80;
  const controlsWidth = isMobile ? 100 : 140;

  const hasSolo = currentProject?.tracks.some(t => t.solo);
  const isEffectivelyMuted = track.muted || (hasSolo && !track.solo);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!laneRef.current) return;
    
    const rect = laneRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newStartTime = x / zoom;
    
    onClipDragEnd(track.id, newStartTime);
  }, [zoom, track.id, onClipDragEnd]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div 
      className={cn(
        "flex border-b border-border/20 transition-colors",
        isDragging && "bg-primary/5"
      )}
      style={{ height: trackHeight }}
    >
      {/* Track Controls */}
      <div 
        className="flex-shrink-0 flex items-center gap-1 px-2 bg-muted/30 border-r border-border/30"
        style={{ width: controlsWidth }}
      >
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <span 
            className="text-xs font-medium truncate"
            style={{ color: track.color }}
          >
            {track.name}
          </span>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6",
                track.muted && "bg-destructive/20 text-destructive"
              )}
              onClick={() => toggleTrackMute(track.id)}
            >
              {track.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6",
                track.solo && "bg-yellow-500/20 text-yellow-500"
              )}
              onClick={() => toggleTrackSolo(track.id)}
            >
              <Headphones className="h-3 w-3" />
            </Button>
            
            {track.type !== 'main' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => removeTrack(track.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        {!isMobile && (
          <div className="w-16">
            <Slider
              value={[track.volume * 100]}
              max={100}
              step={1}
              onValueChange={([v]) => setTrackVolume(track.id, v / 100)}
              className="h-1"
            />
          </div>
        )}
      </div>

      {/* Clips Area */}
      <div 
        ref={laneRef}
        className={cn(
          "flex-1 relative",
          isEffectivelyMuted && "opacity-50"
        )}
        style={{ 
          minWidth: duration * zoom,
          backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--border)/0.1) 0px, hsl(var(--border)/0.1) 1px, transparent 1px, transparent 50px)',
          backgroundSize: `${zoom}px 100%`,
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {track.clips.map(clip => (
          <AudioClipBlock
            key={clip.id}
            clip={clip}
            trackColor={track.color}
            zoom={zoom}
            isSelected={selectedClipId === clip.id}
            onSelect={() => onClipSelect(clip.id)}
            onDragStart={(e) => onClipDragStart(clip.id, e)}
          />
        ))}
      </div>
    </div>
  );
}
