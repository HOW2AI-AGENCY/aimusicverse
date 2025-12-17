/**
 * GlobalControls - BPM, Key, Scale, Density, Brightness controls
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { KEY_OPTIONS, SCALE_OPTIONS, DURATION_OPTIONS } from '@/lib/prompt-dj-presets';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GlobalControlsProps {
  bpm: number;
  keyValue: string;
  scale: string;
  density: number;
  brightness: number;
  duration: number;
  onBpmChange: (bpm: number) => void;
  onKeyChange: (key: string) => void;
  onScaleChange: (scale: string) => void;
  onDensityChange: (density: number) => void;
  onBrightnessChange: (brightness: number) => void;
  onDurationChange: (duration: number) => void;
  disabled?: boolean;
}

export const GlobalControls = memo(function GlobalControls({
  bpm,
  keyValue,
  scale,
  density,
  brightness,
  duration,
  onBpmChange,
  onKeyChange,
  onScaleChange,
  onDensityChange,
  onBrightnessChange,
  onDurationChange,
  disabled,
}: GlobalControlsProps) {
  return (
    <div className="p-3 rounded-xl bg-card/30 border border-border/30 space-y-3">
      {/* Row 1: BPM, Key, Scale */}
      <div className="flex items-center gap-2">
        {/* BPM */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground w-8">BPM</span>
          <div className="flex items-center bg-muted/20 rounded-lg">
            <button 
              className="w-6 h-6 flex items-center justify-center text-sm hover:bg-muted/30 rounded-l-lg"
              onClick={() => onBpmChange(Math.max(60, bpm - 5))}
              disabled={disabled}
            >−</button>
            <span className="w-8 text-center font-mono text-xs font-bold">{bpm}</span>
            <button 
              className="w-6 h-6 flex items-center justify-center text-sm hover:bg-muted/30 rounded-r-lg"
              onClick={() => onBpmChange(Math.min(180, bpm + 5))}
              disabled={disabled}
            >+</button>
          </div>
        </div>

        {/* Key */}
        <Select value={keyValue} onValueChange={onKeyChange} disabled={disabled}>
          <SelectTrigger className="h-7 w-14 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KEY_OPTIONS.map((k) => (
              <SelectItem key={k} value={k} className="text-xs">{k}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Scale */}
        <Select value={scale} onValueChange={onScaleChange} disabled={disabled}>
          <SelectTrigger className="h-7 flex-1 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SCALE_OPTIONS.map((s) => (
              <SelectItem key={s.id} value={s.value} className="text-xs">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Duration */}
        <div className="flex gap-0.5">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d.value}
              className={cn(
                'px-2 py-1 text-[10px] rounded transition-all',
                duration === d.value 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted/20 hover:bg-muted/40'
              )}
              onClick={() => onDurationChange(d.value)}
              disabled={disabled}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Density & Brightness sliders */}
      <div className="grid grid-cols-2 gap-3">
        {/* Density */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Плотность</span>
            <span className={cn(
              density < 0.3 ? 'text-blue-400' : 
              density > 0.7 ? 'text-orange-400' : 'text-muted-foreground'
            )}>
              {density < 0.3 ? 'Разреженный' : density > 0.7 ? 'Плотный' : 'Средний'}
            </span>
          </div>
          <Slider
            value={[density]}
            onValueChange={([v]) => onDensityChange(v)}
            min={0}
            max={1}
            step={0.05}
            disabled={disabled}
          />
        </div>

        {/* Brightness */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Яркость</span>
            <span className={cn(
              brightness < 0.3 ? 'text-amber-400' : 
              brightness > 0.7 ? 'text-cyan-400' : 'text-muted-foreground'
            )}>
              {brightness < 0.3 ? 'Тёплый' : brightness > 0.7 ? 'Яркий' : 'Нейтральный'}
            </span>
          </div>
          <Slider
            value={[brightness]}
            onValueChange={([v]) => onBrightnessChange(v)}
            min={0}
            max={1}
            step={0.05}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
});
