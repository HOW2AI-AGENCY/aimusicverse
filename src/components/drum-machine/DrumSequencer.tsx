import React, { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DrumSound } from '@/lib/drum-kits';

interface DrumSequencerProps {
  sounds: DrumSound[];
  pattern: Record<string, boolean[]>;
  currentStep: number;
  isPlaying: boolean;
  soloTracks: Set<string>;
  mutedTracks: Set<string>;
  onToggleStep: (soundId: string, step: number) => void;
  onToggleSolo: (soundId: string) => void;
  onToggleMute: (soundId: string) => void;
  className?: string;
}

interface SequencerRowProps {
  sound: DrumSound;
  steps: boolean[];
  currentStep: number;
  isPlaying: boolean;
  isSolo: boolean;
  isMuted: boolean;
  hasSoloActive: boolean;
  onToggleStep: (step: number) => void;
  onToggleSolo: () => void;
  onToggleMute: () => void;
}

const SequencerRow = memo(function SequencerRow({
  sound,
  steps,
  currentStep,
  isPlaying,
  isSolo,
  isMuted,
  hasSoloActive,
  onToggleStep,
  onToggleSolo,
  onToggleMute
}: SequencerRowProps) {
  const isAudible = (!hasSoloActive || isSolo) && !isMuted;
  
  return (
    <div className="flex items-center gap-1">
      {/* Track label and controls */}
      <div className="flex items-center gap-1 w-20 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-6 w-6 text-xs',
            isSolo && 'bg-primary text-primary-foreground'
          )}
          onClick={onToggleSolo}
        >
          S
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-6 w-6',
            isMuted && 'bg-destructive text-destructive-foreground'
          )}
          onClick={onToggleMute}
        >
          {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
        </Button>
        <span 
          className={cn(
            'text-xs font-medium truncate',
            !isAudible && 'opacity-40'
          )}
          style={{ color: sound.color }}
        >
          {sound.shortName}
        </span>
      </div>
      
      {/* Steps */}
      <div className="flex gap-0.5 flex-1">
        {steps.map((active, step) => {
          const isCurrentStep = isPlaying && step === currentStep;
          const isDownbeat = step % 4 === 0;
          
          return (
            <button
              key={step}
              type="button"
              onClick={() => onToggleStep(step)}
              className={cn(
                'flex-1 h-7 rounded-sm transition-all duration-75',
                'border border-border/50',
                'hover:brightness-110',
                active ? 'opacity-100' : 'opacity-30',
                isDownbeat && !active && 'bg-muted/50',
                isCurrentStep && 'ring-1 ring-primary ring-offset-1 ring-offset-background'
              )}
              style={{
                backgroundColor: active ? sound.color : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
});

export const DrumSequencer = memo(function DrumSequencer({
  sounds,
  pattern,
  currentStep,
  isPlaying,
  soloTracks,
  mutedTracks,
  onToggleStep,
  onToggleSolo,
  onToggleMute,
  className
}: DrumSequencerProps) {
  const hasSoloActive = soloTracks.size > 0;

  // Step indicators
  const stepIndicators = Array.from({ length: 16 }, (_, i) => (
    <div
      key={i}
      className={cn(
        'flex-1 text-center text-[10px] text-muted-foreground',
        i % 4 === 0 && 'font-bold'
      )}
    >
      {i + 1}
    </div>
  ));

  return (
    <div className={cn('flex flex-col gap-1 p-2', className)}>
      {/* Step numbers header */}
      <div className="flex gap-0.5 pl-20">
        {stepIndicators}
      </div>
      
      {/* Sequencer rows */}
      {sounds.map((sound) => (
        <SequencerRow
          key={sound.id}
          sound={sound}
          steps={pattern[sound.id] || Array(16).fill(false)}
          currentStep={currentStep}
          isPlaying={isPlaying}
          isSolo={soloTracks.has(sound.id)}
          isMuted={mutedTracks.has(sound.id)}
          hasSoloActive={hasSoloActive}
          onToggleStep={(step) => onToggleStep(sound.id, step)}
          onToggleSolo={() => onToggleSolo(sound.id)}
          onToggleMute={() => onToggleMute(sound.id)}
        />
      ))}
      
      {/* Beat markers */}
      <div className="flex gap-0.5 pl-20 mt-1">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="flex-1 h-1 bg-muted rounded-full flex gap-0.5"
          >
            {Array.from({ length: 4 }, (_, j) => {
              const step = i * 4 + j;
              return (
                <div
                  key={j}
                  className={cn(
                    'flex-1 rounded-full transition-colors',
                    isPlaying && step === currentStep ? 'bg-primary' : 'bg-transparent'
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});
