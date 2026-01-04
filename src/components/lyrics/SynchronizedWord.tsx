/**
 * Synchronized Word Component
 * 
 * Memoized component for rendering individual words with smooth highlighting.
 * Uses CSS transitions for performance and GPU acceleration.
 */

import React, { memo } from 'react';
import { cn } from '@/lib/utils';

interface SynchronizedWordProps {
  word: string;
  isActive: boolean;
  isPast: boolean;
  onClick?: () => void;
  className?: string;
  activeClassName?: string;
  pastClassName?: string;
  futureClassName?: string;
}

export const SynchronizedWord = memo(function SynchronizedWord({
  word,
  isActive,
  isPast,
  onClick,
  className,
  activeClassName = 'text-primary font-bold scale-105',
  pastClassName = 'text-foreground/70',
  futureClassName = 'text-muted-foreground/60',
}: SynchronizedWordProps) {
  // Clean word from newlines
  const cleanWord = word.replace(/\n/g, '').trim();
  if (!cleanWord) return null;
  
  return (
    <span
      onClick={onClick}
      className={cn(
        // Base styles with GPU acceleration
        'inline-block transition-all duration-100 ease-out',
        'will-change-[color,transform] transform-gpu',
        onClick && 'cursor-pointer',
        
        // State-based styles
        isActive && activeClassName,
        !isActive && isPast && pastClassName,
        !isActive && !isPast && futureClassName,
        
        // Custom class
        className
      )}
    >
      {cleanWord}{' '}
    </span>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance - only re-render when state changes
  return (
    prevProps.word === nextProps.word &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isPast === nextProps.isPast &&
    prevProps.className === nextProps.className
  );
});

export default SynchronizedWord;
