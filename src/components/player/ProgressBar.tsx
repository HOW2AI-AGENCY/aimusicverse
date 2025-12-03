/**
 * Progress Bar Component
 * 
 * Interactive audio playback progress bar with buffering visualization.
 * Supports touch and mouse interactions for seeking.
 * 
 * Features:
 * - Visual progress indicator
 * - Buffered content preview
 * - Draggable seek handle
 * - Touch-optimized interaction area
 * - Time labels (current/total)
 * - Smooth drag experience
 * 
 * @module ProgressBar
 */

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Progress bar component props
 */
interface ProgressBarProps {
  currentTime: number;      // Current playback time in seconds
  duration: number;          // Total duration in seconds
  onSeek: (time: number) => void;  // Callback when user seeks to new position
  buffered?: number;         // Buffered percentage (0-100), optional
  className?: string;        // Additional CSS classes
}

/**
 * Progress Bar Component
 * 
 * @param props - Component props
 * @returns Progress bar with seek functionality
 */
export function ProgressBar({ 
  currentTime, 
  duration, 
  onSeek, 
  buffered = 0,
  className 
}: ProgressBarProps) {
  // Drag state - when true, shows local time instead of prop time
  const [isDragging, setIsDragging] = useState(false);
  
  // Local time - used during drag to show preview without triggering seek
  const [localTime, setLocalTime] = useState(currentTime);
  
  // Progress bar element ref - needed for position calculations
  const progressRef = useRef<HTMLDivElement>(null);

  /**
   * Sync local time with prop when not dragging
   * Prevents jumpy behavior during drag operations
   */
  useEffect(() => {
    if (!isDragging) {
      setLocalTime(currentTime);
    }
  }, [currentTime, isDragging]);

  /**
   * Format time helper - converts seconds to MM:SS format
   * 
   * @param seconds - Time in seconds
   * @returns Formatted time string (e.g., "3:45")
   */
  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Handle seek operation - calculates new time from pointer position
   * 
   * @param e - Pointer event (mouse or touch)
   * 
   * Algorithm:
   * 1. Get progress bar dimensions
   * 2. Calculate click position relative to bar (0-1)
   * 3. Convert to time value
   * 4. Clamp to valid range
   * 5. Update local preview and trigger seek callback
   */
  const handleSeek = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    // Calculate percentage (0-1) of where user clicked
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    
    // Convert percentage to time
    const newTime = percent * duration;
    
    // Update local state immediately for responsive UI
    setLocalTime(newTime);
    
    // Notify parent component to update audio element
    onSeek(newTime);
  };

  /**
   * Pointer down handler - initiates drag operation
   * Also performs immediate seek to clicked position
   */
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleSeek(e); // Seek immediately on click
  };

  /**
   * Pointer move handler - continues seek during drag
   * Only active when dragging flag is set
   */
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleSeek(e);
    }
  };

  /**
   * Pointer up/leave handler - ends drag operation
   * Pointer leave also ends drag to handle cursor leaving area
   */
  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Calculate visual progress percentages
  const progress = duration > 0 ? (localTime / duration) * 100 : 0;
  const bufferedPercent = buffered; // Already in percentage format (0-100)

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress Bar */}
      <div
        ref={progressRef}
        className="relative h-1 bg-secondary rounded-full cursor-pointer touch-manipulation group"
        style={{ paddingTop: '21px', paddingBottom: '21px' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        role="slider"
        aria-label="Track progress"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={localTime}
      >
        <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-secondary rounded-full overflow-hidden">
          {/* Buffered Progress */}
          <div
            className="absolute left-0 top-0 h-full bg-muted-foreground/20 transition-all"
            style={{ width: `${bufferedPercent}%` }}
          />
          
          {/* Current Progress */}
          <div
            className="absolute left-0 top-0 h-full bg-primary transition-all rounded-full"
            style={{ width: `${progress}%` }}
          />
          
          {/* Progress Handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>
      </div>

      {/* Time Labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatTime(localTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
