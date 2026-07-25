// src/components/generate-form/AdvancedSettings.tsx
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, Settings2 } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { glass } from "@/lib/glass";
import { FormSliderRow, FormSettingCard } from "./primitives";

type VocalGender = "" | "m" | "f";

interface AdvancedSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negativeTags: string;
  onNegativeTagsChange: (value: string) => void;
  vocalGender: VocalGender;
  onVocalGenderChange: (value: VocalGender) => void;
  styleWeight: number[];
  onStyleWeightChange: (value: number[]) => void;
  weirdnessConstraint: number[];
  onWeirdnessConstraintChange: (value: number[]) => void;
  audioWeight: number[];
  onAudioWeightChange: (value: number[]) => void;
  hasReferenceAudio: boolean;
  hasPersona?: boolean;
}

const VOCAL_OPTIONS: { value: VocalGender; label: string }[] = [
  { value: "", label: "Любой" },
  { value: "f", label: "Женский" },
  { value: "m", label: "Мужской" },
];

function getAudioWeightLabel(hasRef: boolean, hasPersona: boolean): string {
  if (hasRef && hasPersona) return "Сила аудио / персоны";
  if (hasRef) return "Сила аудио";
  return "Сила персоны";
}

export function AdvancedSettings({ open, onOpenChange, ...props }: AdvancedSettingsProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "w-full justify-between gap-2 h-11 px-3 rounded-xl",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
          )}
        >
          <span className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
            <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
            Расширенные настройки
          </span>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className={cn("space-y-2.5 p-4 mt-2 rounded-xl", glass.subtle)}>
        <FormSliderRow
          label="🎚 Влияние стиля"
          value={props.styleWeight}
          onValueChange={props.onStyleWeightChange}
          info="Как сильно AI следует описанию стиля. Ниже — креативнее, выше — точнее."
        />

        <FormSliderRow
          label="🎲 Креативность"
          value={props.weirdnessConstraint}
          onValueChange={props.onWeirdnessConstraintChange}
          info="Насколько неожиданные решения допускаются. Предсказуемо ← → Экспериментально."
        />

        <FormSettingCard label="🎤 Пол вокала" info="Женский / мужской вокал или авто-выбор.">
          <div className="grid grid-cols-3 gap-1.5">
            {VOCAL_OPTIONS.map(({ value, label }) => (
              <Button
                key={value || "any"}
                type="button"
                variant={props.vocalGender === value ? "default" : "outline"}
                size="sm"
                onClick={() => props.onVocalGenderChange(value)}
                className="text-xs h-10 rounded-lg"
              >
                {label}
              </Button>
            ))}
          </div>
        </FormSettingCard>

        {(props.hasReferenceAudio || props.hasPersona) && (
          <FormSliderRow
            label={`🎯 ${getAudioWeightLabel(props.hasReferenceAudio, !!props.hasPersona)}`}
            value={props.audioWeight}
            onValueChange={props.onAudioWeightChange}
            info="Влияние выбранного аудио или персоны на результат."
          />
        )}

        <FormSettingCard label="🚫 Исключить" info="Теги, которые AI будет избегать в генерации.">
          <Input
            id="negative-tags"
            placeholder="piano, drums, autotune"
            value={props.negativeTags}
            onChange={(e) => props.onNegativeTagsChange(e.target.value)}
            className="h-10 text-sm rounded-lg bg-background/60"
          />
        </FormSettingCard>
      </CollapsibleContent>
    </Collapsible>
  );
}
