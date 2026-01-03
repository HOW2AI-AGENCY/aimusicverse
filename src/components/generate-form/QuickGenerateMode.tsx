/**
 * QuickGenerateMode - Minimal generation form with just essential fields
 * For users who want to generate quickly without all options
 */

import { memo, useState } from 'react';
import { motion } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Mic, Volume2, ChevronRight } from 'lucide-react';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import { cn } from '@/lib/utils';

interface QuickGenerateModeProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  hasVocals: boolean;
  onHasVocalsChange: (value: boolean) => void;
  onExpandToFull: () => void;
  onGenerate: () => void;
  isLoading: boolean;
  className?: string;
}

const QUICK_PRESETS = [
  { label: 'Поп хит', value: 'upbeat pop, catchy melody, modern production' },
  { label: 'Лофи', value: 'lofi hip hop, chill beats, relaxing, study music' },
  { label: 'Рок', value: 'rock, electric guitar, drums, energetic' },
  { label: 'Электро', value: 'electronic, synth, bass drop, EDM' },
  { label: 'Акустика', value: 'acoustic, guitar, soft vocals, intimate' },
  { label: 'R&B', value: 'R&B, smooth, soulful, groove' },
];

export const QuickGenerateMode = memo(function QuickGenerateMode({
  description,
  onDescriptionChange,
  hasVocals,
  onHasVocalsChange,
  onExpandToFull,
  onGenerate,
  isLoading,
  className,
}: QuickGenerateModeProps) {
  const charCount = description.length;
  const maxChars = 500;
  const isOverLimit = charCount > maxChars;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-4", className)}
    >
      {/* Quick Presets */}
      <div>
        <Label className="text-xs font-medium mb-2 block">Быстрый выбор</Label>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant={description.includes(preset.value) ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs rounded-full"
              onClick={() => onDescriptionChange(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="relative">
        <Label className="text-xs font-medium mb-1.5 block">
          Опишите музыку
        </Label>
        <Textarea
          placeholder="Например: энергичный поп с синтезаторами и танцевальным битом"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          className={cn(
            "text-sm resize-none pr-10",
            isOverLimit && "border-destructive focus-visible:ring-destructive"
          )}
        />
        <div className="absolute right-2 top-8 flex flex-col items-end gap-1">
          <VoiceInputButton
            onResult={onDescriptionChange}
            context="style"
            currentValue={description}
            className="h-7 w-7"
          />
        </div>
        <div className={cn(
          "text-[10px] mt-1 text-right transition-colors",
          isOverLimit ? "text-destructive" : "text-muted-foreground"
        )}>
          {charCount}/{maxChars}
        </div>
      </div>

      {/* Vocals Toggle - Compact */}
      <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
        <div className="flex items-center gap-2">
          {hasVocals ? (
            <Mic className="w-4 h-4 text-primary" />
          ) : (
            <Volume2 className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">
            {hasVocals ? 'С вокалом' : 'Инструментал'}
          </span>
        </div>
        <Switch
          checked={hasVocals}
          onCheckedChange={onHasVocalsChange}
        />
      </div>

      {/* Expand to Full */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-muted-foreground hover:text-foreground"
        onClick={onExpandToFull}
      >
        Больше настроек
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </motion.div>
  );
});
