/**
 * FormSettingCard - Standardized container for individual form settings.
 * Renders a bordered card with label + optional info tooltip + children.
 * Used inside AdvancedSettings and other multi-control blocks.
 */
import { type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info } from "@/lib/icons";

interface FormSettingCardProps {
  label: string;
  info?: string;
  children: ReactNode;
  /** Optional aria label for the info button */
  infoLabel?: string;
}

export function FormSettingCard({ label, info, children, infoLabel = "Подробнее" }: FormSettingCardProps) {
  return (
    <div className="rounded-xl border bg-card/40 p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium shrink-0">{label}</Label>
        {info && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={infoLabel}
                className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground rounded"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              sideOffset={4}
              collisionPadding={8}
              className="w-56 max-w-[calc(100vw-2rem)] text-xs leading-relaxed"
            >
              {info}
            </PopoverContent>
          </Popover>
        )}
      </div>
      {children}
    </div>
  );
}

/**
 * FormSliderRow - Standardized slider with label, percentage display, and tooltip.
 */

interface FormSliderRowProps {
  /** English label visible to the user */
  label: string;
  value: number[];
  onValueChange: (v: number[]) => void;
  /** Tooltip text explaining the slider. Omit to hide the info icon. */
  info?: string;
  /** Min (default: 0) */
  min?: number;
  /** Max (default: 1) */
  max?: number;
  /** Step (default: 0.05) */
  step?: number;
  /** Value display formatter. Default: `${Math.round(v*100)}%` */
  formatValue?: (v: number) => string;
}

export function FormSliderRow({
  label,
  value,
  onValueChange,
  info,
  min = 0,
  max = 1,
  step = 0.05,
  formatValue = (v) => `${Math.round(v * 100)}%`,
}: FormSliderRowProps) {
  return (
    <FormSettingCard label={label} info={info}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tabular-nums text-muted-foreground/70">{formatValue(value[0])}</span>
      </div>
      <Slider value={value} onValueChange={onValueChange} min={min} max={max} step={step} />
    </FormSettingCard>
  );
}

export { GenerateModal } from "./GenerateModal";
export type { GenerateModalProps, GenerateModalStep } from "./GenerateModal";
