/**
 * Reverb/Space Effect Control
 */

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RotateCcw, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReverbSettings, reverbPresets, defaultReverbSettings } from '@/hooks/useStemAudioEngine';

interface ReverbControlProps {
  settings: ReverbSettings;
  onChange: (settings: Partial<ReverbSettings>) => void;
  onPresetChange: (preset: keyof typeof reverbPresets) => void;
}

const presetLabels: Record<keyof typeof reverbPresets, string> = {
  off: 'Выкл',
  room: 'Комната',
  hall: 'Холл',
  plate: 'Plate',
  ambient: 'Ambient',
};

export function ReverbControl({ 
  settings, 
  onChange, 
  onPresetChange,
}: ReverbControlProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>(settings.enabled ? 'room' : 'off');

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    onPresetChange(value as keyof typeof reverbPresets);
  };

  const handleReset = () => {
    setSelectedPreset('off');
    onChange(defaultReverbSettings);
  };

  const handleToggle = (enabled: boolean) => {
    onChange({ enabled });
    setSelectedPreset(enabled ? 'room' : 'off');
    if (enabled) {
      // Apply room preset when enabling
      onPresetChange('room');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Switch
            checked={settings.enabled}
            onCheckedChange={handleToggle}
            id="reverb-toggle"
          />
          <Label htmlFor="reverb-toggle" className="text-sm font-medium cursor-pointer flex items-center gap-2">
            <Waves className="w-4 h-4" />
            Реверберация
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Select 
            value={selectedPreset} 
            onValueChange={handlePresetChange}
            disabled={!settings.enabled}
          >
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="Пресет" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(presetLabels).map(([key, label]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={!settings.enabled}
            className="h-8 px-2 text-xs"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Visual representation */}
      {settings.enabled && (
        <div className="relative h-12 bg-muted/30 rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-end justify-around px-2 pb-1">
            {/* Reverb visualization bars */}
            {Array.from({ length: 20 }).map((_, i) => {
              const height = Math.max(5, 100 * Math.exp(-i * 0.15 / settings.decay) * settings.wetDry);
              return (
                <div
                  key={i}
                  className="w-1 bg-primary/60 rounded-t transition-all duration-300"
                  style={{ 
                    height: `${height}%`,
                    opacity: 1 - (i * 0.04)
                  }}
                />
              );
            })}
          </div>
          <div className="absolute bottom-1 left-2 text-[10px] text-muted-foreground">
            Dry
          </div>
          <div className="absolute bottom-1 right-2 text-[10px] text-muted-foreground">
            Wet
          </div>
        </div>
      )}

      {/* Controls */}
      <div className={cn(
        "space-y-4 transition-opacity",
        !settings.enabled && "opacity-50 pointer-events-none"
      )}>
        {/* Wet/Dry Mix */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Dry / Wet Mix</span>
            <span className="tabular-nums font-medium">
              {Math.round((1 - settings.wetDry) * 100)}% / {Math.round(settings.wetDry * 100)}%
            </span>
          </div>
          <Slider
            value={[settings.wetDry]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => onChange({ wetDry: v[0] })}
            disabled={!settings.enabled}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Оригинал</span>
            <span>Эффект</span>
          </div>
        </div>

        {/* Decay */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Decay Time</span>
            <span className="tabular-nums font-medium">{settings.decay.toFixed(1)} сек</span>
          </div>
          <Slider
            value={[settings.decay]}
            min={0.1}
            max={8}
            step={0.1}
            onValueChange={(v) => onChange({ decay: v[0] })}
            disabled={!settings.enabled}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Короткий</span>
            <span>Длинный</span>
          </div>
        </div>
      </div>
    </div>
  );
}
