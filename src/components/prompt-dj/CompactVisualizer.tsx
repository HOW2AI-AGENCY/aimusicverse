/**
 * CompactVisualizer - Minimal 40px height visualizer for PromptDJ
 * Optimized for mobile with simple bar animation
 */

import { memo, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import * as Tone from 'tone';

interface CompactVisualizerProps {
  analyzerNode: Tone.Analyser | null;
  isActive: boolean;
  className?: string;
}

export const CompactVisualizer = memo(function CompactVisualizer({
  analyzerNode,
  isActive,
  className,
}: CompactVisualizerProps) {
  const [levels, setLevels] = useState<number[]>(Array(16).fill(0.1));
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive || !analyzerNode) {
      // Idle animation
      const idleInterval = setInterval(() => {
        setLevels(Array(16).fill(0).map((_, i) => 
          0.1 + Math.sin(Date.now() / 500 + i * 0.5) * 0.05
        ));
      }, 100);
      return () => clearInterval(idleInterval);
    }

    const updateLevels = () => {
      try {
        const values = analyzerNode.getValue() as Float32Array;
        const barCount = 16;
        const step = Math.floor(values.length / barCount);
        
        const newLevels = Array(barCount).fill(0).map((_, i) => {
          const idx = i * step;
          const val = values[idx] ?? -100;
          // Normalize from dB (-100 to 0) to 0-1
          return Math.max(0.05, Math.min(1, (val + 100) / 80));
        });
        
        setLevels(newLevels);
      } catch {
        // Silent fail
      }
      
      animationFrameRef.current = requestAnimationFrame(updateLevels);
    };

    updateLevels();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyzerNode, isActive]);

  return (
    <div className={cn(
      'flex items-end justify-center gap-0.5 h-10 px-2',
      className
    )}>
      {levels.map((level, i) => (
        <div
          key={i}
          className={cn(
            'w-1.5 rounded-full transition-all duration-75',
            isActive 
              ? 'bg-gradient-to-t from-primary/60 to-primary' 
              : 'bg-muted/30'
          )}
          style={{
            height: `${Math.max(8, level * 100)}%`,
            transform: `scaleY(${level})`,
            transformOrigin: 'bottom',
          }}
        />
      ))}
    </div>
  );
});
