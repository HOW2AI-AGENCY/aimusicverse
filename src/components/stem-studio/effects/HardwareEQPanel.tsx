/**
 * HardwareEQPanel - 3-Band Parametric EQ with hardware-style controls
 */

import React, { useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { HardwareKnob } from '@/components/ui/hardware/HardwareKnob';
import { LEDIndicator } from '@/components/ui/hardware/LEDIndicator';
import { EQSettings, eqPresets, defaultEQSettings } from '@/hooks/studio/stemEffectsConfig';

interface HardwareEQPanelProps {
  settings: EQSettings;
  onChange: (settings: Partial<EQSettings>) => void;
  onPresetChange: (preset: keyof typeof eqPresets) => void;
  compact?: boolean;
  className?: string;
}

const presetButtons: Array<{ key: keyof typeof eqPresets; label: string }> = [
  { key: 'flat', label: 'FLAT' },
  { key: 'warm', label: 'WARM' },
  { key: 'bright', label: 'BRIGHT' },
  { key: 'bass_boost', label: 'BASS+' },
  { key: 'vocal_presence', label: 'VOCAL' },
];

export const HardwareEQPanel = memo(function HardwareEQPanel({
  settings,
  onChange,
  onPresetChange,
  compact = false,
  className,
}: HardwareEQPanelProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const isModified = settings.lowGain !== 0 || settings.midGain !== 0 || settings.highGain !== 0;

  const handlePresetClick = (preset: keyof typeof eqPresets) => {
    setActivePreset(preset);
    onPresetChange(preset);
  };

  return (
    <div className={cn(
      'rounded-lg p-4',
      'bg-gradient-to-b from-zinc-800 via-zinc-850 to-zinc-900',
      'border border-zinc-700',
      'shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.4)]',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LEDIndicator on={isModified} color="green" size="sm" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            3-Band EQ
          </span>
        </div>
      </div>

      {/* EQ Visualization */}
      <div className="relative h-16 mb-4 rounded bg-black/40 border border-zinc-700 overflow-hidden">
        <svg 
          viewBox="0 0 200 60" 
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid */}
          <line x1="0" y1="30" x2="200" y2="30" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="4" />
          {[50, 100, 150].map(x => (
            <line key={x} x1={x} y1="0" x2={x} y2="60" stroke="currentColor" strokeOpacity="0.1" />
          ))}
          
          {/* EQ curve */}
          <path
            d={`M 0 ${30 - settings.lowGain * 2} 
                Q 25 ${30 - settings.lowGain * 2}, 50 ${30 - settings.lowGain * 1.2}
                Q 75 ${30 - (settings.lowGain + settings.midGain) * 0.6}, 100 ${30 - settings.midGain * 2}
                Q 125 ${30 - (settings.midGain + settings.highGain) * 0.6}, 150 ${30 - settings.highGain * 1.2}
                Q 175 ${30 - settings.highGain * 2}, 200 ${30 - settings.highGain * 2}`}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            className="transition-all duration-100"
          />
          
          {/* Fill */}
          <path
            d={`M 0 ${30 - settings.lowGain * 2} 
                Q 25 ${30 - settings.lowGain * 2}, 50 ${30 - settings.lowGain * 1.2}
                Q 75 ${30 - (settings.lowGain + settings.midGain) * 0.6}, 100 ${30 - settings.midGain * 2}
                Q 125 ${30 - (settings.midGain + settings.highGain) * 0.6}, 150 ${30 - settings.highGain * 1.2}
                Q 175 ${30 - settings.highGain * 2}, 200 ${30 - settings.highGain * 2}
                L 200 60 L 0 60 Z`}
            fill="hsl(var(--primary))"
            fillOpacity="0.15"
          />
        </svg>
        
        {/* Frequency labels */}
        <div className="absolute bottom-0.5 left-0 right-0 flex justify-between px-2 text-[8px] text-zinc-500 font-mono">
          <span>20</span>
          <span>320</span>
          <span>1k</span>
          <span>3.2k</span>
          <span>20k</span>
        </div>
      </div>

      {/* Knobs */}
      <div className="flex justify-around items-end gap-2">
        <HardwareKnob
          value={settings.lowGain}
          min={-12}
          max={12}
          step={0.5}
          onChange={(v) => onChange({ lowGain: v })}
          size={compact ? 'sm' : 'md'}
          variant="dark"
          label="LOW"
          bipolar
          showTicks={!compact}
          tickCount={5}
          valueFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`}
        />
        
        <HardwareKnob
          value={settings.midGain}
          min={-12}
          max={12}
          step={0.5}
          onChange={(v) => onChange({ midGain: v })}
          size={compact ? 'sm' : 'md'}
          variant="dark"
          label="MID"
          bipolar
          showTicks={!compact}
          tickCount={5}
          valueFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`}
        />
        
        <HardwareKnob
          value={settings.highGain}
          min={-12}
          max={12}
          step={0.5}
          onChange={(v) => onChange({ highGain: v })}
          size={compact ? 'sm' : 'md'}
          variant="dark"
          label="HIGH"
          bipolar
          showTicks={!compact}
          tickCount={5}
          valueFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`}
        />
      </div>

      {/* Preset buttons */}
      {!compact && (
        <div className="flex gap-1 mt-4 justify-center flex-wrap">
          {presetButtons.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handlePresetClick(key)}
              className={cn(
                'px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wide transition-all',
                'bg-zinc-800 border border-zinc-600',
                'shadow-[0_2px_0_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]',
                'active:translate-y-0.5 active:shadow-[0_0px_0_rgba(0,0,0,0.3)]',
                activePreset === key 
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default HardwareEQPanel;
