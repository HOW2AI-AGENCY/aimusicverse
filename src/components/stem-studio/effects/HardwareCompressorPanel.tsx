/**
 * HardwareCompressorPanel - Dynamics Compressor with hardware-style controls
 */

import React, { useState, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { HardwareKnob } from '@/components/ui/hardware/HardwareKnob';
import { HardwareSwitch } from '@/components/ui/hardware/HardwareSwitch';
import { VUMeter } from '@/components/ui/hardware/VUMeter';
import { LEDIndicator } from '@/components/ui/hardware/LEDIndicator';
import { CompressorSettings, compressorPresets, defaultCompressorSettings } from '@/hooks/studio/stemEffectsConfig';

interface HardwareCompressorPanelProps {
  settings: CompressorSettings;
  onChange: (settings: Partial<CompressorSettings>) => void;
  onPresetChange: (preset: keyof typeof compressorPresets) => void;
  getReduction?: () => number;
  compact?: boolean;
  className?: string;
}

const presetButtons: Array<{ key: keyof typeof compressorPresets; label: string }> = [
  { key: 'gentle', label: 'GENTLE' },
  { key: 'moderate', label: 'MODERATE' },
  { key: 'heavy', label: 'HEAVY' },
  { key: 'vocals', label: 'VOCAL' },
  { key: 'drums', label: 'DRUMS' },
];

export const HardwareCompressorPanel = memo(function HardwareCompressorPanel({
  settings,
  onChange,
  onPresetChange,
  getReduction,
  compact = false,
  className,
}: HardwareCompressorPanelProps) {
  const [reduction, setReduction] = useState(0);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Poll gain reduction
  useEffect(() => {
    if (!settings.enabled || !getReduction) return;
    
    const interval = setInterval(() => {
      setReduction(getReduction());
    }, 50);
    
    return () => clearInterval(interval);
  }, [settings.enabled, getReduction]);

  const handlePresetClick = (preset: keyof typeof compressorPresets) => {
    setActivePreset(preset);
    onPresetChange(preset);
  };

  // Normalize reduction for VU meter (0 to 1)
  const reductionNormalized = Math.min(1, Math.abs(reduction) / 24);

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
            color="green"
          />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Compressor
          </span>
        </div>
        
        <LEDIndicator 
          on={settings.enabled && Math.abs(reduction) > 0.5} 
          color="yellow" 
          size="sm"
          pulse={Math.abs(reduction) > 6}
        />
      </div>

      <div className={cn(
        'transition-opacity duration-200',
        !settings.enabled && 'opacity-40 pointer-events-none'
      )}>
        {/* GR Meter */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[9px] text-zinc-500 font-medium w-8">GR</span>
          <div className="flex-1">
            <VUMeter
              value={1 - reductionNormalized}
              type="horizontal"
              showDb={false}
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-400 w-12 text-right tabular-nums">
            {Math.abs(reduction).toFixed(1)} dB
          </span>
        </div>

        {/* Main controls */}
        <div className={cn(
          'grid gap-4',
          compact ? 'grid-cols-2' : 'grid-cols-4'
        )}>
          <HardwareKnob
            value={settings.threshold}
            min={-60}
            max={0}
            step={1}
            onChange={(v) => onChange({ threshold: v })}
            size={compact ? 'sm' : 'md'}
            variant="dark"
            label="THRESH"
            valueFormatter={(v) => `${v}dB`}
          />
          
          <HardwareKnob
            value={settings.ratio}
            min={1}
            max={20}
            step={0.5}
            onChange={(v) => onChange({ ratio: v })}
            size={compact ? 'sm' : 'md'}
            variant="dark"
            label="RATIO"
            valueFormatter={(v) => `${v}:1`}
          />
          
          <HardwareKnob
            value={settings.attack * 1000}
            min={0}
            max={100}
            step={1}
            onChange={(v) => onChange({ attack: v / 1000 })}
            size={compact ? 'sm' : 'md'}
            variant="dark"
            label="ATTACK"
            valueFormatter={(v) => `${v.toFixed(0)}ms`}
          />
          
          <HardwareKnob
            value={settings.release * 1000}
            min={10}
            max={1000}
            step={10}
            onChange={(v) => onChange({ release: v / 1000 })}
            size={compact ? 'sm' : 'md'}
            variant="dark"
            label="RELEASE"
            valueFormatter={(v) => `${v.toFixed(0)}ms`}
          />
        </div>

        {/* Knee control */}
        {!compact && (
          <div className="mt-4 flex items-center gap-4">
            <span className="text-[9px] text-zinc-500 font-medium uppercase">Knee</span>
            <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary/60 rounded-full transition-all"
                style={{ width: `${(settings.knee / 40) * 100}%` }}
              />
            </div>
            <HardwareKnob
              value={settings.knee}
              min={0}
              max={40}
              step={1}
              onChange={(v) => onChange({ knee: v })}
              size="xs"
              variant="dark"
              showValue={false}
            />
            <span className="text-[10px] font-mono text-zinc-400 w-10 tabular-nums">
              {settings.knee}dB
            </span>
          </div>
        )}

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
    </div>
  );
});

export default HardwareCompressorPanel;
