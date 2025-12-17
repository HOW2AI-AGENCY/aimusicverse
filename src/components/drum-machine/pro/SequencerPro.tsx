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
      'flex items-center gap-2 py-2 px-3 rounded-xl transition-all',
      'hover:bg-muted/20',
      !isAudible && 'opacity-40'
    )}>
      {/* Track Controls */}
      <div className="flex items-center gap-1.5 w-32 shrink-0">
        {/* Color indicator */}
        <div 
          className="w-1.5 h-8 rounded-full shrink-0 shadow-sm"
          style={{ 
            backgroundColor: sound.color,
            boxShadow: `0 0 8px ${sound.color}40`
          }}
        />
        
        {/* Solo */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 text-xs font-bold rounded-lg transition-all',
            isSolo 
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30' 
              : 'hover:bg-primary/20 text-muted-foreground'
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
            'h-8 w-8 rounded-lg transition-all',
            isMuted 
              ? 'bg-destructive text-destructive-foreground shadow-md shadow-destructive/30' 
              : 'hover:bg-destructive/20 text-muted-foreground'
          )}
          onClick={onToggleMute}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
        
        {/* Track name */}
        <span className="text-sm font-semibold truncate flex-1">
          {sound.shortName}
        </span>
      </div>

      {/* Volume Slider */}
      {onVolumeChange && (
        <div className="w-20 shrink-0 px-1">
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
      <div className="flex gap-0.5 flex-1 overflow-x-auto py-1">
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
                'flex-1 min-w-[26px] h-9 rounded-md transition-all duration-75',
                'hover:brightness-125',
                isGroupStart && 'ml-1.5 first:ml-0',
                !active && isDownbeat && 'bg-muted/50',
                !active && !isDownbeat && 'bg-muted/25',
                isCurrentStep && !active && 'ring-2 ring-primary/50'
              )}
              style={{
                backgroundColor: active ? sound.color : undefined,
                boxShadow: active 
                  ? isCurrentStep 
                    ? `0 0 16px ${sound.color}, inset 0 1px 0 rgba(255,255,255,0.4)` 
                    : `inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.2)`
                  : undefined,
                transform: active && isCurrentStep ? 'scale(1.05)' : undefined
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
      'flex flex-col rounded-2xl overflow-hidden',
      'bg-gradient-to-b from-[hsl(var(--card)/0.6)] to-[hsl(var(--muted)/0.3)]',
      'border border-border/30',
      'shadow-inner',
      className
    )}>
      {/* Header with step numbers */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border/20 bg-black/20">
        <div className="w-32 shrink-0 text-xs font-medium text-muted-foreground pl-2">
          TRACKS
        </div>
        {onVolumeChange && (
          <div className="w-20 shrink-0 text-[10px] text-muted-foreground text-center font-medium">
            VOL
          </div>
        )}
        <div className="flex gap-0.5 flex-1">
          {Array.from({ length: stepLength }, (_, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 min-w-[26px] text-center text-[10px] font-mono',
                i % 4 === 0 
                  ? 'font-bold text-foreground ml-1.5 first:ml-0' 
                  : 'text-muted-foreground'
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Track rows */}
      <div className="flex flex-col p-2 gap-0.5">
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

      {/* Playhead indicator at bottom */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-border/20 bg-black/10">
        <div className="w-32 shrink-0" />
        {onVolumeChange && <div className="w-20 shrink-0" />}
        <div className="flex gap-1.5 flex-1">
          {Array.from({ length: stepLength / 4 }, (_, beatGroup) => (
            <div
              key={beatGroup}
              className="flex-1 flex gap-0.5"
            >
              {Array.from({ length: 4 }, (_, beat) => {
                const step = beatGroup * 4 + beat;
                const isActive = isPlaying && step === currentStep;
                return (
                  <div
                    key={beat}
                    className={cn(
                      'flex-1 h-2 rounded-full transition-all duration-100',
                      isActive 
                        ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]' 
                        : beat === 0 
                          ? 'bg-muted/50' 
                          : 'bg-muted/30'
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
