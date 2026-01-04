/**
 * HardwareChannelStrip - Single channel strip with volume, EQ, and meters
 */

import React, { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { HardwareKnob } from '@/components/ui/hardware/HardwareKnob';
import { VUMeter } from '@/components/ui/hardware/VUMeter';
import { LEDIndicator } from '@/components/ui/hardware/LEDIndicator';
import { Volume2, VolumeX, Headphones } from 'lucide-react';

export interface ChannelStripProps {
  name: string;
  icon?: React.ReactNode;
  color?: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  pan?: number;
  level?: number;
  eqLow?: number;
  eqMid?: number;
  eqHigh?: number;
  hasEffects?: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  onPanChange?: (pan: number) => void;
  onEQLowChange?: (value: number) => void;
  onEQMidChange?: (value: number) => void;
  onEQHighChange?: (value: number) => void;
  onEffectsClick?: () => void;
  compact?: boolean;
  className?: string;
}

export const HardwareChannelStrip = memo(function HardwareChannelStrip({
  name,
  icon,
  color = 'primary',
  volume,
  muted,
  solo,
  pan = 0,
  level = 0,
  eqLow = 0,
  eqMid = 0,
  eqHigh = 0,
  hasEffects = false,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  onPanChange,
  onEQLowChange,
  onEQMidChange,
  onEQHighChange,
  onEffectsClick,
  compact = false,
  className,
}: ChannelStripProps) {
  
  const effectiveLevel = useMemo(() => {
    if (muted) return 0;
    return level * (volume / 100);
  }, [muted, level, volume]);

  return (
    <div className={cn(
      'flex flex-col items-center rounded-lg',
      'bg-gradient-to-b from-zinc-800 via-zinc-850 to-zinc-900',
      'border border-zinc-700',
      'shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.3)]',
      compact ? 'p-2 w-16' : 'p-3 w-24',
      className
    )}>
      {/* Channel name with icon */}
      <div className="flex items-center gap-1 mb-2">
        {icon && <span className="text-zinc-400">{icon}</span>}
        <span className={cn(
          'font-bold uppercase tracking-wider truncate',
          compact ? 'text-[8px]' : 'text-[10px]',
          muted ? 'text-zinc-600' : 'text-zinc-300'
        )}>
          {name}
        </span>
      </div>

      {/* FX indicator */}
      {hasEffects && (
        <button
          onClick={onEffectsClick}
          className={cn(
            'mb-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase',
            'bg-zinc-700 border border-zinc-600 transition-colors',
            'hover:bg-zinc-600'
          )}
        >
          FX
        </button>
      )}

      {/* Mini EQ (only if not compact) */}
      {!compact && onEQLowChange && (
        <div className="flex gap-1 mb-3">
          <HardwareKnob
            value={eqLow}
            min={-12}
            max={12}
            step={1}
            onChange={onEQLowChange}
            size="xs"
            variant="dark"
            showValue={false}
            bipolar
          />
          <HardwareKnob
            value={eqMid}
            min={-12}
            max={12}
            step={1}
            onChange={onEQMidChange!}
            size="xs"
            variant="dark"
            showValue={false}
            bipolar
          />
          <HardwareKnob
            value={eqHigh}
            min={-12}
            max={12}
            step={1}
            onChange={onEQHighChange!}
            size="xs"
            variant="dark"
            showValue={false}
            bipolar
          />
        </div>
      )}

      {/* Pan knob (if available) */}
      {!compact && onPanChange && (
        <div className="mb-2">
          <HardwareKnob
            value={pan}
            min={-100}
            max={100}
            step={1}
            onChange={onPanChange}
            size="xs"
            variant="dark"
            label="PAN"
            bipolar
            valueFormatter={(v) => v === 0 ? 'C' : v < 0 ? `L${Math.abs(v)}` : `R${v}`}
          />
        </div>
      )}

      {/* Volume knob */}
      <HardwareKnob
        value={volume}
        min={0}
        max={100}
        step={1}
        onChange={onVolumeChange}
        size={compact ? 'sm' : 'md'}
        variant="dark"
        showValue={!compact}
        disabled={muted}
        valueFormatter={(v) => `${v}%`}
      />

      {/* VU Meter */}
      <div className="my-2">
        <VUMeter
          value={effectiveLevel}
          type="led"
          size={compact ? 'xs' : 'sm'}
          showDb={false}
        />
      </div>

      {/* Mute/Solo buttons */}
      <div className="flex gap-1 mt-auto">
        <button
          onClick={onMuteToggle}
          className={cn(
            'flex items-center justify-center rounded transition-all',
            compact ? 'w-6 h-6' : 'w-8 h-8',
            'bg-zinc-700 border border-zinc-600',
            'shadow-[0_2px_0_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]',
            'active:translate-y-0.5 active:shadow-none',
            muted && 'bg-red-500/30 border-red-500/50'
          )}
        >
          {muted ? (
            <VolumeX className={cn(compact ? 'w-3 h-3' : 'w-4 h-4', 'text-red-400')} />
          ) : (
            <span className={cn('font-bold text-zinc-400', compact ? 'text-[8px]' : 'text-[10px]')}>M</span>
          )}
        </button>
        
        <button
          onClick={onSoloToggle}
          className={cn(
            'flex items-center justify-center rounded transition-all',
            compact ? 'w-6 h-6' : 'w-8 h-8',
            'bg-zinc-700 border border-zinc-600',
            'shadow-[0_2px_0_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]',
            'active:translate-y-0.5 active:shadow-none',
            solo && 'bg-yellow-500/30 border-yellow-500/50'
          )}
        >
          {solo ? (
            <Headphones className={cn(compact ? 'w-3 h-3' : 'w-4 h-4', 'text-yellow-400')} />
          ) : (
            <span className={cn('font-bold text-zinc-400', compact ? 'text-[8px]' : 'text-[10px]')}>S</span>
          )}
        </button>
      </div>

      {/* Status LEDs */}
      <div className="flex gap-2 mt-2">
        <LEDIndicator on={muted} color="red" size="xs" />
        <LEDIndicator on={solo} color="yellow" size="xs" />
        <LEDIndicator on={hasEffects} color="blue" size="xs" />
      </div>
    </div>
  );
});

export default HardwareChannelStrip;
