/**
 * Audio Clip Block - Draggable/Resizable clip on timeline
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { StudioClip, useStudioProjectStore } from '@/stores/useStudioProjectStore';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface AudioClipBlockProps {
  clip: StudioClip;
  trackColor: string;
  zoom: number;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
}

export function AudioClipBlock({
  clip,
  trackColor,
  zoom,
  isSelected,
  onSelect,
  onDragStart,
}: AudioClipBlockProps) {
  const clipRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [initialWidth, setInitialWidth] = useState(0);
  const [initialX, setInitialX] = useState(0);
  
  const { trimClip, updateClip } = useStudioProjectStore();
  
  const effectiveDuration = clip.duration - clip.trimStart - clip.trimEnd;
  const width = effectiveDuration * zoom;
  const left = (clip.startTime + clip.trimStart) * zoom;
  const height = isMobile ? 48 : 64;

  const handleResizeStart = useCallback((side: 'left' | 'right', e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsResizing(side);
    setInitialWidth(width);
    setInitialX('touches' in e ? e.touches[0].clientX : e.clientX);
  }, [width]);

  const handleResizeMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - initialX;
    const deltaTime = deltaX / zoom;
    
    if (isResizing === 'left') {
      const newTrimStart = Math.max(0, Math.min(clip.duration - clip.trimEnd - 0.5, clip.trimStart + deltaTime));
      trimClip(clip.id, newTrimStart, clip.trimEnd);
    } else {
      const newTrimEnd = Math.max(0, Math.min(clip.duration - clip.trimStart - 0.5, clip.trimEnd - deltaTime));
      trimClip(clip.id, clip.trimStart, newTrimEnd);
    }
    
    setInitialX(clientX);
  }, [isResizing, initialX, zoom, clip, trimClip]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.addEventListener('touchmove', handleResizeMove);
      document.addEventListener('touchend', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.removeEventListener('touchmove', handleResizeMove);
        document.removeEventListener('touchend', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  return (
    <div
      ref={clipRef}
      className={cn(
        "absolute top-1 rounded-md overflow-hidden cursor-grab active:cursor-grabbing",
        "transition-shadow duration-150",
        isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background shadow-lg",
        !isSelected && "hover:shadow-md"
      )}
      style={{
        left,
        width: Math.max(width, 20),
        height: height - 8,
        backgroundColor: `${trackColor}33`,
        borderLeft: `3px solid ${trackColor}`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseDown={onDragStart}
      onTouchStart={onDragStart}
      draggable
    >
      {/* Waveform placeholder */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `repeating-linear-gradient(
            90deg,
            ${trackColor}66 0px,
            ${trackColor}33 2px,
            transparent 2px,
            transparent 4px
          )`,
        }}
      />
      
      {/* Clip Info */}
      <div className="absolute inset-x-0 top-0 px-2 py-1 flex items-center gap-1">
        <GripVertical className="h-3 w-3 opacity-50 flex-shrink-0" />
        <span className="text-[10px] font-medium truncate text-foreground/80">
          {clip.name}
        </span>
      </div>
      
      {/* Duration */}
      <div className="absolute bottom-1 right-2 text-[9px] text-foreground/50">
        {effectiveDuration.toFixed(1)}s
      </div>

      {/* Resize Handles */}
      {isSelected && (
        <>
          {/* Left Handle */}
          <div
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-primary/50 hover:bg-primary/80 transition-colors"
            onMouseDown={(e) => handleResizeStart('left', e)}
            onTouchStart={(e) => handleResizeStart('left', e)}
          />
          
          {/* Right Handle */}
          <div
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-primary/50 hover:bg-primary/80 transition-colors"
            onMouseDown={(e) => handleResizeStart('right', e)}
            onTouchStart={(e) => handleResizeStart('right', e)}
          />
        </>
      )}
      
      {/* Fade indicators */}
      {clip.fadeIn > 0 && (
        <div 
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-background/80 to-transparent"
          style={{ width: clip.fadeIn * zoom }}
        />
      )}
      {clip.fadeOut > 0 && (
        <div 
          className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-background/80 to-transparent"
          style={{ width: clip.fadeOut * zoom }}
        />
      )}
    </div>
  );
}
