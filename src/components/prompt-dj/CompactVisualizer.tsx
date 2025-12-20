/**
 * CompactVisualizer - Minimal audio visualizer
 * Displays 40px height mini visualizer for mobile
 * NOTE: Uses Tone.Analyser type only, no static Tone import to prevent circular deps
 */

import { memo, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// Use a generic type for the analyzer to avoid static Tone.js import
interface CompactVisualizerProps {
  analyzerNode: { getValue: () => Float32Array | Float32Array[] | number[] } | null;
  isActive: boolean;
  className?: string;
}

export const CompactVisualizer = memo(function CompactVisualizer({
  analyzerNode,
  isActive,
  className,
}: CompactVisualizerProps) {
  const [levels, setLevels] = useState<number[]>(Array(8).fill(0.1));
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive || !analyzerNode) {
      // Idle animation
      const idleInterval = setInterval(() => {
        setLevels(prev => prev.map(() => 0.05 + Math.random() * 0.1));
      }, 500);
      return () => clearInterval(idleInterval);
    }

    const animate = () => {
      if (!analyzerNode) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const data = analyzerNode.getValue();
      if (!data || data.length === 0) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      // Sample 8 points from the frequency data
      const step = Math.floor(data.length / 8);
      const newLevels: number[] = [];

      for (let i = 0; i < 8; i++) {
        const value = data[i * step] as number;
        // Normalize from dB (-100 to 0) to 0-1
        const normalized = Math.max(0, Math.min(1, (value + 100) / 100));
        newLevels.push(normalized);
      }

      setLevels(newLevels);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isActive, analyzerNode]);

  return (
    <div
      className={cn(
        'flex items-end justify-center gap-0.5 h-10',
        className
      )}
    >
      {levels.map((level, i) => (
        <div
          key={i}
          className={cn(
            'w-1 rounded-full transition-all duration-75',
            isActive ? 'bg-primary' : 'bg-muted-foreground/30'
          )}
          style={{
            height: `${Math.max(4, level * 36)}px`,
            opacity: isActive ? 0.6 + level * 0.4 : 0.3,
          }}
        />
      ))}
    </div>
  );
});
