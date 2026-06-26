/**
 * CollapsibleFormHeader - Symmetric header for GenerateSheet
 * Two-row layout: title + balance pill on top, full-width segmented mode switcher below.
 * Matches the "Symmetric structured panel" design direction.
 */

import { memo, useMemo } from "react";
import { Zap, Settings2, History, X, ChevronDown } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SUNO_MODELS, getAvailableModels } from "@/constants/sunoModels";

export type GenerationMode = "simple" | "custom";

interface CollapsibleFormHeaderProps {
  balance?: number;
  cost?: number;
  mode: GenerationMode;
  onModeChange?: (mode: GenerationMode) => void;
  onOpenHistory?: () => void;
  model?: string;
  onModelChange?: (model: string) => void;
  onClose?: () => void;
}

interface ModeConfig {
  icon: typeof Zap;
  label: string;
  description: string;
}

const MODE_CONFIG: Record<GenerationMode, ModeConfig> = {
  simple: { icon: Zap, label: "Быстро", description: "Простое описание" },
  custom: { icon: Settings2, label: "Полный", description: "Все настройки" },
};

const MODE_KEYS: GenerationMode[] = ["simple", "custom"];

export const CollapsibleFormHeader = memo(function CollapsibleFormHeader({
  balance = 0,
  cost = 12,
  mode,
  onModeChange,
  onOpenHistory,
  model = "V4_5ALL",
  onModelChange,
  onClose,
}: CollapsibleFormHeaderProps) {
  const availableModels = useMemo(() => getAvailableModels(), []);
  const currentModel = SUNO_MODELS[model] || SUNO_MODELS.V4_5ALL;
  const lowBalance = balance < cost;

  return (
    <div className="space-y-3 py-2">
      {/* Row 1: Title block + balance pill + close */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold tracking-tight text-foreground truncate">Создание трека</h2>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70 mt-0.5">
            MusicVerse Studio
          </p>
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border tabular-nums",
            lowBalance
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-primary/10 border-primary/20 text-primary",
          )}
          aria-label={`Баланс ${balance} из ${cost} кредитов`}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full animate-pulse",
              lowBalance ? "bg-destructive shadow-[0_0_8px_hsl(var(--destructive))]" : "bg-primary shadow-[0_0_8px_hsl(var(--primary))]",
            )}
            aria-hidden
          />
          <span className="text-xs font-semibold leading-none">{balance}</span>
          <span className="text-[10px] leading-none opacity-60">/ {cost}</span>
        </div>

        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-muted flex-shrink-0"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Row 2: Mode segmented + model + history */}
      <div className="flex items-center gap-2">
        {/* Full-width segmented mode switcher */}
        <div
          className="relative grid grid-cols-2 flex-1 p-1 rounded-2xl bg-muted/40 border border-border/50"
          role="group"
          aria-label="Режим генерации"
        >
          {MODE_KEYS.map((modeKey) => {
            const config = MODE_CONFIG[modeKey];
            const Icon = config.icon;
            const isActive = mode === modeKey;
            return (
              <button
                key={modeKey}
                type="button"
                onClick={() => onModeChange?.(modeKey)}
                aria-pressed={isActive}
                className={cn(
                  "flex items-center justify-center gap-1.5 min-h-[36px] rounded-xl text-xs font-semibold transition-all duration-200",
                  isActive
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive && "text-primary")} aria-hidden="true" />
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Model selector */}
        {onModelChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 min-h-[36px] px-2.5 rounded-xl bg-muted/40 border border-border/50 hover:bg-muted transition-all"
                aria-label={`Модель ${currentModel.name}`}
              >
                <span className="text-sm leading-none">{currentModel.emoji}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px] bg-popover">
              {availableModels.map((m) => (
                <DropdownMenuItem
                  key={m.key}
                  onClick={() => onModelChange(m.key)}
                  className={cn("flex items-center gap-2 text-xs", model === m.key && "bg-primary/10")}
                >
                  <span>{m.emoji}</span>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-xs">{m.name}</span>
                    <span className="text-[9px] text-muted-foreground">{m.cost}💎</span>
                  </div>
                  {m.status === "latest" && (
                    <span className="text-[8px] px-1 py-0.5 rounded bg-primary/20 text-primary font-medium">NEW</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* History */}
        {onOpenHistory && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl bg-muted/40 border border-border/50 hover:bg-muted flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onOpenHistory();
            }}
            aria-label="История промптов"
          >
            <History className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
});
