import React, { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { DrumSound } from '@/lib/drum-kits';

interface DrumPadGridProps {
  sounds: DrumSound[];
  onPadTrigger: (soundId: string, velocity?: number) => void;
  activePads?: Set<string>;
  className?: string;
}

interface DrumPadProps {
  sound: DrumSound;
  isActive: boolean;
  onTrigger: (velocity?: number) => void;
}

const DrumPad = memo(function DrumPad({ sound, isActive, onTrigger }: DrumPadProps) {
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    // Use pressure for velocity if available
    const velocity = e.pressure > 0 ? Math.min(1, e.pressure * 2) : 0.8;
    onTrigger(velocity);
  }, [onTrigger]);

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      className={cn(
        'relative aspect-square rounded-lg border-2 transition-all duration-75',
        'flex flex-col items-center justify-center gap-1',
        'touch-none select-none',
        'min-h-[60px] min-w-[60px]',
        'active:scale-95',
        isActive && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
        'hover:brightness-110'
      )}
      style={{
        backgroundColor: sound.color,
        borderColor: sound.color,
      }}
    >
      <span className="text-lg font-bold text-white drop-shadow-md">
        {sound.shortName}
      </span>
      <span className="text-[10px] text-white/80 truncate max-w-full px-1">
        {sound.name}
      </span>
      
      {/* Hit flash effect */}
      <div 
        className={cn(
          'absolute inset-0 rounded-lg bg-white/30 transition-opacity duration-75',
          isActive ? 'opacity-100' : 'opacity-0'
        )}
      />
    </button>
  );
});

export const DrumPadGrid = memo(function DrumPadGrid({
  sounds,
  onPadTrigger,
  activePads = new Set(),
  className
}: DrumPadGridProps) {
  return (
    <div className={cn('grid grid-cols-4 gap-2 p-2', className)}>
      {sounds.map((sound) => (
        <DrumPad
          key={sound.id}
          sound={sound}
          isActive={activePads.has(sound.id)}
          onTrigger={(velocity) => onPadTrigger(sound.id, velocity)}
        />
      ))}
    </div>
  );
});
