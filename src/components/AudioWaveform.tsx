import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  waveformData: number[];
  currentTime: number;
  duration: number;
  className?: string;
}

export function AudioWaveform({ waveformData, currentTime, duration, className = '' }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const barWidth = width / waveformData.length;
    const centerY = height / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate progress
    const progress = duration > 0 ? currentTime / duration : 0;
    const progressBarCount = Math.floor(waveformData.length * progress);

    // Draw waveform bars
    waveformData.forEach((value, index) => {
      const barHeight = value * height * 0.8;
      const x = index * barWidth;
      const y = centerY - barHeight / 2;

      // Create gradient for played and unplayed sections
      const isPassed = index < progressBarCount;
      
      if (isPassed) {
        // Played section - primary color gradient
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, 'hsl(var(--primary))');
        gradient.addColorStop(1, 'hsl(var(--primary) / 0.6)');
        ctx.fillStyle = gradient;
      } else {
        // Unplayed section - muted color
        ctx.fillStyle = 'hsl(var(--muted-foreground) / 0.3)';
      }

      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });

    // Draw progress indicator
    const progressX = width * progress;
    ctx.beginPath();
    ctx.moveTo(progressX, 0);
    ctx.lineTo(progressX, height);
    ctx.strokeStyle = 'hsl(var(--primary))';
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [waveformData, currentTime, duration]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full ${className}`}
      style={{ height: '80px' }}
    />
  );
}
