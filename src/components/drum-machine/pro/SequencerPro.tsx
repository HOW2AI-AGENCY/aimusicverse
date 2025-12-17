import React, { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { DrumSound } from '@/lib/drum-kits';
import type { TrackEffects } from '@/hooks/useDrumMachine';

interface SequencerProProps {
  sounds: DrumSound[];
  pattern: Record<string, boolean[]>;
  currentStep: number;
  stepLength: number;
  isPlaying: boolean;
  soloTracks: Set<string>;
  mutedTracks: Set<string>;
  trackEffects: Record<string, TrackEffects>;
  onToggleStep: (soundId: string, step: number) => void;
  onToggleSolo: (soundId: string) => void;
  onToggleMute: (soundId: string) => void;
  onVolumeChange?: (soundId: string, volume: number) => void;
  className?: string;
}

interface TrackRowProps {
  sound: DrumSound;
  steps: boolean[];
  currentStep: number;
  stepLength: number;
  isPlaying: boolean;
  isSolo: boolean;
  isMuted: boolean;
  hasSoloActive: boolean;
  trackVolume: number;
  onToggleStep: (step: number) => void;
  onToggleSolo: () => void;
  onToggleMute: () => void;
  onVolumeChange?: (volume: number) => void;
}

const TrackRow = memo(function TrackRow({
  sound,
  steps,
  currentStep,
  stepLength,
  isPlaying,
  isSolo,
  isMuted,
  hasSoloActive,
  trackVolume,
  onToggleStep,
  onToggleSolo,
  onToggleMute,
  onVolumeChange
}: TrackRowProps) {
  const isAudible = (!hasSoloActive || isSolo) && !isMuted;
  
  return (
    <div className={cn(
      'flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors',
      'hover:bg-muted/30',
      !isAudible && 'opacity-50'
    )}>
      {/* Track Controls */}
      <div className="flex items-center gap-1 w-28 shrink-0">
        {/* Solo */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-7 w-7 text-xs font-bold rounded-md',
            isSolo && 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
          onClick={onToggleSolo}
        >
          S
        </Button>
        
        {/* Mute */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-7 w-7 rounded-md',
            isMuted && 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
          )}
          onClick={onToggleMute}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </Button>
        
        {/* Track name with color indicator */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div 
            className="w-3 h-3 rounded-sm shrink-0"
            style={{ backgroundColor: sound.color }}
          />
          <span className="text-xs font-medium truncate">
            {sound.shortName}
          </span>
        </div>
      </div>

      {/* Volume Slider */}
      {onVolumeChange && (
        <div className="w-16 shrink-0">
          <Slider
            value={[trackVolume]}
            min={-40}
            max={6}
            step={1}
            onValueChange={([v]) => onVolumeChange(v)}
            className="w-full"
          />
        </div>
      )}

      {/* Step Grid */}
      <div className="flex gap-px flex-1 overflow-x-auto">
        {steps.slice(0, stepLength).map((active, step) => {
          const isCurrentStep = isPlaying && step === currentStep;
          const isDownbeat = step % 4 === 0;
          const isGroupStart = step % 4 === 0;
          
          return (
            <button
              key={step}
              type="button"
              onClick={() => onToggleStep(step)}
              className={cn(
                'flex-1 min-w-[24px] h-8 rounded-sm transition-all duration-50',
                'border border-transparent',
                'hover:brightness-110 hover:border-white/20',
                isGroupStart && 'ml-1 first:ml-0',
                // Inactive states
                !active && isDownbeat && 'bg-muted/60',
                !active && !isDownbeat && 'bg-muted/30',
                // Current step highlight
                isCurrentStep && 'ring-2 ring-primary ring-offset-1 ring-offset-background'
              )}
              style={{
                backgroundColor: active ? sound.color : undefined,
                boxShadow: active && isCurrentStep 
                  ? `0 0 12px ${sound.color}` 
                  : active 
                    ? `inset 0 1px 0 rgba(255,255,255,0.3)` 
                    : undefined
              }}
            />
          );
        })}
      </div>
    </div>
  );
});

export const SequencerPro = memo(function SequencerPro({
  sounds,
  pattern,
  currentStep,
  stepLength,
  isPlaying,
  soloTracks,
  mutedTracks,
  trackEffects,
  onToggleStep,
  onToggleSolo,
  onToggleMute,
  onVolumeChange,
  className
}: SequencerProProps) {
  const hasSoloActive = soloTracks.size > 0;

  return (
    <div className={cn(
      'flex flex-col rounded-xl overflow-hidden',
      'bg-gradient-to-br from-card/50 to-muted/30',
      'border border-border/30',
      className
    )}>
      {/* Header with step numbers */}
      <div className="flex items-center gap-2 px-2 py-2 border-b border-border/30 bg-muted/20">
        <div className="w-28 shrink-0" />
        {onVolumeChange && <div className="w-16 shrink-0 text-[10px] text-muted-foreground text-center">VOL</div>}
        <div className="flex gap-px flex-1">
          {Array.from({ length: stepLength }, (_, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 min-w-[24px] text-center text-[10px]',
                'text-muted-foreground',
                i % 4 === 0 && 'font-bold text-foreground ml-1 first:ml-0'
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Track rows */}
      <div className="flex flex-col p-1">
        {sounds.map((sound) => (
          <TrackRow
            key={sound.id}
            sound={sound}
            steps={pattern[sound.id] || Array(stepLength).fill(false)}
            currentStep={currentStep}
            stepLength={stepLength}
            isPlaying={isPlaying}
            isSolo={soloTracks.has(sound.id)}
            isMuted={mutedTracks.has(sound.id)}
            hasSoloActive={hasSoloActive}
            trackVolume={trackEffects[sound.id]?.volume || 0}
            onToggleStep={(step) => onToggleStep(sound.id, step)}
            onToggleSolo={() => onToggleSolo(sound.id)}
            onToggleMute={() => onToggleMute(sound.id)}
            onVolumeChange={onVolumeChange ? (vol) => onVolumeChange(sound.id, vol) : undefined}
          />
        ))}
      </div>

      {/* Beat markers at bottom */}
      <div className="flex items-center gap-2 px-2 py-2 border-t border-border/30 bg-muted/10">
        <div className="w-28 shrink-0" />
        {onVolumeChange && <div className="w-16 shrink-0" />}
        <div className="flex gap-1 flex-1">
          {Array.from({ length: stepLength / 4 }, (_, beatGroup) => (
            <div
              key={beatGroup}
              className="flex-1 flex gap-px"
            >
              {Array.from({ length: 4 }, (_, beat) => {
                const step = beatGroup * 4 + beat;
                return (
                  <div
                    key={beat}
                    className={cn(
                      'flex-1 h-1.5 rounded-full transition-all duration-75',
                      isPlaying && step === currentStep 
                        ? 'bg-primary shadow-sm shadow-primary/50' 
                        : 'bg-muted/50'
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
