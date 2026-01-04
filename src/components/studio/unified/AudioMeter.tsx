/**
 * AudioMeter - Real-time audio level visualization
 * Uses Web Audio API AnalyserNode for level detection
 */

import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface AudioMeterProps {
  analyserNode?: AnalyserNode | null;
  isPlaying?: boolean;
  orientation?: 'vertical' | 'horizontal';
  height?: number;
  width?: number;
  showPeak?: boolean;
  showClipping?: boolean;
  className?: string;
  color?: string;
}

export const AudioMeter = memo(function AudioMeter({
  analyserNode,
  isPlaying = false,
  orientation = 'vertical',
  height = 100,
  width = 12,
  showPeak = true,
  showClipping = true,
  className,
  color = 'primary',
}: AudioMeterProps) {
  const [level, setLevel] = useState(0);
  const [peak, setPeak] = useState(0);
  const [isClipping, setIsClipping] = useState(false);
  
  const animationFrameRef = useRef<number | null>(null);
  const peakHoldTimeRef = useRef<number>(0);
  const dataArrayRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  // Peak decay settings
  const PEAK_HOLD_TIME = 1500; // ms
  const PEAK_DECAY_RATE = 0.02;

  const updateMeter = useCallback(() => {
    if (!analyserNode || !isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateMeter);
      return;
    }

    if (!dataArrayRef.current) {
      dataArrayRef.current = new Float32Array(analyserNode.fftSize);
    }

    // Get time domain data
    analyserNode.getFloatTimeDomainData(dataArrayRef.current);

    // Calculate RMS level
    let sum = 0;
    let maxSample = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const sample = Math.abs(dataArrayRef.current[i]);
      sum += sample * sample;
      if (sample > maxSample) maxSample = sample;
    }
    const rms = Math.sqrt(sum / dataArrayRef.current.length);

    // Convert to dB-like scale (0-1 range)
    const dbLevel = Math.min(1, Math.max(0, (rms * 4))); // Scale RMS to visible range
    setLevel(dbLevel);

    // Check for clipping
    const clipping = maxSample > 0.99;
    setIsClipping(clipping);

    // Update peak with hold and decay
    const now = Date.now();
    if (dbLevel > peak) {
      setPeak(dbLevel);
      peakHoldTimeRef.current = now;
    } else if (now - peakHoldTimeRef.current > PEAK_HOLD_TIME) {
      setPeak(prev => Math.max(dbLevel, prev - PEAK_DECAY_RATE));
    }

    animationFrameRef.current = requestAnimationFrame(updateMeter);
  }, [analyserNode, isPlaying, peak]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(updateMeter);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateMeter]);

  // Reset when not playing
  useEffect(() => {
    if (!isPlaying) {
      setLevel(0);
      setPeak(0);
      setIsClipping(false);
    }
  }, [isPlaying]);

  const isVertical = orientation === 'vertical';

  // Color gradient based on level
  const getGradient = () => {
    if (color === 'primary') {
      return 'from-green-500 via-yellow-500 to-red-500';
    }
    return `from-${color}-500/50 via-${color}-500 to-${color}-400`;
  };

  if (isVertical) {
    return (
      <div
        className={cn(
          "relative rounded-md bg-muted/50 overflow-hidden",
          className
        )}
        style={{ width, height }}
      >
        {/* Level bar */}
        <motion.div
          className={cn(
            "absolute bottom-0 left-0 right-0 rounded-md",
            "bg-gradient-to-t",
            getGradient()
          )}
          style={{ height: `${level * 100}%` }}
          animate={{ height: `${level * 100}%` }}
          transition={{ duration: 0.05 }}
        />

        {/* Peak indicator */}
        {showPeak && peak > 0.05 && (
          <motion.div
            className="absolute left-0.5 right-0.5 h-0.5 bg-foreground/80 rounded-full"
            style={{ bottom: `${peak * 100}%` }}
            animate={{ bottom: `${peak * 100}%` }}
            transition={{ duration: 0.05 }}
          />
        )}

        {/* Clipping indicator */}
        {showClipping && isClipping && (
          <div className="absolute top-0 left-0 right-0 h-2 bg-red-500 animate-pulse rounded-t-md" />
        )}

        {/* Scale marks */}
        <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none">
          {[0, 25, 50, 75, 100].map((mark) => (
            <div
              key={mark}
              className="w-full h-px bg-background/30"
            />
          ))}
        </div>
      </div>
    );
  }

  // Horizontal orientation
  return (
    <div
      className={cn(
        "relative rounded-md bg-muted/50 overflow-hidden",
        className
      )}
      style={{ width: height, height: width }}
    >
      {/* Level bar */}
      <motion.div
        className={cn(
          "absolute top-0 bottom-0 left-0 rounded-md",
          "bg-gradient-to-r",
          getGradient()
        )}
        style={{ width: `${level * 100}%` }}
        animate={{ width: `${level * 100}%` }}
        transition={{ duration: 0.05 }}
      />

      {/* Peak indicator */}
      {showPeak && peak > 0.05 && (
        <motion.div
          className="absolute top-0.5 bottom-0.5 w-0.5 bg-foreground/80 rounded-full"
          style={{ left: `${peak * 100}%` }}
          animate={{ left: `${peak * 100}%` }}
          transition={{ duration: 0.05 }}
        />
      )}

      {/* Clipping indicator */}
      {showClipping && isClipping && (
        <div className="absolute top-0 bottom-0 right-0 w-2 bg-red-500 animate-pulse rounded-r-md" />
      )}
    </div>
  );
});

