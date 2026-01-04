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
        'relative aspect-square rounded-2xl transition-all duration-100',
        'flex flex-col items-center justify-center gap-2',
        'touch-none select-none cursor-pointer',
        'overflow-hidden',
        isPressed && 'scale-[0.96]',
        !isAudible && 'opacity-30 grayscale'
      )}
      style={{
        background: `
          linear-gradient(180deg, 
            color-mix(in srgb, ${sound.color} 80%, white 20%) 0%,
            ${sound.color} 40%,
            color-mix(in srgb, ${sound.color} 80%, black 20%) 100%
          )
        `,
        boxShadow: isActive 
          ? `
              0 0 0 3px rgba(255,255,255,0.9),
              0 0 30px ${sound.color},
              inset 0 2px 0 rgba(255,255,255,0.3),
              inset 0 -4px 8px rgba(0,0,0,0.4)
            ` 
          : `
              inset 0 2px 0 rgba(255,255,255,0.25),
              inset 0 -4px 8px rgba(0,0,0,0.35),
              0 4px 12px rgba(0,0,0,0.3)
            `
      }}
    >
      {/* LED indicator strip at top */}
      <div className="absolute top-0 left-0 right-0 h-2 flex justify-center items-center gap-1">
        <div 
          className={cn(
            'w-8 h-1 rounded-full transition-all duration-75',
            isActive ? 'opacity-100' : 'opacity-20'
          )}
          style={{
            background: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
            boxShadow: isActive ? `0 0 12px #fff, 0 0 20px ${sound.color}` : 'none'
          }}
        />
      </div>
      
      {/* Short name - big */}
      <span className="text-3xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-wide">
        {sound.shortName}
      </span>
      
      {/* Full name - small */}
      <span className="text-[11px] font-semibold text-white/80 uppercase tracking-wider">
        {sound.name}
      </span>

      {/* Hit flash overlay */}
      <div 
        className={cn(
          'absolute inset-0 bg-white transition-opacity duration-50 pointer-events-none rounded-2xl',
          isActive ? 'opacity-40' : 'opacity-0'
        )}
      />
      
      {/* Status indicators */}
      <div className="absolute bottom-2 left-2 right-2 flex justify-between">
        {isMuted && (
          <div className="px-1.5 py-0.5 rounded-md bg-black/60 text-[9px] font-bold text-destructive border border-destructive/50">
            MUTE
          </div>
        )}
        {isSolo && (
          <div className="px-1.5 py-0.5 rounded-md bg-black/60 text-[9px] font-bold text-primary border border-primary/50">
            SOLO
          </div>
        )}
      </div>
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
      'grid grid-cols-4 gap-4 p-5',
      'bg-gradient-to-b from-[hsl(var(--card)/0.8)] to-[hsl(var(--muted)/0.4)]',
      'rounded-2xl border border-border/30',
      'shadow-inner',
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
