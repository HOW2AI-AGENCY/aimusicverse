/**
 * HardwareReverbPanel - Reverb/Space with hardware-style controls
 */

import React, { useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { HardwareKnob } from '@/components/ui/hardware/HardwareKnob';
import { HardwareSwitch } from '@/components/ui/hardware/HardwareSwitch';
import { LEDIndicator } from '@/components/ui/hardware/LEDIndicator';
import { ReverbSettings, reverbPresets, defaultReverbSettings } from '@/hooks/studio/stemEffectsConfig';

interface HardwareReverbPanelProps {
  settings: ReverbSettings;
  onChange: (settings: Partial<ReverbSettings>) => void;
  onPresetChange: (preset: keyof typeof reverbPresets) => void;
  compact?: boolean;
  className?: string;
}

const presetButtons: Array<{ key: keyof typeof reverbPresets; label: string }> = [
  { key: 'room', label: 'ROOM' },
  { key: 'hall', label: 'HALL' },
  { key: 'plate', label: 'PLATE' },
  { key: 'ambient', label: 'AMBIENT' },
  { key: 'cathedral', label: 'CATHEDRAL' },
];

export const HardwareReverbPanel = memo(function HardwareReverbPanel({
  settings,
  onChange,
  onPresetChange,
  compact = false,
  className,
}: HardwareReverbPanelProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handlePresetClick = (preset: keyof typeof reverbPresets) => {
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
        <div className="flex items-center gap-3">
          <HardwareSwitch
            on={settings.enabled}
            onChange={(on) => onChange({ enabled: on })}
            size="sm"
            color="blue"
          />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Reverb
          </span>
        </div>
        
        <LEDIndicator 
          on={settings.enabled} 
          color="blue" 
          size="sm"
        />
      </div>

      <div className={cn(
        'transition-opacity duration-200',
        !settings.enabled && 'opacity-40 pointer-events-none'
      )}>
        {/* Decay visualization */}
        <div className="relative h-10 mb-4 rounded bg-black/40 border border-zinc-700 overflow-hidden">
          <div className="absolute inset-0 flex items-end px-1 pb-1">
            {Array.from({ length: 24 }).map((_, i) => {
              const decay = settings.decay;
              const wet = settings.wetDry;
              const height = Math.max(5, 100 * Math.exp(-i * 0.12 / decay) * wet);
              return (
                <div
                  key={i}
                  className="flex-1 mx-px bg-blue-400/70 rounded-t transition-all duration-200"
                  style={{ 
                    height: `${height}%`,
                    opacity: 1 - (i * 0.035)
                  }}
                />
              );
            })}
          </div>
          
          {/* Labels */}
          <div className="absolute bottom-0 left-2 text-[8px] text-zinc-500">DRY</div>
          <div className="absolute bottom-0 right-2 text-[8px] text-zinc-500">WET</div>
        </div>

        {/* Main controls */}
        <div className="flex justify-around items-end gap-4">
          <HardwareKnob
            value={settings.wetDry * 100}
            min={0}
            max={100}
            step={1}
            onChange={(v) => onChange({ wetDry: v / 100 })}
            size={compact ? 'md' : 'lg'}
            variant="dark"
            label="DRY/WET"
            valueFormatter={(v) => `${v.toFixed(0)}%`}
            color="primary"
          />
          
          <HardwareKnob
            value={settings.decay}
            min={0.1}
            max={8}
            step={0.1}
            onChange={(v) => onChange({ decay: v })}
            size={compact ? 'md' : 'lg'}
            variant="dark"
            label="DECAY"
            valueFormatter={(v) => `${v.toFixed(1)}s`}
            color="primary"
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
                  'active:translate-y-0.5 active:shadow-none',
                  activePreset === key 
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default HardwareReverbPanel;
