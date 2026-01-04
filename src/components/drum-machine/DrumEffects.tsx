import React, { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings2, Volume2, Waves, Gauge } from 'lucide-react';
import type { TrackEffects } from '@/hooks/useDrumMachine';
import type { DrumSound } from '@/lib/drum-kits';

interface DrumEffectsProps {
  sounds: DrumSound[];
  trackEffects: Record<string, TrackEffects>;
  onSetEffect: (soundId: string, effects: Partial<TrackEffects>) => void;
  className?: string;
}

interface TrackEffectsPanelProps {
  sound: DrumSound;
  effects: TrackEffects;
  onSetEffect: (effects: Partial<TrackEffects>) => void;
}

const TrackEffectsPanel = memo(function TrackEffectsPanel({
  sound,
  effects,
  onSetEffect
}: TrackEffectsPanelProps) {
  return (
    <div className="space-y-4 p-3 rounded-lg bg-muted/30">
      <div className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: sound.color }}
        />
        <span className="font-medium text-sm">{sound.name}</span>
      </div>

      {/* Volume & Pan */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Volume2 className="w-3 h-3" />
            Volume
          </Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[effects.volume]}
              min={-40}
              max={6}
              step={1}
              onValueChange={([v]) => onSetEffect({ volume: v })}
              className="flex-1"
            />
            <span className="text-xs font-mono w-8 text-right">{effects.volume}dB</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Pan</Label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">L</span>
            <Slider
              value={[effects.pan]}
              min={-1}
              max={1}
              step={0.1}
              onValueChange={([v]) => onSetEffect({ pan: v })}
              className="flex-1"
            />
            <span className="text-[10px] text-muted-foreground">R</span>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="space-y-2 pt-2 border-t">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Waves className="w-3 h-3" />
            Filter
          </Label>
          <Switch
            checked={effects.filter.enabled}
            onCheckedChange={(enabled) => 
              onSetEffect({ filter: { ...effects.filter, enabled } })
            }
          />
        </div>
        
        {effects.filter.enabled && (
          <div className="grid grid-cols-2 gap-3 pl-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Cutoff</Label>
              <Slider
                value={[effects.filter.frequency]}
                min={100}
                max={20000}
                step={100}
                onValueChange={([v]) => 
                  onSetEffect({ filter: { ...effects.filter, frequency: v } })
                }
              />
              <span className="text-[10px] font-mono">{effects.filter.frequency}Hz</span>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Resonance</Label>
              <Slider
                value={[effects.filter.resonance]}
                min={0}
                max={20}
                step={0.5}
                onValueChange={([v]) => 
                  onSetEffect({ filter: { ...effects.filter, resonance: v } })
                }
              />
              <span className="text-[10px] font-mono">Q: {effects.filter.resonance}</span>
            </div>
          </div>
        )}
      </div>

      {/* Compressor */}
      <div className="space-y-2 pt-2 border-t">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Gauge className="w-3 h-3" />
            Compressor
          </Label>
          <Switch
            checked={effects.compressor.enabled}
            onCheckedChange={(enabled) => 
              onSetEffect({ compressor: { ...effects.compressor, enabled } })
            }
          />
        </div>
        
        {effects.compressor.enabled && (
          <div className="grid grid-cols-2 gap-3 pl-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Threshold</Label>
              <Slider
                value={[effects.compressor.threshold]}
                min={-60}
                max={0}
                step={1}
                onValueChange={([v]) => 
                  onSetEffect({ compressor: { ...effects.compressor, threshold: v } })
                }
              />
              <span className="text-[10px] font-mono">{effects.compressor.threshold}dB</span>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Ratio</Label>
              <Slider
                value={[effects.compressor.ratio]}
                min={1}
                max={20}
                step={0.5}
                onValueChange={([v]) => 
                  onSetEffect({ compressor: { ...effects.compressor, ratio: v } })
                }
              />
              <span className="text-[10px] font-mono">{effects.compressor.ratio}:1</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export const DrumEffects = memo(function DrumEffects({
  sounds,
  trackEffects,
  onSetEffect,
  className
}: DrumEffectsProps) {
  const [selectedTrack, setSelectedTrack] = useState<string>(sounds[0]?.id || '');

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className={cn('h-8 gap-1.5', className)}>
          <Settings2 className="w-3.5 h-3.5" />
          <span className="text-xs">FX</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Эффекты треков
          </SheetTitle>
        </SheetHeader>

        <Tabs value={selectedTrack} onValueChange={setSelectedTrack} className="mt-4">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
            {sounds.map((sound) => (
              <TabsTrigger
                key={sound.id}
                value={sound.id}
                className="h-7 px-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                style={{ 
                  borderColor: selectedTrack === sound.id ? sound.color : undefined 
                }}
              >
                {sound.shortName}
              </TabsTrigger>
            ))}
          </TabsList>

          {sounds.map((sound) => (
            <TabsContent key={sound.id} value={sound.id} className="mt-4">
              {trackEffects[sound.id] && (
                <TrackEffectsPanel
                  sound={sound}
                  effects={trackEffects[sound.id]}
                  onSetEffect={(effects) => onSetEffect(sound.id, effects)}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
});
