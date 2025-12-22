/**
 * HardwareEffectsRack - Combined effects panel in hardware style
 */

import React, { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { HardwareEQPanel } from '../effects/HardwareEQPanel';
import { HardwareCompressorPanel } from '../effects/HardwareCompressorPanel';
import { HardwareReverbPanel } from '../effects/HardwareReverbPanel';
import { LEDIndicator } from '@/components/ui/hardware/LEDIndicator';
import type { StemEffects } from '@/hooks/studio/types';
import { eqPresets, compressorPresets, reverbPresets } from '@/hooks/studio/stemEffectsConfig';
import { Sliders, Activity, Waves, ChevronLeft, ChevronRight } from 'lucide-react';

type EffectTab = 'eq' | 'compressor' | 'reverb';

interface HardwareEffectsRackProps {
  stemName: string;
  effects: StemEffects;
  onEffectsChange: (effects: Partial<StemEffects>) => void;
  getCompressorReduction?: () => number;
  onClose?: () => void;
  className?: string;
}

export const HardwareEffectsRack = memo(function HardwareEffectsRack({
  stemName,
  effects,
  onEffectsChange,
  getCompressorReduction,
  onClose,
  className,
}: HardwareEffectsRackProps) {
  const [activeTab, setActiveTab] = useState<EffectTab>('eq');

  const tabs: Array<{ id: EffectTab; label: string; icon: React.ReactNode; active: boolean }> = [
    { 
      id: 'eq', 
      label: 'EQ', 
      icon: <Sliders className="w-3 h-3" />,
      active: effects.eq.lowGain !== 0 || effects.eq.midGain !== 0 || effects.eq.highGain !== 0
    },
    { 
      id: 'compressor', 
      label: 'COMP', 
      icon: <Activity className="w-3 h-3" />,
      active: effects.compressor.enabled
    },
    { 
      id: 'reverb', 
      label: 'REVERB', 
      icon: <Waves className="w-3 h-3" />,
      active: effects.reverb.enabled
    },
  ];

  const handleEQChange = (eq: Partial<typeof effects.eq>) => {
    onEffectsChange({ eq: { ...effects.eq, ...eq } });
  };

  const handleEQPreset = (preset: keyof typeof eqPresets) => {
    onEffectsChange({ eq: { ...effects.eq, ...eqPresets[preset] } });
  };

  const handleCompressorChange = (comp: Partial<typeof effects.compressor>) => {
    onEffectsChange({ compressor: { ...effects.compressor, ...comp } });
  };

  const handleCompressorPreset = (preset: keyof typeof compressorPresets) => {
    onEffectsChange({ compressor: { ...effects.compressor, ...compressorPresets[preset] } });
  };

  const handleReverbChange = (reverb: Partial<typeof effects.reverb>) => {
    onEffectsChange({ reverb: { ...effects.reverb, ...reverb } });
  };

  const handleReverbPreset = (preset: keyof typeof reverbPresets) => {
    onEffectsChange({ reverb: { ...effects.reverb, ...reverbPresets[preset] } });
  };

  return (
    <div className={cn(
      'rounded-xl overflow-hidden',
      'bg-gradient-to-b from-zinc-900 via-zinc-950 to-black',
      'border border-zinc-700',
      'shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 border-b border-zinc-700">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-zinc-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <span className="text-sm font-bold uppercase tracking-wider text-zinc-200">
            {stemName} Effects
          </span>
        </div>
        
        {/* Effect indicators */}
        <div className="flex gap-2">
          {tabs.map(tab => (
            <LEDIndicator
              key={tab.id}
              on={tab.active}
              color={tab.id === 'eq' ? 'green' : tab.id === 'compressor' ? 'yellow' : 'blue'}
              size="xs"
            />
          ))}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-zinc-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-wider transition-all',
              activeTab === tab.id
                ? 'bg-zinc-800 text-zinc-100 border-b-2 border-primary'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.active && (
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
            )}
          </button>
        ))}
      </div>

      {/* Effect panels */}
      <div className="p-4">
        {activeTab === 'eq' && (
          <HardwareEQPanel
            settings={effects.eq}
            onChange={handleEQChange}
            onPresetChange={handleEQPreset}
          />
        )}
        
        {activeTab === 'compressor' && (
          <HardwareCompressorPanel
            settings={effects.compressor}
            onChange={handleCompressorChange}
            onPresetChange={handleCompressorPreset}
            getReduction={getCompressorReduction}
          />
        )}
        
        {activeTab === 'reverb' && (
          <HardwareReverbPanel
            settings={effects.reverb}
            onChange={handleReverbChange}
            onPresetChange={handleReverbPreset}
          />
        )}
      </div>
    </div>
  );
});

export default HardwareEffectsRack;
