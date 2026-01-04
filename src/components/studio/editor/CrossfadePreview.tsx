/**
 * CrossfadePreview
 * 
 * Audio preview component with smooth fade-in/fade-out crossfade
 * between original and replacement section versions
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Play, Pause, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';

interface CrossfadePreviewProps {
  originalAudioUrl: string;
  replacementAudioUrl: string;
  sectionStart: number;
  sectionEnd: number;
  crossfadeDuration?: number; // Duration of crossfade in seconds
  onComplete?: () => void;
  className?: string;
}

type PreviewMode = 'original' | 'replacement' | 'crossfade';

export function CrossfadePreview({
  originalAudioUrl,
  replacementAudioUrl,
  sectionStart,
  sectionEnd,
  crossfadeDuration = 0.5,
  onComplete,
  className,
}: CrossfadePreviewProps) {
  const [mode, setMode] = useState<PreviewMode>('crossfade');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(sectionStart);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  
  // Audio refs for crossfade
  const originalAudioRef = useRef<HTMLAudioElement | null>(null);
  const replacementAudioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const gainNodesRef = useRef<{ original: GainNode | null; replacement: GainNode | null }>({
    original: null,
    replacement: null,
  });
  const audioContextRef = useRef<AudioContext | null>(null);

  const sectionDuration = sectionEnd - sectionStart;
  const crossfadePoint = sectionStart + (sectionDuration / 2); // Crossfade in the middle

  // Initialize audio elements
  useEffect(() => {
    const originalAudio = new Audio(originalAudioUrl);
    const replacementAudio = new Audio(replacementAudioUrl);
    
    originalAudio.preload = 'auto';
    replacementAudio.preload = 'auto';
    
    originalAudioRef.current = originalAudio;
    replacementAudioRef.current = replacementAudio;

    return () => {
      originalAudio.pause();
      replacementAudio.pause();
      originalAudio.src = '';
      replacementAudio.src = '';
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      audioContextRef.current?.close();
    };
  }, [originalAudioUrl, replacementAudioUrl]);

  // Update volume
  useEffect(() => {
    const effectiveVolume = isMuted ? 0 : volume;
    if (originalAudioRef.current) originalAudioRef.current.volume = effectiveVolume;
    if (replacementAudioRef.current) replacementAudioRef.current.volume = effectiveVolume;
  }, [volume, isMuted]);

  // Crossfade logic - smoothly transition volume between tracks
  const applyCrossfade = useCallback((time: number) => {
    if (!originalAudioRef.current || !replacementAudioRef.current) return;
    
    const effectiveVolume = isMuted ? 0 : volume;
    
    if (mode === 'original') {
      originalAudioRef.current.volume = effectiveVolume;
      replacementAudioRef.current.volume = 0;
      return;
    }
    
    if (mode === 'replacement') {
      originalAudioRef.current.volume = 0;
      replacementAudioRef.current.volume = effectiveVolume;
      return;
    }
    
    // Crossfade mode
    const fadeStart = crossfadePoint - (crossfadeDuration / 2);
    const fadeEnd = crossfadePoint + (crossfadeDuration / 2);
    
    if (time < fadeStart) {
      // Before crossfade - play original
      originalAudioRef.current.volume = effectiveVolume;
      replacementAudioRef.current.volume = 0;
    } else if (time > fadeEnd) {
      // After crossfade - play replacement
      originalAudioRef.current.volume = 0;
      replacementAudioRef.current.volume = effectiveVolume;
    } else {
      // During crossfade - smooth transition
      const progress = (time - fadeStart) / crossfadeDuration;
      // Use equal-power crossfade curve for smoother transition
      const originalVolume = Math.cos(progress * Math.PI / 2) * effectiveVolume;
      const replacementVolume = Math.sin(progress * Math.PI / 2) * effectiveVolume;
      
      originalAudioRef.current.volume = originalVolume;
      replacementAudioRef.current.volume = replacementVolume;
    }
  }, [mode, crossfadePoint, crossfadeDuration, volume, isMuted]);

  // Animation loop
  const updatePlayback = useCallback(() => {
    const original = originalAudioRef.current;
    const replacement = replacementAudioRef.current;
    
    if (!original || !replacement) return;
    
    const time = original.currentTime;
    setCurrentTime(time);
    applyCrossfade(time);
    
    // Check if we've reached the end of section
    if (time >= sectionEnd) {
      original.pause();
      replacement.pause();
      setIsPlaying(false);
      onComplete?.();
      return;
    }
    
    animationRef.current = requestAnimationFrame(updatePlayback);
  }, [sectionEnd, applyCrossfade, onComplete]);

  const play = useCallback(async () => {
    const original = originalAudioRef.current;
    const replacement = replacementAudioRef.current;
    
    if (!original || !replacement) return;
    
    // Sync both audio tracks to section start
    original.currentTime = sectionStart;
    replacement.currentTime = 0; // Replacement starts from beginning
    
    try {
      await Promise.all([original.play(), replacement.play()]);
      setIsPlaying(true);
      animationRef.current = requestAnimationFrame(updatePlayback);
    } catch (error) {
      console.error('Playback error:', error);
    }
  }, [sectionStart, updatePlayback]);

  const pause = useCallback(() => {
    originalAudioRef.current?.pause();
    replacementAudioRef.current?.pause();
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const restart = useCallback(() => {
    pause();
    setCurrentTime(sectionStart);
    play();
  }, [pause, sectionStart, play]);

  const togglePlay = useCallback(() => {
    isPlaying ? pause() : play();
  }, [isPlaying, pause, play]);

  // Progress calculation
  const progress = ((currentTime - sectionStart) / sectionDuration) * 100;
  const isCrossfading = currentTime >= (crossfadePoint - crossfadeDuration / 2) && 
                        currentTime <= (crossfadePoint + crossfadeDuration / 2);

  return (
    <div className={cn(
      "rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden",
      className
    )}>
      {/* Visual indicator */}
      <div className="relative h-16 bg-gradient-to-r from-muted/30 to-muted/30 overflow-hidden">
        {/* Progress bar */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-primary/20"
          style={{ width: `${progress}%` }}
        />
        
        {/* Crossfade zone indicator */}
        <div 
          className="absolute inset-y-0 bg-gradient-to-r from-primary/30 via-primary/50 to-accent/30"
          style={{
            left: `${((crossfadePoint - crossfadeDuration - sectionStart) / sectionDuration) * 100}%`,
            width: `${(crossfadeDuration * 2 / sectionDuration) * 100}%`,
          }}
        />
        
        {/* Labels */}
        <div className="absolute inset-0 flex items-center justify-between px-4">
          <motion.div
            animate={{ 
              opacity: currentTime < crossfadePoint ? 1 : 0.3,
              scale: currentTime < crossfadePoint ? 1 : 0.95,
            }}
            className="flex flex-col items-start"
          >
            <span className="text-xs font-medium">Оригинал</span>
            <span className="text-[10px] text-muted-foreground">До замены</span>
          </motion.div>
          
          {/* Crossfade indicator */}
          <AnimatePresence>
            {isCrossfading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/20 border border-primary/30"
              >
                <RefreshCw className="w-3 h-3 text-primary animate-spin" />
                <span className="text-[10px] font-medium text-primary">Crossfade</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.div
            animate={{ 
              opacity: currentTime >= crossfadePoint ? 1 : 0.3,
              scale: currentTime >= crossfadePoint ? 1 : 0.95,
            }}
            className="flex flex-col items-end"
          >
            <span className="text-xs font-medium">Замена</span>
            <span className="text-[10px] text-muted-foreground">Новая секция</span>
          </motion.div>
        </div>
        
        {/* Playhead */}
        <motion.div
          className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-lg"
          style={{ left: `${progress}%` }}
        />
      </div>
      
      {/* Controls */}
      <div className="p-3 space-y-3 border-t border-border/30">
        {/* Mode selector */}
        <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5">
          {(['original', 'crossfade', 'replacement'] as PreviewMode[]).map((m) => (
            <Button
              key={m}
              variant={mode === m ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 h-7 text-xs",
                mode === m && "shadow-sm"
              )}
            >
              {m === 'original' && 'Оригинал'}
              {m === 'crossfade' && '↔ Переход'}
              {m === 'replacement' && 'Замена'}
            </Button>
          ))}
        </div>
        
        {/* Playback controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={togglePlay}
            className="h-10 w-10 rounded-full"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={restart}
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          {/* Time display */}
          <div className="flex-1 text-center">
            <span className="font-mono text-sm">
              {formatTime(currentTime - sectionStart)} / {formatTime(sectionDuration)}
            </span>
          </div>
          
          {/* Volume */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="h-8 w-8"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          
          <div className="w-20">
            <Slider
              value={[volume * 100]}
              onValueChange={([v]) => setVolume(v / 100)}
              max={100}
              step={1}
              className="cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
