import { useEffect, useRef, useMemo } from 'react';

interface AudioWaveformProps {
  waveformData: number[];
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
  className?: string;
}

export function AudioWaveform({ waveformData, currentTime, duration, onSeek, className = '' }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Cache the waveform data to prevent re-generation
  const cachedWaveformData = useMemo(() => waveformData, [waveformData]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    const seekTime = progress * duration;
    
    onSeek(Math.max(0, Math.min(duration, seekTime)));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cachedWaveformData || cachedWaveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const barWidth = width / cachedWaveformData.length;
    const centerY = height / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate progress
    const progress = duration > 0 ? currentTime / duration : 0;
    const progressBarCount = Math.floor(cachedWaveformData.length * progress);

    // Draw waveform bars
    cachedWaveformData.forEach((value, index) => {
      const barHeight = value * height * 0.8;
      const x = index * barWidth;
      const y = centerY - barHeight / 2;

      // Create gradient for played and unplayed sections
      const isPassed = index < progressBarCount;
      
      if (isPassed) {
        // Played section - blue/primary color
        ctx.fillStyle = 'hsl(var(--primary))';
      } else {
        // Unplayed section - muted color
        ctx.fillStyle = 'hsl(var(--muted-foreground) / 0.3)';
      }

      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });

    // Draw progress indicator line
    const progressX = width * progress;
    ctx.beginPath();
    ctx.moveTo(progressX, 0);
    ctx.lineTo(progressX, height);
    ctx.strokeStyle = 'hsl(var(--primary))';
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [cachedWaveformData, currentTime, duration]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full ${onSeek ? 'cursor-pointer' : ''} ${className}`}
      style={{ height: '80px' }}
      onClick={handleCanvasClick}
    />
  );
}
