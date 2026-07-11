// src/components/generate-form/AdvancedSettings.tsx
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Info, Settings2 } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { glass } from "@/lib/glass";

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

function InfoTip({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Подробнее"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-64 text-xs">
        {text}
      </PopoverContent>
    </Popover>
  );
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

      <CollapsibleContent className={cn("space-y-2 p-3.5 mt-2 rounded-xl", glass.subtle)}>
        {/* Card: Стиль влияния */}
        <div className="rounded-xl border bg-card/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">🎚 Влияние стиля</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tabular-nums">{Math.round(props.styleWeight[0] * 100)}%</span>
              <InfoTip text="Как сильно AI следует описанию стиля. Ниже — креативнее, выше — точнее." />
            </div>
          </div>
          <Slider value={props.styleWeight} onValueChange={props.onStyleWeightChange} min={0} max={1} step={0.05} />
        </div>

        {/* Card: Креативность */}
        <div className="rounded-xl border bg-card/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">🎲 Креативность</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tabular-nums">
                {Math.round(props.weirdnessConstraint[0] * 100)}%
              </span>
              <InfoTip text="Насколько неожиданные решения допускаются. Предсказуемо ← → Экспериментально." />
            </div>
          </div>
          <Slider
            value={props.weirdnessConstraint}
            onValueChange={props.onWeirdnessConstraintChange}
            min={0}
            max={1}
            step={0.05}
          />
        </div>

        {/* Card: Пол вокала */}
        <div className="rounded-xl border bg-card/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">🎤 Пол вокала</Label>
            <InfoTip text="Женский / мужской вокал или авто-выбор." />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {VOCAL_OPTIONS.map(({ value, label }) => (
              <Button
                key={value || "any"}
                type="button"
                variant={props.vocalGender === value ? "default" : "outline"}
                size="sm"
                onClick={() => props.onVocalGenderChange(value)}
                className="text-xs h-11 min-h-touch rounded-lg"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Card: Сила аудио/персоны (conditional) */}
        {(props.hasReferenceAudio || props.hasPersona) && (
          <div className="rounded-xl border bg-card/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">
                🎯 {getAudioWeightLabel(props.hasReferenceAudio, !!props.hasPersona)}
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tabular-nums">{Math.round(props.audioWeight[0] * 100)}%</span>
                <InfoTip text="Влияние выбранного аудио или персоны на результат." />
              </div>
            </div>
            <Slider value={props.audioWeight} onValueChange={props.onAudioWeightChange} min={0} max={1} step={0.05} />
          </div>
        )}

        {/* Card: Исключить */}
        <div className="rounded-xl border bg-card/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="negative-tags" className="text-xs font-medium">
              🚫 Исключить
            </Label>
            <InfoTip text="Теги, которые AI будет избегать в генерации." />
          </div>
          <Input
            id="negative-tags"
            placeholder="piano, drums, autotune"
            value={props.negativeTags}
            onChange={(e) => props.onNegativeTagsChange(e.target.value)}
            className="h-10 text-sm rounded-lg bg-background/60"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
