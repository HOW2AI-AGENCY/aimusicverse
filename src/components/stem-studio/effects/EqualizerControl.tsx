/**
 * 3-Band Parametric EQ Control
 */

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EQSettings, eqPresets, defaultEQSettings } from '@/hooks/useStemAudioEngine';

interface EqualizerControlProps {
  settings: EQSettings;
  onChange: (settings: Partial<EQSettings>) => void;
  onPresetChange: (preset: keyof typeof eqPresets) => void;
  color?: string;
}

const presetLabels: Record<keyof typeof eqPresets, string> = {
  flat: 'Плоский',
  warm: 'Тёплый',
  bright: 'Яркий',
  bass_boost: 'Басы +',
  vocal_presence: 'Вокал',
  scoop: 'Scooped',
};

export function EqualizerControl({ 
  settings, 
  onChange, 
  onPresetChange,
  color = 'primary'
}: EqualizerControlProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('flat');

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    onPresetChange(value as keyof typeof eqPresets);
  };

  const handleReset = () => {
    setSelectedPreset('flat');
    onChange(defaultEQSettings);
  };

  // Check if current settings match any preset
  const isModified = 
    settings.lowGain !== 0 || 
    settings.midGain !== 0 || 
    settings.highGain !== 0;

  return (
    <div className="space-y-4">
      {/* Header with preset and reset */}
      <div className="flex items-center justify-between gap-2">
        <Select value={selectedPreset} onValueChange={handlePresetChange}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
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
          disabled={!isModified}
          className="h-8 px-2 text-xs"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Сброс
        </Button>
      </div>

      {/* EQ Visualization */}
      <div className="relative h-24 bg-muted/30 rounded-lg overflow-hidden">
        {/* Frequency response curve visualization */}
        <svg 
          viewBox="0 0 200 80" 
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <line x1="0" y1="40" x2="200" y2="40" stroke="currentColor" strokeOpacity="0.1" />
          <line x1="50" y1="0" x2="50" y2="80" stroke="currentColor" strokeOpacity="0.1" />
          <line x1="100" y1="0" x2="100" y2="80" stroke="currentColor" strokeOpacity="0.1" />
          <line x1="150" y1="0" x2="150" y2="80" stroke="currentColor" strokeOpacity="0.1" />
          
          {/* EQ curve */}
          <path
            d={`M 0 ${40 - settings.lowGain * 2.5} 
                Q 25 ${40 - settings.lowGain * 2.5}, 50 ${40 - settings.lowGain * 1.5}
                Q 75 ${40 - (settings.lowGain + settings.midGain) * 0.8}, 100 ${40 - settings.midGain * 2.5}
                Q 125 ${40 - (settings.midGain + settings.highGain) * 0.8}, 150 ${40 - settings.highGain * 1.5}
                Q 175 ${40 - settings.highGain * 2.5}, 200 ${40 - settings.highGain * 2.5}`}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            className="transition-all duration-150"
          />
          
          {/* Fill under curve */}
          <path
            d={`M 0 ${40 - settings.lowGain * 2.5} 
                Q 25 ${40 - settings.lowGain * 2.5}, 50 ${40 - settings.lowGain * 1.5}
                Q 75 ${40 - (settings.lowGain + settings.midGain) * 0.8}, 100 ${40 - settings.midGain * 2.5}
                Q 125 ${40 - (settings.midGain + settings.highGain) * 0.8}, 150 ${40 - settings.highGain * 1.5}
                Q 175 ${40 - settings.highGain * 2.5}, 200 ${40 - settings.highGain * 2.5}
                L 200 80 L 0 80 Z`}
            fill="hsl(var(--primary))"
            fillOpacity="0.1"
            className="transition-all duration-150"
          />
        </svg>

        {/* Frequency labels */}
        <div className="absolute bottom-1 left-0 right-0 flex justify-between px-2 text-[10px] text-muted-foreground">
          <span>20Hz</span>
          <span>320Hz</span>
          <span>1kHz</span>
          <span>3.2kHz</span>
          <span>20kHz</span>
        </div>
      </div>

      {/* EQ Bands */}
      <div className="grid grid-cols-3 gap-4">
        {/* Low */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-20 flex flex-col justify-center">
            <Slider
              orientation="vertical"
              value={[settings.lowGain]}
              min={-12}
              max={12}
              step={0.5}
              onValueChange={(v) => onChange({ lowGain: v[0] })}
              className="h-full"
            />
          </div>
          <div className="text-center">
            <div className={cn(
              "text-xs font-medium tabular-nums",
              settings.lowGain > 0 ? "text-green-500" : settings.lowGain < 0 ? "text-red-500" : "text-muted-foreground"
            )}>
              {settings.lowGain > 0 ? '+' : ''}{settings.lowGain.toFixed(1)} dB
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">LOW</div>
          </div>
        </div>

        {/* Mid */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-20 flex flex-col justify-center">
            <Slider
              orientation="vertical"
              value={[settings.midGain]}
              min={-12}
              max={12}
              step={0.5}
              onValueChange={(v) => onChange({ midGain: v[0] })}
              className="h-full"
            />
          </div>
          <div className="text-center">
            <div className={cn(
              "text-xs font-medium tabular-nums",
              settings.midGain > 0 ? "text-green-500" : settings.midGain < 0 ? "text-red-500" : "text-muted-foreground"
            )}>
              {settings.midGain > 0 ? '+' : ''}{settings.midGain.toFixed(1)} dB
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">MID</div>
          </div>
        </div>

        {/* High */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-20 flex flex-col justify-center">
            <Slider
              orientation="vertical"
              value={[settings.highGain]}
              min={-12}
              max={12}
              step={0.5}
              onValueChange={(v) => onChange({ highGain: v[0] })}
              className="h-full"
            />
          </div>
          <div className="text-center">
            <div className={cn(
              "text-xs font-medium tabular-nums",
              settings.highGain > 0 ? "text-green-500" : settings.highGain < 0 ? "text-red-500" : "text-muted-foreground"
            )}>
              {settings.highGain > 0 ? '+' : ''}{settings.highGain.toFixed(1)} dB
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">HIGH</div>
          </div>
        </div>
      </div>
    </div>
  );
}
