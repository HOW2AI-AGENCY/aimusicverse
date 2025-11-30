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
}: AdvancedSettingsProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-between p-4 h-auto"
        >
          <span className="font-medium">Расширенные настройки</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-4 pt-4">
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
          <Label htmlFor="vocal-gender">Пол вокала</Label>
          <Select value={vocalGender} onValueChange={onVocalGenderChange}>
            <SelectTrigger id="vocal-gender" className="mt-2">
              <SelectValue placeholder="Автоматически" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Автоматически</SelectItem>
              <SelectItem value="m">Мужской</SelectItem>
              <SelectItem value="f">Женский</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Вес стиля</Label>
            <span className="text-sm text-muted-foreground">{styleWeight[0].toFixed(2)}</span>
          </div>
          <Slider
            value={styleWeight}
            onValueChange={onStyleWeightChange}
            min={0}
            max={1}
            step={0.05}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Влияние описания стиля на результат (0 - слабое, 1 - сильное)
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Креативность</Label>
            <span className="text-sm text-muted-foreground">{weirdnessConstraint[0].toFixed(2)}</span>
          </div>
          <Slider
            value={weirdnessConstraint}
            onValueChange={onWeirdnessConstraintChange}
            min={0}
            max={1}
            step={0.05}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Уровень экспериментальности (0 - стандартно, 1 - креативно)
          </p>
        </div>

        {hasReferenceAudio && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Вес референс аудио</Label>
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
              Влияние референс аудио на результат (0 - слабое, 1 - сильное)
            </p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