/**
 * Stereo meter with L/R channels
 */
interface StereoMeterProps {
  leftAnalyser?: AnalyserNode | null;
  rightAnalyser?: AnalyserNode | null;
  isPlaying?: boolean;
  height?: number;
  className?: string;
}

export const StereoMeter = memo(function StereoMeter({
  leftAnalyser,
  rightAnalyser,
  isPlaying = false,
  height = 100,
  className,
}: StereoMeterProps) {
  return (
    <div className={cn("flex gap-1", className)}>
      <AudioMeter
        analyserNode={leftAnalyser}
        isPlaying={isPlaying}
        height={height}
        width={6}
        orientation="vertical"
      />
      <AudioMeter
        analyserNode={rightAnalyser}
        isPlaying={isPlaying}
        height={height}
        width={6}
        orientation="vertical"
      />
    </div>
  );
});

/**
 * Simple level indicator (no analyser required)
 * Uses simulated levels based on volume/mute state
 */
interface SimpleMeterProps {
  volume: number;
  isMuted?: boolean;
  isPlaying?: boolean;
  orientation?: 'vertical' | 'horizontal';
  height?: number;
  width?: number;
  className?: string;
}

export const SimpleMeter = memo(function SimpleMeter({
  volume,
  isMuted = false,
  isPlaying = false,
  orientation = 'vertical',
  height = 80,
  width = 8,
  className,
}: SimpleMeterProps) {
  const [animatedLevel, setAnimatedLevel] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying || isMuted) {
      setAnimatedLevel(0);
      return;
    }

    // Simulate audio activity with random variations
    const animate = () => {
      const baseLevel = volume * 0.7;
      const variation = Math.random() * 0.3 * volume;
      setAnimatedLevel(Math.min(1, baseLevel + variation));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [volume, isMuted, isPlaying]);

  const isVertical = orientation === 'vertical';

  return (
    <div
      className={cn(
        "relative rounded-md bg-muted/50 overflow-hidden",
        className
      )}
      style={isVertical ? { width, height } : { width: height, height: width }}
    >
      <motion.div
        className={cn(
          "absolute rounded-md bg-gradient-to-t from-primary/50 to-primary",
          isVertical ? "bottom-0 left-0 right-0" : "top-0 bottom-0 left-0"
        )}
        animate={isVertical
          ? { height: `${animatedLevel * 100}%` }
          : { width: `${animatedLevel * 100}%` }
        }
        transition={{ duration: 0.08 }}
      />
    </div>
  );
});
