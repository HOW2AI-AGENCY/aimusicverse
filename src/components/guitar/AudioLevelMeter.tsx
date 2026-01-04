/**
 * AudioLevelMeter - Real-time audio level visualization during recording
 * Shows input signal level with color-coded bars
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from '@/lib/motion';
import { Activity, AlertTriangle, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioLevelMeterProps {
  isActive?: boolean;
  mediaStream?: MediaStream | null;
  className?: string;
}

export function AudioLevelMeter({ 
  isActive = false, 
  mediaStream = null,
  className 
}: AudioLevelMeterProps) {
  const [level, setLevel] = useState(0);
  const [peakLevel, setPeakLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!isActive || !mediaStream) {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current?.state === 'running') {
        audioContextRef.current.close();
      }
      setLevel(0);
      setPeakLevel(0);
      return;
    }

    // Initialize audio context and analyser
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(mediaStream);

    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.3;
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    sourceRef.current = source;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Animation loop to update level
    const updateLevel = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average level
      const sum = dataArray.reduce((acc, val) => acc + val, 0);
      const average = sum / dataArray.length;
      const normalizedLevel = (average / 255) * 100;

      setLevel(normalizedLevel);

      // Update peak level (decays slowly)
      setPeakLevel(prev => {
        if (normalizedLevel > prev) {
          return normalizedLevel;
        }
        return Math.max(0, prev - 0.5); // Slow decay
      });

      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current?.state === 'running') {
        audioContextRef.current.close();
      }
    };
  }, [isActive, mediaStream]);

  // Determine color based on level
  const getColorClass = (level: number) => {
    if (level < 30) return 'bg-green-500';
    if (level < 70) return 'bg-yellow-500';
    if (level < 85) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getLevelStatus = (level: number) => {
    if (level < 10) return { text: 'Тихо', icon: Volume2, color: 'text-muted-foreground' };
    if (level < 30) return { text: 'Низкий', icon: Volume2, color: 'text-green-500' };
    if (level < 70) return { text: 'Хорошо', icon: Activity, color: 'text-green-500' };
    if (level < 85) return { text: 'Громко', icon: Activity, color: 'text-orange-500' };
    return { text: 'Перегруз!', icon: AlertTriangle, color: 'text-red-500' };
  };

  const status = getLevelStatus(level);
  const StatusIcon = status.icon;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Level bars */}
      <div className="relative h-16 bg-muted/30 rounded-lg overflow-hidden border border-border">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-yellow-500/10 via-orange-500/10 to-red-500/10" />
        
        {/* Segmented bars */}
        <div className="absolute inset-0 flex gap-1 p-2">
          {Array.from({ length: 20 }).map((_, i) => {
            const segmentLevel = (i + 1) * 5;
            const isActive = level >= segmentLevel;
            const isPeak = peakLevel >= segmentLevel && peakLevel < segmentLevel + 5;
            
            return (
              <motion.div
                key={i}
                className={cn(
                  'flex-1 rounded-sm transition-all duration-75',
                  isActive ? getColorClass(segmentLevel) : 'bg-muted',
                  isPeak && 'ring-2 ring-white'
                )}
                initial={{ scaleY: 0 }}
                animate={{ 
                  scaleY: isActive ? 1 : 0.3,
                  opacity: isActive ? 1 : 0.3,
                }}
                transition={{ duration: 0.05 }}
                style={{ transformOrigin: 'bottom' }}
              />
            );
          })}
        </div>

        {/* Peak indicator line */}
        {peakLevel > 0 && (
          <motion.div
            className="absolute top-2 bottom-2 w-0.5 bg-white shadow-lg"
            style={{ left: `${peakLevel}%` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
          />
        )}
      </div>

      {/* Status and level info */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn('w-4 h-4', status.color)} />
          <span className={cn('font-medium', status.color)}>
            {status.text}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Текущий: <span className="font-mono font-semibold">{Math.round(level)}%</span>
          </span>
          <span className="text-xs text-muted-foreground">
            Пик: <span className="font-mono font-semibold">{Math.round(peakLevel)}%</span>
          </span>
        </div>
      </div>

      {/* Warning for low/high levels */}
      {isActive && level > 0 && (
        <>
          {level < 15 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-muted-foreground bg-muted/50 rounded p-2 border border-border"
            >
              ⚠️ Сигнал слишком тихий. Увеличьте громкость или подойдите ближе к микрофону.
            </motion.div>
          )}
          
          {level > 85 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-500 bg-red-500/10 rounded p-2 border border-red-500/20"
            >
              ⚠️ Перегрузка сигнала! Уменьшите громкость для качественной записи.
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
