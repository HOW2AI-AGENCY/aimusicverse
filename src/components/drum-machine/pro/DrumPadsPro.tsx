import React, { memo, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import type { DrumSound } from '@/lib/drum-kits';

interface DrumPadsProProps {
  sounds: DrumSound[];
  onPadTrigger: (soundId: string, velocity?: number) => void;
  activePads: Set<string>;
  mutedTracks: Set<string>;
  soloTracks: Set<string>;
  className?: string;
}

interface PadProps {
  sound: DrumSound;
  isActive: boolean;
  isMuted: boolean;
  isSolo: boolean;
  hasSoloActive: boolean;
  onTrigger: (velocity?: number) => void;
}

const Pad = memo(function Pad({ 
  sound, 
  isActive, 
  isMuted, 
  isSolo,
  hasSoloActive,
  onTrigger 
}: PadProps) {
  const [isPressed, setIsPressed] = useState(false);
  const isAudible = (!hasSoloActive || isSolo) && !isMuted;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPressed(true);
    
    // Calculate velocity from pressure or use default
    const velocity = e.pressure > 0 ? Math.min(1, e.pressure * 2) : 0.85;
    onTrigger(velocity);
  }, [onTrigger]);

  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setIsPressed(false);
  }, []);

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className={cn(
        'relative aspect-square rounded-xl transition-all duration-75',
        'flex flex-col items-center justify-center gap-1.5',
        'touch-none select-none cursor-pointer',
        'border-2 overflow-hidden',
        'shadow-lg',
        isPressed && 'scale-95',
        !isAudible && 'opacity-40'
      )}
      style={{
        background: `linear-gradient(145deg, ${sound.color} 0%, color-mix(in srgb, ${sound.color} 70%, black) 100%)`,
        borderColor: isActive ? 'white' : `color-mix(in srgb, ${sound.color} 50%, black)`,
        boxShadow: isActive 
          ? `0 0 20px ${sound.color}, inset 0 1px 0 rgba(255,255,255,0.3)` 
          : `inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.3)`
      }}
    >
      {/* LED indicator */}
      <div 
        className={cn(
          'absolute top-2 right-2 w-2 h-2 rounded-full transition-all',
          isActive ? 'opacity-100' : 'opacity-30'
        )}
        style={{
          background: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
          boxShadow: isActive ? '0 0 8px #fff, 0 0 16px ' + sound.color : 'none'
        }}
      />
      
      {/* Short name - big */}
      <span className="text-2xl font-black text-white drop-shadow-lg tracking-wider">
        {sound.shortName}
      </span>
      
      {/* Full name - small */}
      <span className="text-[10px] font-medium text-white/70 uppercase tracking-wide">
        {sound.name}
      </span>

      {/* Hit flash overlay */}
      <div 
        className={cn(
          'absolute inset-0 bg-white transition-opacity duration-75 pointer-events-none',
          isActive ? 'opacity-30' : 'opacity-0'
        )}
      />
      
      {/* Mute/Solo indicators */}
      {isMuted && (
        <div className="absolute bottom-1.5 left-1.5 px-1 py-0.5 rounded bg-destructive/80 text-[8px] font-bold text-white">
          M
        </div>
      )}
      {isSolo && (
        <div className="absolute bottom-1.5 left-1.5 px-1 py-0.5 rounded bg-primary/80 text-[8px] font-bold text-white">
          S
        </div>
      )}
    </button>
  );
});

export const DrumPadsPro = memo(function DrumPadsPro({
  sounds,
  onPadTrigger,
  activePads,
  mutedTracks,
  soloTracks,
  className
}: DrumPadsProProps) {
  const hasSoloActive = soloTracks.size > 0;

  return (
    <div className={cn(
      'grid grid-cols-4 gap-3 p-4',
      'bg-gradient-to-br from-card/50 to-muted/30 rounded-2xl',
      'border border-border/30',
      className
    )}>
      {sounds.map((sound) => (
        <Pad
          key={sound.id}
          sound={sound}
          isActive={activePads.has(sound.id)}
          isMuted={mutedTracks.has(sound.id)}
          isSolo={soloTracks.has(sound.id)}
          hasSoloActive={hasSoloActive}
          onTrigger={(velocity) => onPadTrigger(sound.id, velocity)}
        />
      ))}
    </div>
  );
});
