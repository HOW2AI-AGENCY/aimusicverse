/**
 * Stem Effects Panel
 * 
 * Expandable panel containing all audio effects for a stem
 */

import { useState } from 'react';
import { ChevronDown, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { EqualizerControl } from './EqualizerControl';
import { CompressorControl } from './CompressorControl';
import { ReverbControl } from './ReverbControl';
import { 
  StemEffects, 
  EQSettings, 
  CompressorSettings, 
  ReverbSettings,
  eqPresets,
  compressorPresets,
  reverbPresets,
} from '@/hooks/studio/stemEffectsConfig';

interface StemEffectsPanelProps {
  effects: StemEffects;
  onEQChange: (settings: Partial<EQSettings>) => void;
  onCompressorChange: (settings: Partial<CompressorSettings>) => void;
  onReverbChange: (settings: Partial<ReverbSettings>) => void;
  onEQPreset: (preset: keyof typeof eqPresets) => void;
  onCompressorPreset: (preset: keyof typeof compressorPresets) => void;
  onReverbPreset: (preset: keyof typeof reverbPresets) => void;
  onReset: () => void;
  getCompressorReduction?: () => number;
  disabled?: boolean;
}

export function StemEffectsPanel({
  effects,
  onEQChange,
  onCompressorChange,
  onReverbChange,
  onEQPreset,
  onCompressorPreset,
  onReverbPreset,
  onReset,
  getCompressorReduction,
  disabled = false,
}: StemEffectsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Check if any effects are active
  const hasActiveEffects = 
    effects.eq.lowGain !== 0 || 
    effects.eq.midGain !== 0 || 
    effects.eq.highGain !== 0 ||
    effects.compressor.enabled ||
    effects.reverb.enabled;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-between h-8 px-2 text-xs",
            hasActiveEffects && "text-primary"
          )}
          disabled={disabled}
        >
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            Эффекты
            {hasActiveEffects && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </span>
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform",
            isOpen && "rotate-180"
          )} />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2">
        <div className="border border-border/50 rounded-lg bg-card/50 p-3">
          <Tabs defaultValue="eq" className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-8">
              <TabsTrigger value="eq" className="text-xs">
                EQ
                {(effects.eq.lowGain !== 0 || effects.eq.midGain !== 0 || effects.eq.highGain !== 0) && (
                  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </TabsTrigger>
              <TabsTrigger value="compressor" className="text-xs">
                Компрессор
                {effects.compressor.enabled && (
                  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </TabsTrigger>
              <TabsTrigger value="reverb" className="text-xs">
                Ревербер
                {effects.reverb.enabled && (
                  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="eq" className="mt-4">
              <EqualizerControl
                settings={effects.eq}
                onChange={onEQChange}
                onPresetChange={onEQPreset}
              />
            </TabsContent>

            <TabsContent value="compressor" className="mt-4">
              <CompressorControl
                settings={effects.compressor}
                onChange={onCompressorChange}
                onPresetChange={onCompressorPreset}
                getReduction={getCompressorReduction}
              />
            </TabsContent>

            <TabsContent value="reverb" className="mt-4">
              <ReverbControl
                settings={effects.reverb}
                onChange={onReverbChange}
                onPresetChange={onReverbPreset}
              />
            </TabsContent>
          </Tabs>

          {/* Reset all button */}
          {hasActiveEffects && (
            <div className="mt-4 pt-3 border-t border-border/30">
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="w-full h-8 text-xs"
              >
                Сбросить все эффекты
              </Button>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
