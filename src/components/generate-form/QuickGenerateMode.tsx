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
      {/* Quick Presets - Horizontal Scroll */}
      <div>
        <Label className="text-xs font-medium mb-2 block">Быстрый выбор</Label>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {QUICK_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant={description.includes(preset.value) ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs rounded-full flex-shrink-0 whitespace-nowrap"
              onClick={() => onDescriptionChange(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Description - Dynamic header based on vocals toggle */}
      <div className="relative">
        <Label className="text-xs font-medium mb-1.5 block">
          {hasVocals ? '🎤 Опишите песню с вокалом' : '🎹 Опишите инструментал'}
        </Label>
        <Textarea
          placeholder={hasVocals 
            ? "Например: энергичный поп с запоминающимся припевом и женским вокалом" 
            : "Например: атмосферный эмбиент с синтезаторами и глубоким басом"
          }
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

      {/* Vocals Toggle - Redesigned as segmented control */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Тип трека</Label>
        <div className="flex p-1 bg-muted/50 rounded-xl">
          <button
            type="button"
            onClick={() => onHasVocalsChange(true)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200",
              hasVocals 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Mic className="w-4 h-4" />
            <span>Вокал</span>
          </button>
          <button
            type="button"
            onClick={() => onHasVocalsChange(false)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200",
              !hasVocals 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Volume2 className="w-4 h-4" />
            <span>Инструментал</span>
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          {hasVocals 
            ? 'AI сгенерирует вокал по тексту песни' 
            : 'Чистая музыка без голоса'
          }
        </p>
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
