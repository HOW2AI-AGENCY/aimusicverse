/**
 * Dynamics Compressor Control
 */

import { useState, useEffect } from 'react';
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
import { RotateCcw, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompressorSettings, compressorPresets, defaultCompressorSettings } from '@/hooks/studio';

interface CompressorControlProps {
  settings: CompressorSettings;
  onChange: (settings: Partial<CompressorSettings>) => void;
  onPresetChange: (preset: keyof typeof compressorPresets) => void;
  getReduction?: () => number;
}

const presetLabels: Record<keyof typeof compressorPresets, string> = {
  off: 'Выкл',
  gentle: 'Мягкий',
  moderate: 'Средний',
  heavy: 'Сильный',
  vocals: 'Вокал',
  drums: 'Ударные',
};

export function CompressorControl({ 
  settings, 
  onChange, 
  onPresetChange,
  getReduction,
}: CompressorControlProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>(settings.enabled ? 'moderate' : 'off');
  const [reduction, setReduction] = useState(0);

  // Poll gain reduction meter
  useEffect(() => {
    if (!settings.enabled || !getReduction) return;

    const interval = setInterval(() => {
      setReduction(getReduction());
    }, 50);

    return () => clearInterval(interval);
  }, [settings.enabled, getReduction]);

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    onPresetChange(value as keyof typeof compressorPresets);
  };

  const handleReset = () => {
    setSelectedPreset('off');
    onChange(defaultCompressorSettings);
  };

  const handleToggle = (enabled: boolean) => {
    onChange({ enabled });
    setSelectedPreset(enabled ? 'moderate' : 'off');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Switch
            checked={settings.enabled}
            onCheckedChange={handleToggle}
            id="compressor-toggle"
          />
          <Label htmlFor="compressor-toggle" className="text-sm font-medium cursor-pointer">
            Компрессор
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

      {/* Gain Reduction Meter */}
      {settings.enabled && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Gain Reduction
            </span>
            <span className="tabular-nums">{Math.abs(reduction).toFixed(1)} dB</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-75 rounded-full",
                Math.abs(reduction) > 12 ? "bg-red-500" : 
                Math.abs(reduction) > 6 ? "bg-yellow-500" : "bg-green-500"
              )}
              style={{ width: `${Math.min(100, Math.abs(reduction) * 5)}%` }}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className={cn(
        "grid grid-cols-2 gap-4 transition-opacity",
        !settings.enabled && "opacity-50 pointer-events-none"
      )}>
        {/* Threshold */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Threshold</span>
            <span className="tabular-nums font-medium">{settings.threshold} dB</span>
          </div>
          <Slider
            value={[settings.threshold]}
            min={-60}
            max={0}
            step={1}
            onValueChange={(v) => onChange({ threshold: v[0] })}
            disabled={!settings.enabled}
          />
        </div>

        {/* Ratio */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Ratio</span>
            <span className="tabular-nums font-medium">{settings.ratio}:1</span>
          </div>
          <Slider
            value={[settings.ratio]}
            min={1}
            max={20}
            step={0.5}
            onValueChange={(v) => onChange({ ratio: v[0] })}
            disabled={!settings.enabled}
          />
        </div>

        {/* Attack */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Attack</span>
            <span className="tabular-nums font-medium">{(settings.attack * 1000).toFixed(0)} ms</span>
          </div>
          <Slider
            value={[settings.attack]}
            min={0}
            max={0.1}
            step={0.001}
            onValueChange={(v) => onChange({ attack: v[0] })}
            disabled={!settings.enabled}
          />
        </div>

        {/* Release */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Release</span>
            <span className="tabular-nums font-medium">{(settings.release * 1000).toFixed(0)} ms</span>
          </div>
          <Slider
            value={[settings.release]}
            min={0.01}
            max={1}
            step={0.01}
            onValueChange={(v) => onChange({ release: v[0] })}
            disabled={!settings.enabled}
          />
        </div>

        {/* Knee (full width) */}
        <div className="col-span-2 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Knee</span>
            <span className="tabular-nums font-medium">{settings.knee} dB</span>
          </div>
          <Slider
            value={[settings.knee]}
            min={0}
            max={40}
            step={1}
            onValueChange={(v) => onChange({ knee: v[0] })}
            disabled={!settings.enabled}
          />
        </div>
      </div>
    </div>
  );
}
