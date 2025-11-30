import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface StudioTimelineProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export function StudioTimeline({ currentTime, duration, onSeek }: StudioTimelineProps) {
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleSeek(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleSeek(e as any);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSeek = (e: React.MouseEvent | MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const time = (percentage / 100) * duration;
    
    onSeek(time);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <section className="relative px-6 py-3 border-b border-border/50 bg-muted/20">
      <div className="flex justify-between items-end mb-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
            <div className="w-1 h-1 bg-primary rounded-full" />
            LIVE EDIT
          </span>
        </div>
        <span className="text-xs font-mono text-muted-foreground tabular-nums">
          {formatTime(currentTime)} <span className="text-muted-foreground/50">/ {formatTime(duration)}</span>
        </span>
      </div>
      
      {/* Timeline Ruler & Playhead */}
      <div
        ref={timelineRef}
        className="relative w-full h-6 cursor-pointer group"
        onMouseDown={handleMouseDown}
      >
        {/* Background Ticks */}
        <div className="absolute inset-0 flex justify-between px-[1px] opacity-30 pointer-events-none">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-[1px]",
                i % 5 === 0 ? "h-full bg-muted-foreground/40" : "h-2 mt-4 bg-muted-foreground/20"
              )}
            />
          ))}
        </div>
        
        {/* Progress Background */}
        <div className="absolute inset-0 bg-primary/5 rounded" style={{ width: `${progress}%` }} />
        
        {/* Playhead Cursor */}
        <div
          className="absolute -top-1 bottom-0 w-[2px] bg-primary z-20 shadow-[0_0_12px_rgba(139,92,246,1)] transition-none pointer-events-none"
          style={{ left: `${progress}%` }}
        >
          <div className="absolute -top-1.5 -left-[4px] w-2.5 h-2.5 bg-primary rounded-sm rotate-45 shadow-sm" />
          <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-primary/10 to-transparent" />
        </div>
        
        {/* Hover effect */}
        <div className="absolute inset-0 hover:bg-foreground/5 transition-colors rounded" />
      </div>
    </section>
  );
}
