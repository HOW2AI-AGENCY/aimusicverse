import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface AdvancedSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negativeTags: string;
  onNegativeTagsChange: (value: string) => void;
  vocalGender: 'm' | 'f' | '';
  onVocalGenderChange: (value: 'm' | 'f' | '') => void;
  styleWeight: number[];
  onStyleWeightChange: (value: number[]) => void;
  weirdnessConstraint: number[];
  onWeirdnessConstraintChange: (value: number[]) => void;
  audioWeight: number[];
  onAudioWeightChange: (value: number[]) => void;
  hasReferenceAudio: boolean;
  hasPersona?: boolean;
  model?: string;
  onModelChange?: (value: string) => void;
}

import { SUNO_MODELS } from '@/constants/sunoModels';

export function AdvancedSettings({
  open,
  onOpenChange,
  negativeTags,
  onNegativeTagsChange,
  vocalGender,
  onVocalGenderChange,
  styleWeight,
  onStyleWeightChange,
  weirdnessConstraint,
  onWeirdnessConstraintChange,
  audioWeight,
  onAudioWeightChange,
  hasReferenceAudio,
  hasPersona = false,
  model,
  onModelChange,
}: AdvancedSettingsProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <span className="text-sm">Advanced Options</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-4 pt-4">
        {/* Model Selection */}
        {model && onModelChange && (
          <div>
            <Label htmlFor="model-select" className="text-sm text-muted-foreground">
              Модель AI
            </Label>
            <Select value={model} onValueChange={onModelChange}>
              <SelectTrigger id="model-select" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUNO_MODELS).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{info.emoji}</span>
                      <div className="flex flex-col">
                        <span className="font-medium">{info.name}</span>
                        <span className="text-xs text-muted-foreground">{info.desc}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label htmlFor="negative-tags">Нежелательные теги</Label>
          <Input
            id="negative-tags"
            placeholder="Например: piano, drums"
            value={negativeTags}
            onChange={(e) => onNegativeTagsChange(e.target.value)}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Укажите стили/инструменты, которые нужно исключить
          </p>
        </div>

        <div>
          <Label htmlFor="vocal-gender" className="text-sm text-muted-foreground">
            Тип вокала
          </Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            <Button
              type="button"
              variant={vocalGender === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onVocalGenderChange('')}
              className="text-xs"
            >
              Любой
            </Button>
            <Button
              type="button"
              variant={vocalGender === 'f' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onVocalGenderChange('f')}
              className="text-xs"
            >
              Женский
            </Button>
            <Button
              type="button"
              variant={vocalGender === 'm' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onVocalGenderChange('m')}
              className="text-xs"
            >
              Мужской
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Без вокала
            </Button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm text-muted-foreground">Влияние стиля</Label>
            <span className="text-sm font-medium text-foreground">{Math.round(styleWeight[0] * 100)}</span>
          </div>
          <Slider
            value={styleWeight}
            onValueChange={onStyleWeightChange}
            min={0}
            max={1}
            step={0.05}
            className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm text-muted-foreground">Креативность</Label>
            <span className="text-sm font-medium text-foreground">{Math.round(weirdnessConstraint[0] * 100)}</span>
          </div>
          <Slider
            value={weirdnessConstraint}
            onValueChange={onWeirdnessConstraintChange}
            min={0}
            max={1}
            step={0.05}
            className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
          />
        </div>

        {(hasReferenceAudio || hasPersona) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>
                {hasReferenceAudio && hasPersona 
                  ? 'Сила аудио / персоны' 
                  : hasReferenceAudio 
                    ? 'Вес референс аудио'
                    : 'Сила персоны'}
              </Label>
              <span className="text-sm text-muted-foreground">{audioWeight[0].toFixed(2)}</span>
            </div>
            <Slider
              value={audioWeight}
              onValueChange={onAudioWeightChange}
              min={0}
              max={1}
              step={0.05}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {hasReferenceAudio && hasPersona 
                ? 'Влияние референс аудио и персоны на результат (0 - слабое, 1 - сильное)'
                : hasReferenceAudio
                  ? 'Влияние референс аудио на результат (0 - слабое, 1 - сильное)'
                  : 'Влияние персоны на стиль вокала (0 - слабое, 1 - сильное)'}
            </p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
