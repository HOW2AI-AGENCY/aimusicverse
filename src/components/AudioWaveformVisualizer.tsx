import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AudioWaveformVisualizerProps {
  audioUrl?: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
}

export function AudioWaveformVisualizer({
  audioUrl,
  isPlaying,
  currentTime,
  duration,
  onSeek,
  className,
}: AudioWaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const waveformCacheRef = useRef<Map<string, number[]>>(new Map());

  // Generate waveform data from audio with caching and optimization
  useEffect(() => {
    if (!audioUrl) return;

    // Check cache first
    if (waveformCacheRef.current.has(audioUrl)) {
      setWaveformData(waveformCacheRef.current.get(audioUrl)!);
      return;
    }

    const generateWaveform = async () => {
      setIsLoading(true);
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const rawData = audioBuffer.getChannelData(0);
        const samples = 100; // Reduced from 200 for faster rendering
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData: number[] = [];

        // Optimized sampling - take max instead of average for better visual
        for (let i = 0; i < samples; i++) {
          const blockStart = blockSize * i;
          let max = 0;
          // Sample every 4th point instead of all points
          for (let j = 0; j < blockSize; j += 4) {
            const val = Math.abs(rawData[blockStart + j]);
            if (val > max) max = val;
          }
          filteredData.push(max);
        }

        // Normalize data
        const maxVal = Math.max(...filteredData);
        const normalizedData = filteredData.map((n) => maxVal > 0 ? n / maxVal : 0);

        // Cache the result
        waveformCacheRef.current.set(audioUrl, normalizedData);
        setWaveformData(normalizedData);
        
        // Close audio context to free resources
        audioContext.close();
      } catch (error) {
        console.error('Error generating waveform:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateWaveform();
  }, [audioUrl]);

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const barWidth = width / waveformData.length;
    const progress = duration > 0 ? currentTime / duration : 0;

    waveformData.forEach((value, index) => {
      const barHeight = value * height * 0.8;
      const x = index * barWidth;
      const y = (height - barHeight) / 2;

      // Determine bar color based on progress
      const isPlayed = index / waveformData.length < progress;
      
      ctx.fillStyle = isPlayed
        ? 'hsl(var(--primary))' // Played portion
        : 'hsl(var(--muted-foreground) / 0.3)'; // Unplayed portion

      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });
  }, [waveformData, currentTime, duration, isPlaying]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickProgress = x / rect.width;
    const seekTime = clickProgress * duration;

    onSeek(seekTime);
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-24', className)}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className={cn(
        'w-full h-24 cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      style={{ display: 'block' }}
    />
  );
}
