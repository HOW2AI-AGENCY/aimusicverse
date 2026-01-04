/**
 * MasterSection - Master output controls with stereo metering
 */

import React, { memo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { HardwareKnob } from '@/components/ui/hardware/HardwareKnob';
import { VUMeter } from '@/components/ui/hardware/VUMeter';
import { LEDIndicator } from '@/components/ui/hardware/LEDIndicator';
import { LCDDisplay } from '@/components/ui/hardware/LCDDisplay';
import { Volume2 } from 'lucide-react';

export interface MasterSectionProps {
  volume: number;
  muted: boolean;
  leftLevel?: number;
  rightLevel?: number;
  peakLeft?: number;
  peakRight?: number;
  bpm?: number;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  compact?: boolean;
  className?: string;
}

export const MasterSection = memo(function MasterSection({
  volume,
  muted,
  leftLevel = 0,
  rightLevel = 0,
  peakLeft,
  peakRight,
  bpm,
  onVolumeChange,
  onMuteToggle,
  compact = false,
  className,
}: MasterSectionProps) {
  const [clipping, setClipping] = useState(false);

  // Detect clipping
  useEffect(() => {
    if (leftLevel > 0.95 || rightLevel > 0.95) {
      setClipping(true);
      const timeout = setTimeout(() => setClipping(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [leftLevel, rightLevel]);

  const effectiveLeftLevel = muted ? 0 : leftLevel * (volume / 100);
  const effectiveRightLevel = muted ? 0 : rightLevel * (volume / 100);

  return (
    <div className={cn(
      'flex flex-col items-center rounded-lg',
      'bg-gradient-to-b from-zinc-900 via-zinc-850 to-black',
      'border border-zinc-600',
      'shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_20px_rgba(0,0,0,0.5)]',
      compact ? 'p-3' : 'p-4',
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Volume2 className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-200">
          Master
        </span>
        <LEDIndicator 
          on={clipping} 
          color="red" 
          size="sm" 
          pulse={clipping}
        />
      </div>

      {/* BPM Display (if available) */}
      {bpm && !compact && (
        <div className="mb-3">
          <LCDDisplay
            text={`${bpm} BPM`}
            variant="green"
            size="sm"
          />
        </div>
      )}

      {/* Stereo VU Meters */}
      <div className="flex gap-2 mb-4">
        <VUMeter
          value={effectiveLeftLevel}
          peak={peakLeft}
          type="led"
          size={compact ? 'sm' : 'md'}
          label="L"
        />
        <VUMeter
          value={effectiveRightLevel}
          peak={peakRight}
          type="led"
          size={compact ? 'sm' : 'md'}
          label="R"
        />
      </div>

      {/* Master volume knob */}
      <HardwareKnob
        value={volume}
        min={0}
        max={100}
        step={1}
        onChange={onVolumeChange}
        size={compact ? 'lg' : 'xl'}
        variant="modern"
        label="MASTER"
        showTicks
        tickCount={11}
        disabled={muted}
        color="primary"
        valueFormatter={(v) => `${v}%`}
      />

      {/* Mute button */}
      <button
        onClick={onMuteToggle}
        className={cn(
          'mt-4 px-4 py-2 rounded-md font-bold uppercase tracking-wide transition-all',
          'bg-zinc-800 border border-zinc-600',
          'shadow-[0_3px_0_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]',
          'active:translate-y-0.5 active:shadow-[0_1px_0_rgba(0,0,0,0.4)]',
          muted 
            ? 'bg-red-500/30 border-red-500/50 text-red-400' 
            : 'text-zinc-400 hover:text-zinc-200',
          compact ? 'text-[9px]' : 'text-[10px]'
        )}
      >
        {muted ? 'MUTED' : 'MUTE'}
      </button>

      {/* dB readout */}
      <div className="mt-3 flex gap-4 text-[9px] font-mono text-zinc-500">
        <span>L: {(20 * Math.log10(effectiveLeftLevel || 0.001)).toFixed(1)}dB</span>
        <span>R: {(20 * Math.log10(effectiveRightLevel || 0.001)).toFixed(1)}dB</span>
      </div>
    </div>
  );
});

export default MasterSection;
