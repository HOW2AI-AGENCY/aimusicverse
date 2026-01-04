/**
 * MoodStyleSelector - Mood and Style selectors with weight controls
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MOOD_PRESETS, STYLE_PRESETS, PresetItem } from '@/lib/prompt-dj-presets';

interface MoodStyleSelectorProps {
  moodId: string | null;
  styleId: string | null;
  moodWeight: number;
  styleWeight: number;
  onMoodChange: (id: string | null) => void;
  onStyleChange: (id: string | null) => void;
  onMoodWeightChange: (weight: number) => void;
  onStyleWeightChange: (weight: number) => void;
  disabled?: boolean;
}

export const MoodStyleSelector = memo(function MoodStyleSelector({
  moodId,
  styleId,
  moodWeight,
  styleWeight,
  onMoodChange,
  onStyleChange,
  onMoodWeightChange,
  onStyleWeightChange,
  disabled,
}: MoodStyleSelectorProps) {
  const mood = MOOD_PRESETS.find(m => m.id === moodId);
  const style = STYLE_PRESETS.find(s => s.id === styleId);

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Mood selector */}
      <div className="p-3 rounded-xl bg-card/30 border border-border/30 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-pink-400">Настроение</span>
          <span className="text-[10px] text-muted-foreground">
            {Math.round(moodWeight * 100)}%
          </span>
        </div>
        
        <Select 
          value={moodId || ''} 
          onValueChange={(v) => onMoodChange(v || null)}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 text-xs bg-pink-500/10 border-pink-500/30">
            <SelectValue placeholder="Выберите" />
          </SelectTrigger>
          <SelectContent>
            {MOOD_PRESETS.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-xs">
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Slider
          value={[moodWeight]}
          onValueChange={([v]) => onMoodWeightChange(v)}
          min={0}
          max={1}
          step={0.05}
          disabled={disabled || !moodId}
          className={cn(!moodId && 'opacity-50')}
        />
      </div>

      {/* Style selector */}
      <div className="p-3 rounded-xl bg-card/30 border border-border/30 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-green-400">Характер</span>
          <span className="text-[10px] text-muted-foreground">
            {Math.round(styleWeight * 100)}%
          </span>
        </div>
        
        <Select 
          value={styleId || ''} 
          onValueChange={(v) => onStyleChange(v || null)}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 text-xs bg-green-500/10 border-green-500/30">
            <SelectValue placeholder="Выберите" />
          </SelectTrigger>
          <SelectContent>
            {STYLE_PRESETS.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-xs">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Slider
          value={[styleWeight]}
          onValueChange={([v]) => onStyleWeightChange(v)}
          min={0}
          max={1}
          step={0.05}
          disabled={disabled || !styleId}
          className={cn(!styleId && 'opacity-50')}
        />
      </div>
    </div>
  );
});
