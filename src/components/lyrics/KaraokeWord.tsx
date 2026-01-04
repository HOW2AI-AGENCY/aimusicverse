/**
 * Karaoke Word Component
 * 
 * Displays a word with animated fill progress bar that shows
 * the current position within the word during playback.
 * Creates a smooth "karaoke" effect.
 */

import React, { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';

interface KaraokeWordProps {
  word: string;
  startTime: number;
  endTime: number;
  currentTime: number;
  isPlaying: boolean;
  onClick?: () => void;
  className?: string;
  activeColor?: string;
  inactiveColor?: string;
  pastColor?: string;
}

export const KaraokeWord = memo(function KaraokeWord({
  word,
  startTime,
  endTime,
  currentTime,
  isPlaying,
  onClick,
  className,
  activeColor = 'hsl(var(--primary))',
  inactiveColor = 'hsl(var(--muted-foreground) / 0.5)',
  pastColor = 'hsl(var(--foreground) / 0.7)',
}: KaraokeWordProps) {
  // Clean word from newlines
  const cleanWord = word.replace(/\n/g, '').trim();
  if (!cleanWord) return null;
  
  // Calculate progress through the word (0 to 1)
  const progress = useMemo(() => {
    if (currentTime < startTime) return 0;
    if (currentTime > endTime) return 1;
    
    const duration = endTime - startTime;
    if (duration <= 0) return currentTime >= startTime ? 1 : 0;
    
    return Math.min(1, Math.max(0, (currentTime - startTime) / duration));
  }, [currentTime, startTime, endTime]);
  
  const isActive = currentTime >= startTime && currentTime <= endTime;
  const isPast = currentTime > endTime;
  const isFuture = currentTime < startTime;
  
  // Only show animation when playing and word is active
  const showProgress = isPlaying && isActive && progress > 0 && progress < 1;
  
  return (
    <span
      onClick={onClick}
      className={cn(
        'relative inline-block cursor-pointer select-none',
        'transition-transform duration-100 ease-out',
        'will-change-transform transform-gpu',
        isActive && 'scale-105',
        className
      )}
      style={{
        // Base text color (inactive/future words)
        color: isPast ? pastColor : isFuture ? inactiveColor : activeColor,
      }}
    >
      {/* Background text (shows through unfilled portion) */}
      <span 
        className="relative z-10"
        style={{
          // For active words, show gradient fill based on progress
          background: showProgress 
            ? `linear-gradient(90deg, ${activeColor} ${progress * 100}%, ${inactiveColor} ${progress * 100}%)`
            : undefined,
          WebkitBackgroundClip: showProgress ? 'text' : undefined,
          WebkitTextFillColor: showProgress ? 'transparent' : undefined,
          backgroundClip: showProgress ? 'text' : undefined,
        }}
      >
        {cleanWord}
      </span>
      
      {/* Glow effect for active words */}
      {isActive && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 blur-sm pointer-events-none z-0"
          style={{ color: activeColor }}
          aria-hidden
        >
          {cleanWord}
        </motion.span>
      )}
      
      {/* Add space after word */}
      {' '}
    </span>
  );
}, (prevProps, nextProps) => {
  // Only re-render if essential props change
  const prevActive = prevProps.currentTime >= prevProps.startTime && prevProps.currentTime <= prevProps.endTime;
  const nextActive = nextProps.currentTime >= nextProps.startTime && nextProps.currentTime <= nextProps.endTime;
  
  // Always re-render if activity state changes
  if (prevActive !== nextActive) return false;
  
  // If active, re-render on time changes for smooth progress
  if (nextActive) {
    return Math.abs(prevProps.currentTime - nextProps.currentTime) < 0.016; // Skip if <16ms difference
  }
  
  // For inactive words, check if past state changed
  const prevPast = prevProps.currentTime > prevProps.endTime;
  const nextPast = nextProps.currentTime > nextProps.endTime;
  if (prevPast !== nextPast) return false;
  
  // No need to re-render for other changes
  return (
    prevProps.word === nextProps.word &&
    prevProps.isPlaying === nextProps.isPlaying
  );
});

export default KaraokeWord;
