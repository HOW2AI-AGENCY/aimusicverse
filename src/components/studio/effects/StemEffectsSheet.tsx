/**
 * StemEffectsSheet - Bottom sheet for stem effects (EQ, Compressor, Reverb)
 * Mobile-friendly sheet that wraps the effects controls
 */

import { memo, useState } from 'react';
import { Sliders, RotateCcw, Music2, Drum, Guitar, Piano } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { TrackStem } from '@/hooks/useTrackStems';
import { 
  StemEffects, 
  EQSettings, 
  CompressorSettings, 
  ReverbSettings,
} from '@/hooks/studio';

// Stem type icons
const stemIcons: Record<string, React.ComponentType<any>> = {
  vocals: Music2,
  vocal: Music2,
  drums: Drum,
  bass: Guitar,
  guitar: Guitar,
  piano: Piano,
  keyboard: Piano,
  other: Sliders,
};

interface StemEffectsSheetProps {
  stem: TrackStem;
  effects: StemEffects;
  enabled: boolean;
  onToggleEnabled?: () => void;
  onEQChange?: (settings: Partial<EQSettings>) => void;
  onCompressorChange?: (settings: Partial<CompressorSettings>) => void;
  onReverbChange?: (settings: Partial<ReverbSettings>) => void;
  onReset?: () => void;
  getCompressorReduction?: () => number;
  trigger?: React.ReactNode;
  className?: string;
}

export const StemEffectsSheet = memo(({
  stem,
  effects,
  enabled,
  onToggleEnabled,
  onEQChange,
  onCompressorChange,
  onReverbChange,
  onReset,
  getCompressorReduction,
  trigger,
  className,
}: StemEffectsSheetProps) => {
  const [open, setOpen] = useState(false);
  const Icon = stemIcons[stem.stem_type.toLowerCase()] || stemIcons.other;
  
  // Check if any effects are active
  const hasActiveEffects = 
    effects.eq.lowGain !== 0 || 
    effects.eq.midGain !== 0 || 
    effects.eq.highGain !== 0 ||
    effects.compressor.enabled ||
    effects.reverb.enabled;
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className={cn("gap-2", className)}
          >
            <Sliders className="w-4 h-4" />
            Эффекты
            {hasActiveEffects && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </Button>
        )}
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[75vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {stem.stem_type} — Эффекты
          </SheetTitle>
          <SheetDescription>
            Настройте эквалайзер, компрессор и реверберацию
          </SheetDescription>
        </SheetHeader>
        
        {/* Effects Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30 mb-4">
          <div>
            <p className="text-sm font-medium">Режим эффектов</p>
            <p className="text-xs text-muted-foreground">
              {enabled ? 'Эффекты активны' : 'Эффекты отключены'}
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={onToggleEnabled}
          />
        </div>
        
        {enabled ? (
          <Tabs defaultValue="eq" className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-10">
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
                Реверб
                {effects.reverb.enabled && (
                  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="eq" className="mt-4 space-y-4">
              <EQControl 
                settings={effects.eq} 
                onChange={onEQChange} 
              />
            </TabsContent>
            
            <TabsContent value="compressor" className="mt-4 space-y-4">
              <CompressorControlSimple 
                settings={effects.compressor} 
                onChange={onCompressorChange}
                getReduction={getCompressorReduction}
              />
            </TabsContent>
            
            <TabsContent value="reverb" className="mt-4 space-y-4">
              <ReverbControlSimple 
                settings={effects.reverb} 
                onChange={onReverbChange}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sliders className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Включите режим эффектов для настройки звука
            </p>
          </div>
        )}
        
        {/* Reset Button */}
        {enabled && hasActiveEffects && (
          <div className="mt-6 pt-4 border-t border-border/30">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="w-full gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Сбросить все эффекты
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
});

// Simple EQ Control
const EQControl = memo(({
  settings,
  onChange,
}: {
  settings: EQSettings;
  onChange?: (settings: Partial<EQSettings>) => void;
}) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span>Низкие (Low)</span>
        <span className="font-mono">{settings.lowGain > 0 ? '+' : ''}{settings.lowGain}dB</span>
      </div>
      <Slider
        value={[settings.lowGain]}
        min={-12}
        max={12}
        step={1}
        onValueChange={(v) => onChange?.({ lowGain: v[0] })}
      />
    </div>
    
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span>Средние (Mid)</span>
        <span className="font-mono">{settings.midGain > 0 ? '+' : ''}{settings.midGain}dB</span>
      </div>
      <Slider
        value={[settings.midGain]}
        min={-12}
        max={12}
        step={1}
        onValueChange={(v) => onChange?.({ midGain: v[0] })}
      />
    </div>
    
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span>Высокие (High)</span>
        <span className="font-mono">{settings.highGain > 0 ? '+' : ''}{settings.highGain}dB</span>
      </div>
      <Slider
        value={[settings.highGain]}
        min={-12}
        max={12}
        step={1}
        onValueChange={(v) => onChange?.({ highGain: v[0] })}
      />
    </div>
  </div>
));

// Simple Compressor Control
const CompressorControlSimple = memo(({
  settings,
  onChange,
  getReduction,
}: {
  settings: CompressorSettings;
  onChange?: (settings: Partial<CompressorSettings>) => void;
  getReduction?: () => number;
}) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <span className="text-sm">Включён</span>
      <Switch
        checked={settings.enabled}
        onCheckedChange={(enabled) => onChange?.({ enabled })}
      />
    </div>
    
    {settings.enabled && (
      <>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Порог (Threshold)</span>
            <span className="font-mono">{settings.threshold}dB</span>
          </div>
          <Slider
            value={[settings.threshold]}
            min={-60}
            max={0}
            step={1}
            onValueChange={(v) => onChange?.({ threshold: v[0] })}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Ratio</span>
            <span className="font-mono">{settings.ratio}:1</span>
          </div>
          <Slider
            value={[settings.ratio]}
            min={1}
            max={20}
            step={0.5}
            onValueChange={(v) => onChange?.({ ratio: v[0] })}
          />
        </div>
        
        {getReduction && (
          <div className="p-2 bg-muted/30 rounded text-center">
            <span className="text-xs text-muted-foreground">Reduction: </span>
            <span className="text-xs font-mono">{getReduction().toFixed(1)}dB</span>
          </div>
        )}
      </>
    )}
  </div>
));

// Simple Reverb Control  
const ReverbControlSimple = memo(({
  settings,
  onChange,
}: {
  settings: ReverbSettings;
  onChange?: (settings: Partial<ReverbSettings>) => void;
}) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <span className="text-sm">Включён</span>
      <Switch
        checked={settings.enabled}
        onCheckedChange={(enabled) => onChange?.({ enabled })}
      />
    </div>
    
    {settings.enabled && (
      <>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Decay (Затухание)</span>
            <span className="font-mono">{settings.decay.toFixed(1)}s</span>
          </div>
          <Slider
            value={[settings.decay]}
            min={0.1}
            max={10}
            step={0.1}
            onValueChange={(v) => onChange?.({ decay: v[0] })}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Wet/Dry Mix</span>
            <span className="font-mono">{Math.round(settings.wetDry * 100)}%</span>
          </div>
          <Slider
            value={[settings.wetDry]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => onChange?.({ wetDry: v[0] })}
          />
        </div>
      </>
    )}
  </div>
));

EQControl.displayName = 'EQControl';
CompressorControlSimple.displayName = 'CompressorControlSimple';
ReverbControlSimple.displayName = 'ReverbControlSimple';
StemEffectsSheet.displayName = 'StemEffectsSheet';
