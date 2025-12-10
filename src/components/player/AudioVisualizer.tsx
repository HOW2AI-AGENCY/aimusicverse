/**
 * Audio Visualizer Component
 * 
 * Displays animated frequency bars that react to audio playback.
 * Uses Web Audio API for real-time audio analysis.
 * 
 * Uses centralized audioContextManager to prevent conflicts.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { 
  getOrCreateAudioNodes, 
  ensureAudioRoutedToDestination 
} from '@/lib/audioContextManager';

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  variant?: 'bars' | 'wave' | 'circular';
  barCount?: number;
  className?: string;
  color?: 'primary' | 'gradient' | 'rainbow';
}

export function AudioVisualizer({
  audioElement,
  isPlaying,
  variant = 'bars',
  barCount = 32,
  className,
  color = 'primary'
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [frequencies, setFrequencies] = useState<number[]>(new Array(barCount).fill(0));

  // Initialize Web Audio API using centralized manager
  const initializeAudio = useCallback(async () => {
    if (!audioElement) return null;

    try {
      const nodes = await getOrCreateAudioNodes(audioElement, 128, 0.8);
      
      if (!nodes) {
        logger.debug('Audio nodes not available, using fallback visualization');
        // Ensure audio is still routed even if visualizer fails
        ensureAudioRoutedToDestination();
        return null;
      }
      
      return nodes.analyser;
    } catch (error) {
      logger.error('Error initializing audio visualizer', error);
      // Ensure audio continues to work even if visualizer fails
      ensureAudioRoutedToDestination();
      return null;
    }
  }, [audioElement]);

  // Animate visualizer
  useEffect(() => {
    if (!isPlaying) {
      // Fade out frequencies when paused
      setFrequencies(prev => prev.map(f => f * 0.9));
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    let isActive = true;

    const initAndAnimate = async () => {
      const analyser = await initializeAudio();
      
      if (!isActive) return; // Component unmounted during await
      
      if (!analyser) {
        // Generate fake frequencies for visual effect when audio API unavailable
        const generateFakeFrequencies = () => {
          if (!isPlaying || !isActive) return;
          
          setFrequencies(prev => 
            prev.map((_, i) => {
              const baseFreq = Math.sin(Date.now() / 500 + i * 0.5) * 0.3 + 0.5;
              const randomVariation = Math.random() * 0.3;
              return Math.min(1, Math.max(0.1, baseFreq + randomVariation));
            })
          );
          
          animationRef.current = requestAnimationFrame(generateFakeFrequencies);
        };
        
        generateFakeFrequencies();
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const animate = () => {
        if (!isPlaying || !isActive) return;
        
        analyser.getByteFrequencyData(dataArray);
        
        // Sample frequencies for visualization
        const step = Math.floor(bufferLength / barCount);
        const newFrequencies: number[] = [];
        
        for (let i = 0; i < barCount; i++) {
          // Average a range of frequencies for each bar
          let sum = 0;
          for (let j = 0; j < step; j++) {
            sum += dataArray[i * step + j] || 0;
          }
          // Normalize to 0-1 range with some boost for visual effect
          const normalized = Math.min(1, (sum / step / 255) * 1.5);
          newFrequencies.push(normalized);
        }
        
        setFrequencies(newFrequencies);
        animationRef.current = requestAnimationFrame(animate);
      };

      animate();
    };

    initAndAnimate();

    return () => {
      isActive = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, initializeAudio, barCount]);

  // Color helpers
  const getBarColor = (index: number, value: number) => {
    if (color === 'rainbow') {
      const hue = (index / barCount) * 360;
      return `hsl(${hue}, 80%, ${50 + value * 20}%)`;
    }
    if (color === 'gradient') {
      const intensity = Math.floor(value * 100);
      return `hsl(var(--primary) / ${0.3 + value * 0.7})`;
    }
    return `hsl(var(--primary) / ${0.4 + value * 0.6})`;
  };

  // Bars variant
  if (variant === 'bars') {
    return (
      <div className={cn('flex items-end justify-center gap-0.5 h-16', className)}>
        {frequencies.map((freq, index) => (
          <motion.div
            key={index}
            className="w-1.5 rounded-full"
            style={{
              backgroundColor: getBarColor(index, freq),
              boxShadow: freq > 0.5 ? `0 0 8px ${getBarColor(index, freq)}` : 'none',
            }}
            animate={{
              height: `${Math.max(4, freq * 100)}%`,
              scaleY: isPlaying ? 1 : 0.3,
            }}
            transition={{
              height: { duration: 0.05 },
              scaleY: { duration: 0.3 },
            }}
          />
        ))}
      </div>
    );
  }

  // Wave variant
  if (variant === 'wave') {
    return (
      <div className={cn('flex items-center justify-center gap-0.5 h-12', className)}>
        {frequencies.map((freq, index) => (
          <motion.div
            key={index}
            className="w-1 rounded-full bg-primary"
            style={{
              opacity: 0.4 + freq * 0.6,
              boxShadow: freq > 0.6 ? '0 0 6px hsl(var(--primary) / 0.5)' : 'none',
            }}
            animate={{
              height: `${Math.max(8, freq * 100)}%`,
              y: Math.sin((index / barCount) * Math.PI) * (1 - freq) * -10,
            }}
            transition={{ duration: 0.08 }}
          />
        ))}
      </div>
    );
  }

  // Circular variant
  if (variant === 'circular') {
    const radius = 60;
    const centerX = 80;
    const centerY = 80;

    return (
      <svg className={cn('w-40 h-40', className)} viewBox="0 0 160 160">
        {/* Background circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius - 10}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="2"
          opacity="0.2"
        />
        
        {/* Frequency bars as radial lines */}
        {frequencies.map((freq, index) => {
          const angle = (index / barCount) * 2 * Math.PI - Math.PI / 2;
          const innerRadius = radius - 5;
          const outerRadius = radius + freq * 30;
          
          const x1 = centerX + Math.cos(angle) * innerRadius;
          const y1 = centerY + Math.sin(angle) * innerRadius;
          const x2 = centerX + Math.cos(angle) * outerRadius;
          const y2 = centerY + Math.sin(angle) * outerRadius;

          return (
            <motion.line
              key={index}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={getBarColor(index, freq)}
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: isPlaying ? 0.5 + freq * 0.5 : 0.2,
                x2,
                y2,
              }}
              transition={{ duration: 0.05 }}
              style={{
                filter: freq > 0.6 ? 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))' : 'none'
              }}
            />
          );
        })}

        {/* Center glow */}
        <motion.circle
          cx={centerX}
          cy={centerY}
          r={20}
          fill="hsl(var(--primary) / 0.1)"
          animate={{
            r: isPlaying ? [18, 22, 18] : 18,
            opacity: isPlaying ? [0.1, 0.2, 0.1] : 0.05,
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </svg>
    );
  }

  return null;
}
