/**
 * Compact Mobile Section Timeline
 * 
 * Minimal height version for mobile Stem Studio
 * Shows only section pills and small progress bar
 */

import { useRef, useState, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { DetectedSection } from '@/hooks/useSectionDetection';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface MobileSectionTimelineCompactProps {
  sections: DetectedSection[];
  duration: number;
  currentTime: number;
  selectedIndex: number | null;
  replacedRanges?: { start: number; end: number }[];
  onSectionClick: (section: DetectedSection, index: number) => void;
  onSeek: (time: number) => void;
}

const SECTION_COLORS: Record<DetectedSection['type'], string> = {
  verse: 'bg-blue-500',
  chorus: 'bg-purple-500',
  bridge: 'bg-amber-500',
  intro: 'bg-green-500',
  outro: 'bg-rose-500',
  'pre-chorus': 'bg-cyan-500',
  hook: 'bg-orange-500',
  unknown: 'bg-muted-foreground',
};

export function MobileSectionTimelineCompact({
  sections,
  duration,
  currentTime,
  selectedIndex,
  replacedRanges = [],
  onSectionClick,
  onSeek,
}: MobileSectionTimelineCompactProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const haptic = useHapticFeedback();

  const handleDrag = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    let clientX: number;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const time = (x / rect.width) * duration;
    onSeek(time);
  }, [duration, onSeek]);

  const handleDragStart = () => {
    setIsDragging(true);
    haptic.impact('light');
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleSectionClick = useCallback((section: DetectedSection, index: number) => {
    haptic.select();
    onSectionClick(section, index);
  }, [onSectionClick, haptic]);

  // Find active section
  const activeIndex = sections.findIndex(
    s => currentTime >= s.startTime && currentTime <= s.endTime
  );

  return (
    <div className="space-y-2">
      {/* Compact Section Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-hide">
        {sections.map((section, idx) => {
          const isSelected = selectedIndex === idx;
          const isActive = idx === activeIndex;
          const isReplaced = replacedRanges.some(
            r => Math.abs(r.start - section.startTime) < 1 && Math.abs(r.end - section.endTime) < 1
          );

          return (
            <motion.button
              key={idx}
              onClick={() => handleSectionClick(section, idx)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-medium',
                'border min-h-[32px] transition-all duration-150',
                isSelected && 'border-primary bg-primary/20 text-primary',
                isActive && !isSelected && 'border-primary/40 bg-primary/10',
                !isSelected && !isActive && 'border-border/40 bg-muted/30 text-muted-foreground',
                isReplaced && 'ring-1 ring-success/50'
              )}
            >
              <span className="flex items-center gap-1.5">
                <span className={cn('w-1.5 h-1.5 rounded-full', SECTION_COLORS[section.type])} />
                <span className="whitespace-nowrap">{section.label}</span>
                {isReplaced && <span className="text-success text-[10px]">✓</span>}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Compact Progress Bar */}
      <div 
        ref={containerRef}
        className="relative h-8 touch-none"
        onTouchStart={handleDragStart}
        onTouchMove={handleDrag}
        onTouchEnd={handleDragEnd}
        onMouseDown={(e) => { handleDragStart(); handleDrag(e); }}
        onMouseMove={(e) => isDragging && handleDrag(e)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* Background with section colors */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 bg-muted/30 rounded-full overflow-hidden">
          {sections.map((section, idx) => {
            const left = (section.startTime / duration) * 100;
            const width = ((section.endTime - section.startTime) / duration) * 100;
            const isActive = idx === activeIndex;
            
            return (
              <div
                key={idx}
                className={cn(SECTION_COLORS[section.type], 'absolute h-full transition-opacity')}
                style={{ 
                  left: `${left}%`, 
                  width: `${width}%`,
                  opacity: isActive ? 0.5 : 0.2
                }}
              />
            );
          })}
          
          {/* Progress fill */}
          <div 
            className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all"
            style={{ width: `${progress}%`, transitionDuration: isDragging ? '0ms' : '100ms' }}
          />
        </div>

        {/* Playhead */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-8 h-8 -ml-4 flex items-center justify-center"
          style={{ left: `${progress}%` }}
        >
          <div 
            className={cn(
              'w-4 h-4 bg-primary rounded-full shadow border-2 border-background',
              isDragging && 'scale-125'
            )}
          />
        </div>
      </div>

      {/* Time display */}
      <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

export default MobileSectionTimelineCompact;
