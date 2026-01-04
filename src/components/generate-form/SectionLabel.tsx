/**
 * SectionLabel - Unified label component with optional help tooltip
 * Provides consistent styling and help icons across all form sections
 */

import { memo, ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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
      {icon && (
        <span className="text-muted-foreground">{icon}</span>
      )}
      <Label 
        htmlFor={htmlFor} 
        className="text-xs font-medium text-foreground/90"
      >
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {suffix && (
        <span className="text-[10px] text-muted-foreground">{suffix}</span>
      )}
      {hint && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                type="button" 
                className="text-muted-foreground/60 hover:text-muted-foreground transition-colors focus:outline-none"
                aria-label="Показать подсказку"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className="max-w-[250px] text-xs leading-relaxed"
            >
              {hint}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
});

// Predefined hints for form sections
export const SECTION_HINTS = {
  trackType: 'Вокал — AI сгенерирует голос и текст. Инструментал — только музыка без вокала.',
  title: 'Оставьте пустым для автогенерации названия на основе стиля',
  style: 'Используйте теги на английском: indie rock, 120 bpm, male vocals',
  description: 'Опишите жанр, настроение и инструменты. Можно на русском или английском.',
  lyrics: 'Используйте [Verse], [Chorus], [Bridge] для структуры песни',
  privacy: 'Приватные треки видны только вам. Публичные — в ленте сообщества.',
};
