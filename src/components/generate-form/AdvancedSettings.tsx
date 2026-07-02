import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, Settings2 } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { glass } from "@/lib/glass";

/**
 * Get audio weight label based on reference type
 */
const getAudioWeightLabel = (hasReferenceAudio: boolean, hasPersona: boolean): string => {
  if (hasReferenceAudio && hasPersona) return "Сила аудио / персоны";
  if (hasReferenceAudio) return "Вес референс аудио";
  return "Сила персоны";
};

/**
 * Get audio weight description based on reference type
 */
const getAudioWeightDescription = (hasReferenceAudio: boolean, hasPersona: boolean): string => {
  if (hasReferenceAudio && hasPersona) {
    return "Влияние референс аудио и персоны на результат (0 - слабое, 1 - сильное)";
  }
  if (hasReferenceAudio) {
    return "Влияние референс аудио на результат (0 - слабое, 1 - сильное)";
  }
  return "Влияние персоны на стиль вокала (0 - слабое, 1 - сильное)";
};

interface AdvancedSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negativeTags: string;
  onNegativeTagsChange: (value: string) => void;
  vocalGender: "m" | "f" | "";
  onVocalGenderChange: (value: "m" | "f" | "") => void;
  styleWeight: number[];
  onStyleWeightChange: (value: number[]) => void;
  weirdnessConstraint: number[];
  onWeirdnessConstraintChange: (value: number[]) => void;
  audioWeight: number[];
  onAudioWeightChange: (value: number[]) => void;
  hasReferenceAudio: boolean;
  hasPersona?: boolean;
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
}: AdvancedSettingsProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "w-full justify-between gap-2 h-11 px-3 rounded-xl border-dashed border-muted-foreground/30",
            "hover:border-primary/50 hover:bg-primary/5 transition-all",
          )}
        >
          <span className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
            <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
            Продвинутые настройки
          </span>
          <ChevronDown
            className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className={cn("space-y-4 p-3.5 mt-2 rounded-xl", glass.subtle)}>
        {/* Group: Vocal */}
        <section className="space-y-2">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            Вокал
          </Label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { v: "" as const, label: "Любой" },
              { v: "f" as const, label: "Женский" },
              { v: "m" as const, label: "Мужской" },
            ].map(({ v, label }) => (
              <Button
                key={v || "any"}
                type="button"
                variant={vocalGender === v ? "default" : "outline"}
                size="sm"
                onClick={() => onVocalGenderChange(v)}
                className="text-xs h-9 rounded-lg"
              >
                {label}
              </Button>
            ))}
          </div>
        </section>

        {/* Group: Sliders */}
        <section className="space-y-3.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            Параметры генерации
          </Label>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-foreground/80">Влияние стиля</Label>
              <span className="text-xs font-semibold tabular-nums text-foreground">
                {Math.round(styleWeight[0] * 100)}%
              </span>
            </div>
            <Slider
              value={styleWeight}
              onValueChange={onStyleWeightChange}
              min={0}
              max={1}
              step={0.05}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-foreground/80">Креативность</Label>
              <span className="text-xs font-semibold tabular-nums text-foreground">
                {Math.round(weirdnessConstraint[0] * 100)}%
              </span>
            </div>
            <Slider
              value={weirdnessConstraint}
              onValueChange={onWeirdnessConstraintChange}
              min={0}
              max={1}
              step={0.05}
            />
          </div>

          {(hasReferenceAudio || hasPersona) && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-foreground/80">
                  {getAudioWeightLabel(hasReferenceAudio, hasPersona)}
                </Label>
                <span className="text-xs font-semibold tabular-nums text-foreground">
                  {Math.round(audioWeight[0] * 100)}%
                </span>
              </div>
              <Slider
                value={audioWeight}
                onValueChange={onAudioWeightChange}
                min={0}
                max={1}
                step={0.05}
              />
              <p className="text-[11px] text-muted-foreground leading-snug">
                {getAudioWeightDescription(hasReferenceAudio, hasPersona)}
              </p>
            </div>
          )}
        </section>

        {/* Group: Exclusions */}
        <section className="space-y-1.5">
          <Label
            htmlFor="negative-tags"
            className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold"
          >
            Исключить
          </Label>
          <Input
            id="negative-tags"
            placeholder="Напр.: piano, drums"
            value={negativeTags}
            onChange={(e) => onNegativeTagsChange(e.target.value)}
            className="h-10 text-sm rounded-lg bg-background/60"
          />
        </section>
      </CollapsibleContent>
    </Collapsible>
  );
}
