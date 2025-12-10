/**
 * Metronome - Visual and audio metronome for guitar recording
 * Helps maintain tempo during recording
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Clock, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetronomeProps {
  defaultBpm?: number;
  className?: string;
}

// Generate metronome click sounds using Web Audio API
const createClickSound = (audioContext: AudioContext, isAccent: boolean) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = isAccent ? 1200 : 800;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.05);
};

export function Metronome({ defaultBpm = 120, className }: MetronomeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(defaultBpm);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new AudioContext();
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Metronome tick logic
  const tick = useCallback(() => {
    setCurrentBeat(prev => {
      const nextBeat = (prev + 1) % beatsPerMeasure;
      
      // Play sound
      if (!isMuted && audioContextRef.current) {
        const isAccent = nextBeat === 0; // First beat is accented
        createClickSound(audioContextRef.current, isAccent);
      }
      
      return nextBeat;
    });
  }, [beatsPerMeasure, isMuted]);

  // Start/stop metronome
  useEffect(() => {
    if (isPlaying) {
      const interval = 60000 / bpm; // Convert BPM to milliseconds
      
      // Immediate first tick
      tick();
      
      intervalRef.current = setInterval(tick, interval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setCurrentBeat(0);
    }
  }, [isPlaying, bpm, tick]);

  const handleTogglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const handleBpmChange = (value: number[]) => {
    setBpm(value[0]);
  };

  const handleTimeSignatureChange = (beats: number) => {
    setBeatsPerMeasure(beats);
    setCurrentBeat(0);
  };

  return (
    <Card className={cn('p-6 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Метроном</h3>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMuted(prev => !prev)}
          className="shrink-0"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Visual beats */}
      <div className="flex items-center justify-center gap-2 py-4">
        {Array.from({ length: beatsPerMeasure }).map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-colors',
              currentBeat === i && isPlaying
                ? i === 0
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/70 text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
            animate={
              currentBeat === i && isPlaying
                ? {
                    scale: [1, 1.2, 1],
                    transition: { duration: 0.1 },
                  }
                : { scale: 1 }
            }
          >
            {i + 1}
          </motion.div>
        ))}
      </div>

      {/* BPM Display */}
      <div className="text-center space-y-2">
        <motion.div
          className="text-4xl font-bold font-mono"
          animate={isPlaying && currentBeat === 0 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.1 }}
        >
          {bpm}
        </motion.div>
        <p className="text-sm text-muted-foreground">BPM</p>
      </div>

      {/* BPM Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Темп</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBpm(Math.max(40, bpm - 5))}
              disabled={bpm <= 40}
            >
              -5
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBpm(Math.min(240, bpm + 5))}
              disabled={bpm >= 240}
            >
              +5
            </Button>
          </div>
        </div>
        <Slider
          value={[bpm]}
          onValueChange={handleBpmChange}
          min={40}
          max={240}
          step={1}
          className="w-full"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>40</span>
          <span>240</span>
        </div>
      </div>

      {/* Time Signature */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Размер</p>
        <div className="grid grid-cols-4 gap-2">
          {[3, 4, 5, 6].map(beats => (
            <Button
              key={beats}
              variant={beatsPerMeasure === beats ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTimeSignatureChange(beats)}
              disabled={isPlaying}
            >
              {beats}/4
            </Button>
          ))}
        </div>
      </div>

      {/* Tempo presets */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Пресеты</p>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBpm(60)}
            className="text-xs"
          >
            Медленно (60)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBpm(120)}
            className="text-xs"
          >
            Средне (120)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBpm(180)}
            className="text-xs"
          >
            Быстро (180)
          </Button>
        </div>
      </div>

      {/* Play/Pause button */}
      <Button
        onClick={handleTogglePlay}
        className="w-full"
        size="lg"
      >
        {isPlaying ? (
          <>
            <Pause className="w-5 h-5 mr-2" />
            Стоп
          </>
        ) : (
          <>
            <Play className="w-5 h-5 mr-2" />
            Старт
          </>
        )}
      </Button>

      {/* Helper text */}
      {isPlaying && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-center text-muted-foreground"
        >
          Следуйте ритму для ровной записи
        </motion.p>
      )}
    </Card>
  );
}
