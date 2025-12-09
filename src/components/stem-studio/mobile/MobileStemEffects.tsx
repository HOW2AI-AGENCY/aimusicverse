/**
 * MobileStemEffects - Mobile-optimized effects panel for stems
 * 
 * Collapsible per-stem effect controls with EQ, Compressor, Reverb
 */

import { useState } from 'react';
import { ChevronDown, Music2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { EqualizerControl } from '@/components/stem-studio/effects/EqualizerControl';
import { CompressorControl } from '@/components/stem-studio/effects/CompressorControl';
import { ReverbControl } from '@/components/stem-studio/effects/ReverbControl';
import { eqPresets, compressorPresets, reverbPresets } from '@/hooks/studio';
import type { Tables } from '@/integrations/supabase/types';
import type { StemEffects, EQSettings, CompressorSettings, ReverbSettings } from '@/hooks/studio';

interface MobileStemEffectsProps {
  stems: Tables<'track_stems'>[];
  effectsEnabled: boolean;
  stemEffects: Record<string, StemEffects>;
  onToggleEffects: () => void;
  onEQChange: (stemId: string, settings: Partial<EQSettings>) => void;
  onCompressorChange: (stemId: string, settings: Partial<CompressorSettings>) => void;
  onReverbChange: (stemId: string, settings: Partial<ReverbSettings>) => void;
  onEQPresetChange: (stemId: string, preset: keyof typeof eqPresets) => void;
  onCompressorPresetChange: (stemId: string, preset: keyof typeof compressorPresets) => void;
  onReverbPresetChange: (stemId: string, preset: keyof typeof reverbPresets) => void;
}

const stemLabels: Record<string, string> = {
  vocals: 'Вокал',
  drums: 'Барабаны',
  bass: 'Бас',
  other: 'Другое',
  piano: 'Пиано',
  guitar: 'Гитара',
  melody: 'Мелодия',
  instrumental: 'Инструментал',
};

export function MobileStemEffects({
  stems,
  effectsEnabled,
  stemEffects,
  onToggleEffects,
  onEQChange,
  onCompressorChange,
  onReverbChange,
  onEQPresetChange,
  onCompressorPresetChange,
  onReverbPresetChange,
}: MobileStemEffectsProps) {
  const [expandedStem, setExpandedStem] = useState<string | null>(null);
  const [activeEffect, setActiveEffect] = useState<'eq' | 'compressor' | 'reverb'>('eq');

  return (
    <div className="p-4 space-y-4">
      {/* Effects Master Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/30">
        <div>
          <h3 className="text-sm font-semibold">Эффекты</h3>
          <p className="text-xs text-muted-foreground">Обработка звука</p>
        </div>
        <Switch
          checked={effectsEnabled}
          onCheckedChange={onToggleEffects}
        />
      </div>
      
      {effectsEnabled && (
        <div className="space-y-2">
          {stems.map((stem) => {
            const isExpanded = expandedStem === stem.id;
            const effects = stemEffects[stem.id];
            
            return (
              <div 
                key={stem.id}
                className="rounded-xl border border-border/50 bg-card/50 overflow-hidden"
              >
                {/* Stem Header */}
                <button
                  onClick={() => setExpandedStem(isExpanded ? null : stem.id)}
                  className="w-full flex items-center justify-between p-3"
                >
                  <div className="flex items-center gap-2">
                    <Music2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {stemLabels[stem.stem_type] || stem.stem_type}
                    </span>
                  </div>
                  <ChevronDown className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    isExpanded && "rotate-180"
                  )} />
                </button>
                
                {/* Effect Controls */}
                <AnimatePresence>
                  {isExpanded && effects && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 pt-0 space-y-3">
                        {/* Effect Type Tabs */}
                        <div className="flex gap-1 p-1 bg-muted rounded-lg">
                          {(['eq', 'compressor', 'reverb'] as const).map((effect) => (
                            <Button
                              key={effect}
                              variant={activeEffect === effect ? 'secondary' : 'ghost'}
                              size="sm"
                              onClick={() => setActiveEffect(effect)}
                              className="flex-1 h-8 text-xs"
                            >
                              {effect === 'eq' ? 'EQ' : effect === 'compressor' ? 'Комп.' : 'Ревер.'}
                            </Button>
                          ))}
                        </div>
                        
                        {/* Effect Controls */}
                        <div className="min-h-[180px]">
                          {activeEffect === 'eq' && (
                            <EqualizerControl
                              settings={effects.eq}
                              onChange={(settings) => onEQChange(stem.id, settings)}
                              onPresetChange={(preset) => onEQPresetChange(stem.id, preset)}
                            />
                          )}
                          {activeEffect === 'compressor' && (
                            <CompressorControl
                              settings={effects.compressor}
                              onChange={(settings) => onCompressorChange(stem.id, settings)}
                              onPresetChange={(preset) => onCompressorPresetChange(stem.id, preset)}
                            />
                          )}
                          {activeEffect === 'reverb' && (
                            <ReverbControl
                              settings={effects.reverb}
                              onChange={(settings) => onReverbChange(stem.id, settings)}
                              onPresetChange={(preset) => onReverbPresetChange(stem.id, preset)}
                            />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
      
      {!effectsEnabled && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Включите эффекты для настройки</p>
        </div>
      )}
    </div>
  );
}
