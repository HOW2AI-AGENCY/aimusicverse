/**
 * OptimizedLyricsLine - Memoized lyrics line component
 * Optimized for performance with proper memoization
 */

import React, { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface LyricsLineData {
  id: string;
  text: string;
  startTime?: number;
  endTime?: number;
  isSection?: boolean;
  sectionType?: string;
}

interface OptimizedLyricsLineProps {
  line: LyricsLineData;
  index: number;
  isActive: boolean;
  isNext: boolean;
  isPast: boolean;
  onClick?: (line: LyricsLineData, index: number) => void;
  onDoubleClick?: (line: LyricsLineData, index: number) => void;
  showTimestamps?: boolean;
  editable?: boolean;
  className?: string;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const OptimizedLyricsLine = memo(function OptimizedLyricsLine({
  line,
  index,
  isActive,
  isNext,
  isPast,
  onClick,
  onDoubleClick,
  showTimestamps = false,
  editable = false,
  className,
}: OptimizedLyricsLineProps) {
  const handleClick = useCallback(() => {
    onClick?.(line, index);
  }, [onClick, line, index]);

  const handleDoubleClick = useCallback(() => {
    onDoubleClick?.(line, index);
  }, [onDoubleClick, line, index]);

  // Section header rendering
  if (line.isSection) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3',
          'text-xs font-medium uppercase tracking-wider',
          'text-muted-foreground/70',
          isActive && 'text-primary',
          className
        )}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <div className="h-px flex-1 bg-border/50" />
        <span>{line.sectionType || line.text}</span>
        <div className="h-px flex-1 bg-border/50" />
      </div>
    );
  }

  // Empty line
  if (!line.text.trim()) {
    return (
      <div
        className={cn('h-6', className)}
        onClick={handleClick}
      />
    );
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-3 py-1.5 px-3 rounded-lg',
        'transition-all duration-200 ease-out',
        'cursor-pointer select-none',
        // Base state
        'text-muted-foreground',
        // Past lines - dimmed
        isPast && 'opacity-50',
        // Active line - highlighted
        isActive && [
          'bg-primary/10 text-foreground font-medium',
          'scale-[1.02] shadow-sm',
        ],
        // Next line - subtle highlight
        isNext && 'text-foreground/80',
        // Hover state
        !isActive && 'hover:bg-muted/50',
        className
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      role="button"
      tabIndex={0}
      aria-current={isActive ? 'true' : undefined}
    >
      {/* Timestamp */}
      {showTimestamps && line.startTime !== undefined && (
        <span className="text-xs text-muted-foreground/60 font-mono w-12 flex-shrink-0">
          {formatTime(line.startTime)}
        </span>
      )}

      {/* Line text */}
      <span
        className={cn(
          'flex-1 text-sm leading-relaxed',
          isActive && 'text-primary'
        )}
      >
        {line.text}
      </span>

      {/* Active indicator */}
      {isActive && (
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal memoization
  return (
    prevProps.line.id === nextProps.line.id &&
    prevProps.line.text === nextProps.line.text &&
    prevProps.index === nextProps.index &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isNext === nextProps.isNext &&
    prevProps.isPast === nextProps.isPast &&
    prevProps.showTimestamps === nextProps.showTimestamps &&
    prevProps.editable === nextProps.editable &&
    prevProps.className === nextProps.className
  );
});

export default OptimizedLyricsLine;
