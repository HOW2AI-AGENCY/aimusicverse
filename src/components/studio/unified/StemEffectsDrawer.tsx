/**
 * StemEffectsDrawer - Effects panel for individual stems
 * 
 * Provides EQ, Compressor, and Reverb controls with presets
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Sliders, RotateCcw, Volume2, 
  Waves, Settings2, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { TrackStem } from '@/hooks/useTrackStems';
import {
  StemEffects,
  EQSettings,
  CompressorSettings,
  ReverbSettings,
  eqPresets,
  compressorPresets,
  reverbPresets,
  defaultStemEffects,
} from '@/hooks/studio/useStemAudioEngine';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { toast } from 'sonner';

interface StemEffectsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stem: TrackStem | null;
  effects: StemEffects;
  onUpdateEQ: (settings: Partial<EQSettings>) => void;
  onUpdateCompressor: (settings: Partial<CompressorSettings>) => void;
  onUpdateReverb: (settings: Partial<ReverbSettings>) => void;
  onReset: () => void;
}

export function StemEffectsDrawer({
  open,
  onOpenChange,
  stem,
  effects,
  onUpdateEQ,
  onUpdateCompressor,
  onUpdateReverb,
  onReset,
}: StemEffectsDrawerProps) {
  const isMobile = useIsMobile();
  const haptic = useHapticFeedback();
  const [activeTab, setActiveTab] = useState('eq');

  const handlePresetChange = useCallback((
    type: 'eq' | 'compressor' | 'reverb',
    preset: string
  ) => {
    haptic.select();
    
    if (type === 'eq') {
      const p = eqPresets[preset as keyof typeof eqPresets];
      if (p) onUpdateEQ(p);
    } else if (type === 'compressor') {
      const p = compressorPresets[preset as keyof typeof compressorPresets];
      if (p) onUpdateCompressor(p);
    } else {
      const p = reverbPresets[preset as keyof typeof reverbPresets];
      if (p) onUpdateReverb(p);
    }
    
    toast.success(`Пресет "${preset}" применён`);
  }, [haptic, onUpdateEQ, onUpdateCompressor, onUpdateReverb]);

  const handleReset = useCallback(() => {
    haptic.impact();
    onReset();
    toast.info('Эффекты сброшены');
  }, [haptic, onReset]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side={isMobile ? 'bottom' : 'right'} 
        className={cn(
          isMobile ? "h-[85vh] rounded-t-2xl" : "w-[400px]"
        )}
      >
        <SheetHeader className="pb-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              Эффекты
              {stem && (
                <Badge variant="outline" className="text-xs ml-2">
                  {stem.stem_type}
                </Badge>
              )}
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 px-2"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Сброс
            </Button>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="eq" className="text-xs">
              <Waves className="w-3.5 h-3.5 mr-1" />
              EQ
            </TabsTrigger>
            <TabsTrigger value="compressor" className="text-xs">
              <Settings2 className="w-3.5 h-3.5 mr-1" />
              Компрессор
            </TabsTrigger>
            <TabsTrigger value="reverb" className="text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Реверб
            </TabsTrigger>
          </TabsList>

          {/* EQ Tab */}
          <TabsContent value="eq" className="space-y-4 mt-0">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Пресет</Label>
              <Select 
                onValueChange={(v) => handlePresetChange('eq', v)}
                defaultValue="flat"
              >
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(eqPresets).map((preset) => (
                    <SelectItem key={preset} value={preset}>
                      {preset === 'flat' ? 'Плоский' :
                       preset === 'warm' ? 'Тёплый' :
                       preset === 'bright' ? 'Яркий' :
                       preset === 'bass_boost' ? 'Бас+' :
                       preset === 'vocal_presence' ? 'Вокал' :
                       preset === 'scoop' ? 'Скуп' : preset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <EQSlider
                label="Low"
                value={effects.eq.lowGain}
                onChange={(v) => onUpdateEQ({ lowGain: v })}
              />
              <EQSlider
                label="Mid"
                value={effects.eq.midGain}
                onChange={(v) => onUpdateEQ({ midGain: v })}
              />
              <EQSlider
                label="High"
                value={effects.eq.highGain}
                onChange={(v) => onUpdateEQ({ highGain: v })}
              />
            </div>
          </TabsContent>

          {/* Compressor Tab */}
          <TabsContent value="compressor" className="space-y-4 mt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={effects.compressor.enabled}
                  onCheckedChange={(v) => onUpdateCompressor({ enabled: v })}
                />
                <Label className="text-sm">Включен</Label>
              </div>
              <Select 
                onValueChange={(v) => handlePresetChange('compressor', v)}
                defaultValue="off"
              >
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(compressorPresets).map((preset) => (
                    <SelectItem key={preset} value={preset}>
                      {preset === 'off' ? 'Выкл' :
                       preset === 'gentle' ? 'Мягкий' :
                       preset === 'moderate' ? 'Средний' :
                       preset === 'heavy' ? 'Сильный' :
                       preset === 'vocals' ? 'Вокал' :
                       preset === 'drums' ? 'Ударные' : preset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <AnimatePresence>
              {effects.compressor.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <EffectSlider
                    label="Threshold"
                    value={effects.compressor.threshold}
                    min={-60}
                    max={0}
                    unit="dB"
                    onChange={(v) => onUpdateCompressor({ threshold: v })}
                  />
                  <EffectSlider
                    label="Ratio"
                    value={effects.compressor.ratio}
                    min={1}
                    max={20}
                    step={0.5}
                    unit=":1"
                    onChange={(v) => onUpdateCompressor({ ratio: v })}
                  />
                  <EffectSlider
                    label="Attack"
                    value={effects.compressor.attack * 1000}
                    min={0}
                    max={100}
                    unit="ms"
                    onChange={(v) => onUpdateCompressor({ attack: v / 1000 })}
                  />
                  <EffectSlider
                    label="Release"
                    value={effects.compressor.release * 1000}
                    min={10}
                    max={1000}
                    unit="ms"
                    onChange={(v) => onUpdateCompressor({ release: v / 1000 })}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Reverb Tab */}
          <TabsContent value="reverb" className="space-y-4 mt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={effects.reverb.enabled}
                  onCheckedChange={(v) => onUpdateReverb({ enabled: v })}
                />
                <Label className="text-sm">Включен</Label>
              </div>
              <Select 
                onValueChange={(v) => handlePresetChange('reverb', v)}
                defaultValue="off"
              >
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(reverbPresets).map((preset) => (
                    <SelectItem key={preset} value={preset}>
                      {preset === 'off' ? 'Выкл' :
                       preset === 'room' ? 'Комната' :
                       preset === 'hall' ? 'Холл' :
                       preset === 'plate' ? 'Пластина' :
                       preset === 'ambient' ? 'Эмбиент' : preset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <AnimatePresence>
              {effects.reverb.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <EffectSlider
                    label="Wet/Dry"
                    value={effects.reverb.wetDry * 100}
                    min={0}
                    max={100}
                    unit="%"
                    onChange={(v) => onUpdateReverb({ wetDry: v / 100 })}
                  />
                  <EffectSlider
                    label="Decay"
                    value={effects.reverb.decay}
                    min={0.1}
                    max={10}
                    step={0.1}
                    unit="s"
                    onChange={(v) => onUpdateReverb({ decay: v })}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// EQ Slider with -12 to +12 dB range
function EQSlider({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: number; 
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className={cn(
          "text-xs font-mono tabular-nums",
          value > 0 ? "text-success" : value < 0 ? "text-destructive" : "text-muted-foreground"
        )}>
          {value > 0 ? '+' : ''}{value.toFixed(1)} dB
        </span>
      </div>
      <Slider
        value={[value]}
        min={-12}
        max={12}
        step={0.5}
        onValueChange={(v) => onChange(v[0])}
        className="w-full"
      />
    </div>
  );
}

// Generic effect slider
function EffectSlider({ 
  label, 
  value, 
  min, 
  max, 
  step = 1,
  unit = '',
  onChange 
}: { 
  label: string; 
  value: number; 
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs font-mono tabular-nums text-muted-foreground">
          {value.toFixed(step < 1 ? 1 : 0)}{unit}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
        className="w-full"
      />
    </div>
  );
}
