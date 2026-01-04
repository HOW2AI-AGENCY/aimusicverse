/**
 * GenerationAdvancedSettings - Reusable Suno API settings component with presets
 * Used in: AddVocalsDialog, AddInstrumentalDialog
 */

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Settings2, ChevronDown, Zap, Target, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GenerationSettings {
  audioWeight: number;
  styleWeight: number;
  weirdnessConstraint: number;
  model: 'V4_5PLUS' | 'V5';
  vocalGender: 'm' | 'f' | '';
}

interface Preset {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  settings: Omit<GenerationSettings, 'vocalGender'>;
}

const PRESETS: Preset[] = [
  {
    id: 'precise',
    name: 'Точное следование',
    icon: <Target className="w-3 h-3" />,
    description: 'Максимально следует оригиналу',
    settings: {
      audioWeight: 0.9,
      styleWeight: 0.8,
      weirdnessConstraint: 0.1,
      model: 'V4_5PLUS',
    },
  },
  {
    id: 'balanced',
    name: 'Баланс',
    icon: <Zap className="w-3 h-3" />,
    description: 'Оптимальный баланс точности и креатива',
    settings: {
      audioWeight: 0.7,
      styleWeight: 0.6,
      weirdnessConstraint: 0.3,
      model: 'V4_5PLUS',
    },
  },
  {
    id: 'creative',
    name: 'Креативный',
    icon: <Sparkles className="w-3 h-3" />,
    description: 'Больше свободы для AI',
    settings: {
      audioWeight: 0.5,
      styleWeight: 0.4,
      weirdnessConstraint: 0.6,
      model: 'V5',
    },
  },
];

interface GenerationAdvancedSettingsProps {
  settings: GenerationSettings;
  onChange: (settings: GenerationSettings) => void;
  showVocalGender?: boolean;
  vocalGenderLabel?: string;
  className?: string;
  /** If true, settings are expanded by default */
  defaultOpen?: boolean;
}

export function GenerationAdvancedSettings({
  settings,
  onChange,
  showVocalGender = true,
  vocalGenderLabel = 'Пол вокала',
  className,
  defaultOpen = false,
}: GenerationAdvancedSettingsProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [activePreset, setActivePreset] = useState<string | null>('balanced');

  const handlePresetSelect = (preset: Preset) => {
    setActivePreset(preset.id);
    onChange({
      ...settings,
      ...preset.settings,
    });
  };

  const handleSettingChange = <K extends keyof GenerationSettings>(
    key: K,
    value: GenerationSettings[K]
  ) => {
    setActivePreset(null); // Clear preset when manually changing
    onChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={className}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-2 h-auto">
          <span className="flex items-center gap-2 text-sm">
            <Settings2 className="w-4 h-4" />
            Расширенные настройки
          </span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-4 pt-4">
        {/* Presets */}
        <div className="space-y-2">
          <Label className="text-xs">Пресеты</Label>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={cn(
                  "p-2 rounded-lg border text-left transition-all",
                  "hover:border-primary/50 hover:bg-accent/50",
                  activePreset === preset.id && "border-primary bg-primary/10"
                )}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {preset.icon}
                  <span className="text-xs font-medium">{preset.name}</span>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-1">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Audio Weight */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm">Следование аудио</Label>
            <span className="text-sm text-muted-foreground">{settings.audioWeight.toFixed(2)}</span>
          </div>
          <Slider
            value={[settings.audioWeight]}
            onValueChange={([v]) => handleSettingChange('audioWeight', v)}
            min={0}
            max={1}
            step={0.05}
          />
          <p className="text-xs text-muted-foreground">
            Выше = точнее следует ритму и мелодии оригинала
          </p>
        </div>

        {/* Style Weight */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm">Следование стилю</Label>
            <span className="text-sm text-muted-foreground">{settings.styleWeight.toFixed(2)}</span>
          </div>
          <Slider
            value={[settings.styleWeight]}
            onValueChange={([v]) => handleSettingChange('styleWeight', v)}
            min={0}
            max={1}
            step={0.05}
          />
          <p className="text-xs text-muted-foreground">
            Выше = точнее соответствует указанному стилю
          </p>
        </div>

        {/* Weirdness */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm">Креативность</Label>
            <span className="text-sm text-muted-foreground">{settings.weirdnessConstraint.toFixed(2)}</span>
          </div>
          <Slider
            value={[settings.weirdnessConstraint]}
            onValueChange={([v]) => handleSettingChange('weirdnessConstraint', v)}
            min={0}
            max={1}
            step={0.05}
          />
          <p className="text-xs text-muted-foreground">
            Выше = более экспериментальный результат
          </p>
        </div>

        {/* Model */}
        <div className="space-y-2">
          <Label className="text-sm">Модель</Label>
          <Select 
            value={settings.model} 
            onValueChange={(v) => handleSettingChange('model', v as 'V4_5PLUS' | 'V5')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="V4_5PLUS">V4.5 Plus (рекомендуется)</SelectItem>
              <SelectItem value="V5">V5 (новейшая)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vocal Gender */}
        {showVocalGender && (
          <div className="space-y-2">
            <Label className="text-sm">{vocalGenderLabel}</Label>
            <Select 
              value={settings.vocalGender} 
              onValueChange={(v) => handleSettingChange('vocalGender', v as 'm' | 'f' | '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Не указано" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Не указано</SelectItem>
                <SelectItem value="m">Мужской</SelectItem>
                <SelectItem value="f">Женский</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}