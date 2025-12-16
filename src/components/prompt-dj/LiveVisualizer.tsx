import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LiveVisualizerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analyzerNode: any;
  isActive: boolean;
  className?: string;
}

export function LiveVisualizer({ analyzerNode, isActive, className }: LiveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      if (analyzerNode && isActive) {
        try {
          const rawData = analyzerNode.getValue();
          // Convert to number array
          let data: number[] = [];
          if (rawData instanceof Float32Array) {
            data = Array.from(rawData);
          } else if (Array.isArray(rawData)) {
            data = rawData.map((v: unknown) => typeof v === 'number' ? v : 0);
          }
          
          const barCount = 32;
          const barWidth = width / barCount - 2;
          
          // Create gradient
          const gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, 'hsl(280, 70%, 50%)');
          gradient.addColorStop(0.5, 'hsl(220, 70%, 60%)');
          gradient.addColorStop(1, 'hsl(180, 70%, 70%)');
          
          ctx.fillStyle = gradient;

          for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * (data.length / barCount));
            // Convert dB to linear scale (0-1)
            const value = Math.max(0, ((data[dataIndex] || -100) + 100) / 100);
            const barHeight = value * height * 0.9;
            
            const x = i * (barWidth + 2);
            const y = height - barHeight;
            
            // Draw bar with rounded top
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 2);
            ctx.fill();
          }
        } catch {
          // Silently handle analyzer errors
        }
      } else {
        // Idle animation
        const time = Date.now() / 1000;
        const barCount = 32;
        const barWidth = width / barCount - 2;
        
        ctx.fillStyle = 'hsl(var(--muted-foreground) / 0.2)';
        
        for (let i = 0; i < barCount; i++) {
          const wave = Math.sin(time * 2 + i * 0.3) * 0.3 + 0.4;
          const barHeight = wave * height * 0.3;
          
          const x = i * (barWidth + 2);
          const y = height - barHeight;
          
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyzerNode, isActive]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
      }
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className={cn('relative rounded-lg overflow-hidden bg-background/50', className)}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Ожидание...</span>
        </div>
      )}
    </div>
  );
}
