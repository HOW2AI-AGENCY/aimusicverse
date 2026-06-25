/**
 * ValidationMessage - Inline validation message component
 * Provides WCAG AA compliant error/warning messages with proper contrast
 *
 * Phase 3.2: Enhanced error messages with actionable suggestions
 */

import { memo, useState } from "react";
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, Lightbulb } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { checkForBlockedArtists } from "@/lib/errorHandling";
import { Button } from "@/components/ui/button";

export type ValidationLevel = "error" | "warning" | "info";

interface ValidationMessageProps {
  message: string;
  level?: ValidationLevel;
  fieldId?: string;
  className?: string;
  /** Optional suggestion text */
  suggestion?: string;
  /** Optional examples to show */
  examples?: string[];
}

const levelConfig: Record<
  ValidationLevel,
  {
    icon: typeof AlertCircle;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  error: {
    icon: AlertCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/20",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-yellow-600 dark:text-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-800/50",
  },
  info: {
    icon: Info,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800/50",
  },
};

export const ValidationMessage = memo(function ValidationMessage({
  message,
  level = "error",
  fieldId,
  className,
  suggestion,
  examples,
}: ValidationMessageProps) {
  const config = levelConfig[level];
  const Icon = config.icon;
  const [showExamples, setShowExamples] = useState(false);
  const hasExtras = suggestion || (examples && examples.length > 0);

  return (
    <div
      id={fieldId ? `${fieldId}-error` : undefined}
      role="alert"
      aria-live="polite"
      className={cn("rounded-lg border text-xs overflow-hidden", config.bgColor, config.borderColor, className)}
    >
      <div className={cn("flex items-start gap-2 p-2.5", config.color)}>
        <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <span className="leading-tight block">{message}</span>

          {/* Inline suggestion */}
          {suggestion && (
            <div className="flex items-start gap-1.5 mt-1.5 text-muted-foreground">
              <Lightbulb className="w-3 h-3 flex-shrink-0 mt-0.5 text-amber-500" />
              <span className="text-[11px] leading-tight">{suggestion}</span>
            </div>
          )}
        </div>

        {/* Expand button for examples */}
        {examples && examples.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowExamples(!showExamples)}
            className="h-5 px-1.5 text-[10px] gap-0.5"
          >
            Примеры
            {showExamples ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        )}
      </div>

      {/* Expandable examples section */}
      {showExamples && examples && examples.length > 0 && (
        <div className="px-2.5 pb-2.5 pt-0 border-t border-border/20">
          <p className="text-[10px] text-muted-foreground mb-1.5">Попробуйте вместо этого:</p>
          <div className="flex flex-wrap gap-1">
            {examples.map((example, idx) => (
              <span
                key={idx}
                className="inline-block px-2 py-0.5 bg-background/80 rounded text-[10px] text-foreground/80"
              >
                {example}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * Validation rules for generate form fields
 */
/**
 * Check for blocked artist names in text
 * Returns validation result if artist found with helpful suggestions
 */
export function checkArtistValidation(text: string): {
  message: string;
  level: ValidationLevel;
  suggestion?: string;
  examples?: string[];
} | null {
  if (!text) return null;

  const blockedArtist = checkForBlockedArtists(text);
  if (blockedArtist) {
    // Get style suggestions based on common artists
    const styleSuggestions = getStyleSuggestionsForArtist(blockedArtist);

    return {
      message: `Нельзя использовать имя "${blockedArtist}". Опишите стиль без упоминания артистов.`,
      level: "error",
      suggestion: "Опишите жанр, настроение и инструменты вместо имени артиста",
      examples: styleSuggestions,
    };
  }

  return null;
}

/**
 * Get style suggestions based on blocked artist
 * Maps common artists to style descriptions
 */
function getStyleSuggestionsForArtist(artist: string): string[] {
  const lower = artist.toLowerCase();

  // Mapping of artists to style suggestions
  const artistStyles: Record<string, string[]> = {
    // Russian hip-hop / rap
    morgenshtern: ["энергичный русский рэп", "трэп с басами", "party rap"],
    oxxxymiron: ["интеллектуальный рэп", "лирический хип-хоп", "storytelling rap"],
    face: ["агрессивный русский рэп", "hard trap", "street rap"],
    скриптонит: ["dark atmospheric rap", "экспериментальный хип-хоп"],
    баста: ["мелодичный русский рэп", "хип-хоп с душой"],
    instasamka: ["женский рэп", "pop-rap", "party music"],

    // Rock / Metal
    rammstein: ["industrial metal", "немецкий индастриал-рок"],
    metallica: ["thrash metal", "heavy metal"],
    "linkin park": ["nu-metal", "alternative rock"],
    "bad omens": ["metalcore", "post-hardcore"],

    // Pop
    дора: ["инди-поп", "мечтательный поп"],
    "anna asti": ["русский поп", "dance pop"],
    zivert: ["электро-поп", "современный поп"],

    // Default suggestions
    default: ["мелодичный", "энергичный", "атмосферный"],
  };

  // Find matching suggestions
  for (const [key, suggestions] of Object.entries(artistStyles)) {
    if (lower.includes(key)) {
      return suggestions;
    }
  }

  return artistStyles["default"];
}

export const validation = {
  description: {
    minLength: 10,
    maxLength: 500,
    getMessage: (
      length: number,
      text?: string,
    ): { message: string; level: ValidationLevel; suggestion?: string } | null => {
      // First check for blocked artists (priority error)
      if (text) {
        const artistCheck = checkArtistValidation(text);
        if (artistCheck) return artistCheck;
      }

      if (length === 0) {
        return null; // Empty is allowed
      }
      if (length < validation.description.minLength) {
        return {
          message: `Минимум ${validation.description.minLength} символов для точной генерации`,
          level: "warning",
        };
      }
      if (length > validation.description.maxLength) {
        return {
          message: "Превышен лимит символов. Сократите описание или переключитесь в Полный режим",
          level: "error",
        };
      }
      if (length > validation.description.maxLength * 0.9) {
        return {
          message: `Осталось ${validation.description.maxLength - length} символов`,
          level: "warning",
        };
      }
      return null;
    },
  },

  title: {
    maxLength: 80,
    getMessage: (length: number): { message: string; level: ValidationLevel } | null => {
      if (length > validation.title.maxLength) {
        return {
          message: `Название слишком длинное (максимум ${validation.title.maxLength} символов)`,
          level: "error",
        };
      }
      if (length > validation.title.maxLength * 0.9) {
        return {
          message: `Осталось ${validation.title.maxLength - length} символов`,
          level: "info",
        };
      }
      return null;
    },
  },

  style: {
    minLength: 10,
    maxLength: 500,
    getMessage: (
      length: number,
      text?: string,
    ): { message: string; level: ValidationLevel; suggestion?: string } | null => {
      // First check for blocked artists (priority error)
      if (text) {
        const artistCheck = checkArtistValidation(text);
        if (artistCheck) return artistCheck;
      }

      if (length === 0) {
        return null; // Empty is allowed
      }
      if (length < validation.style.minLength) {
        return {
          message: `Минимум ${validation.style.minLength} символов для точной генерации стиля`,
          level: "warning",
        };
      }
      if (length > validation.style.maxLength) {
        return {
          message: "Превышен лимит символов. Сократите описание стиля",
          level: "error",
        };
      }
      if (length > validation.style.maxLength * 0.9) {
        return {
          message: `Осталось ${validation.style.maxLength - length} символов`,
          level: "warning",
        };
      }
      return null;
    },
  },

  lyrics: {
    minLength: 20,
    maxLength: 3000,
    getMessage: (length: number, hasVocals: boolean): { message: string; level: ValidationLevel } | null => {
      if (!hasVocals) {
        return null; // Lyrics not needed for instrumental
      }
      if (length === 0) {
        return {
          message: "Для вокального трека требуется текст песни",
          level: "warning",
        };
      }
      if (length < validation.lyrics.minLength) {
        return {
          message: `Минимум ${validation.lyrics.minLength} символов для полноценной песни`,
          level: "warning",
        };
      }
      if (length > validation.lyrics.maxLength) {
        return {
          message: "Превышен лимит символов. Сократите текст песни",
          level: "error",
        };
      }
      if (length > validation.lyrics.maxLength * 0.9) {
        return {
          message: `Осталось ${validation.lyrics.maxLength - length} символов`,
          level: "info",
        };
      }
      return null;
    },
  },
};
