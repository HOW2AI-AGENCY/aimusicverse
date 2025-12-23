import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import { SUNO_MODELS, getAvailableModels } from '@/constants/sunoModels';
import { ProviderSelector, type GenerationProvider } from './ProviderSelector';

/**
 * Get audio weight label based on reference type
 */
const getAudioWeightLabel = (hasReferenceAudio: boolean, hasPersona: boolean): string => {
  if (hasReferenceAudio && hasPersona) return 'Сила аудио / персоны';
  if (hasReferenceAudio) return 'Вес референс аудио';
  return 'Сила персоны';
};

/**
 * Get audio weight description based on reference type
 */
const getAudioWeightDescription = (hasReferenceAudio: boolean, hasPersona: boolean): string => {
  if (hasReferenceAudio && hasPersona) {
    return 'Влияние референс аудио и персоны на результат (0 - слабое, 1 - сильное)';
  }
  if (hasReferenceAudio) {
    return 'Влияние референс аудио на результат (0 - слабое, 1 - сильное)';
  }
  return 'Влияние персоны на стиль вокала (0 - слабое, 1 - сильное)';
};

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
  // Provider selection for cover/extend modes
  provider?: GenerationProvider;
  onProviderChange?: (provider: GenerationProvider) => void;
  audioDuration?: number | null;
  stabilityStrength?: number[];
  onStabilityStrengthChange?: (value: number[]) => void;
  showProviderSelector?: boolean;
}

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
  provider,
  onProviderChange,
  audioDuration,
  stabilityStrength,
  onStabilityStrengthChange,
  showProviderSelector = false,
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
        {/* Provider Selection for cover/extend modes */}
        {showProviderSelector && provider && onProviderChange && (
          <ProviderSelector
            provider={provider}
            onProviderChange={onProviderChange}
            audioDuration={audioDuration}
            stabilityStrength={stabilityStrength}
            onStabilityStrengthChange={onStabilityStrengthChange}
            showStrengthSlider={true}
          />
        )}

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
                {getAvailableModels().map((modelInfo) => (
                  <SelectItem key={modelInfo.key} value={modelInfo.key}>
                    <div className="flex items-center gap-2">
                      <span>{modelInfo.emoji}</span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{modelInfo.name}</span>
                          {modelInfo.status === 'latest' && (
                            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                              NEW
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{modelInfo.desc}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Show warning if selected model is deprecated */}
            {model && SUNO_MODELS[model]?.status === 'deprecated' && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <p className="text-xs text-destructive">
                  Модель {SUNO_MODELS[model].name} больше недоступна. Выберите другую модель.
                </p>
              </div>
            )}
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
              <Label>{getAudioWeightLabel(hasReferenceAudio, hasPersona)}</Label>
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
              {getAudioWeightDescription(hasReferenceAudio, hasPersona)}
            </p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
