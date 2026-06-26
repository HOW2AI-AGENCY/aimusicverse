/**
 * SectionLabel - Unified label component with optional help popover
 * Provides consistent styling and help icons across all form sections
 * Uses Popover instead of Tooltip for mobile compatibility
 */

import { memo, ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { HelpCircle } from "@/lib/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SectionLabelProps {
  /** Label text */
  label: string;
  /** Help tooltip text */
  hint?: string;
  /** Show required asterisk */
  required?: boolean;
  /** Optional text after label (e.g. "(опционально)") */
  suffix?: string;
  /** HTML for attribute */
  htmlFor?: string;
  /** Additional className */
  className?: string;
  /** Icon to show before label */
  icon?: ReactNode;
}

export const SectionLabel = memo(function SectionLabel({
  label,
  hint,
  required = false,
  suffix,
  htmlFor,
  className,
  icon,
}: SectionLabelProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <Label htmlFor={htmlFor} className="text-xs font-medium text-foreground/90">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {suffix && <span className="text-[10px] text-muted-foreground">{suffix}</span>}
      {hint && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center h-11 w-11 -my-2 -mx-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-full"
              aria-label="Показать подсказку"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="max-w-[240px] text-xs p-3 leading-relaxed">
            {hint}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
});

// Predefined hints for form sections
export const SECTION_HINTS = {
  trackType: "Вокал — AI сгенерирует голос и текст. Инструментал — только музыка без вокала.",
  title: "Оставьте пустым для автогенерации названия на основе стиля",
  style: "Используйте теги на английском: indie rock, 120 bpm, male vocals",
  description: "Опишите жанр, настроение и инструменты. Можно на русском или английском.",
  lyrics: "Используйте [Verse], [Chorus], [Bridge] для структуры песни",
  privacy: "Приватные треки видны только вам. Публичные — в ленте сообщества.",
};
