/**
 * CollapsibleFormHeader v2 — Neon Studio cohesive with the redesigned footer.
 * - Row 1: title + status pill (balance) + close.
 * - Row 2: full-width segmented mode switch (radiogroup semantics) + compact model + history.
 * - Mint (#22E4A7) accent on active states + primary focus rings for keyboard users.
 */

import { memo, useMemo, useRef, useCallback, KeyboardEvent } from "react";
import { Zap, Settings2, History, ChevronDown, X } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SUNO_MODELS, getAvailableModels } from "@/constants/sunoModels";
import { getModelDisplayInfo } from "@/components/library/ModelBadge";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

export type GenerationMode = "simple" | "custom";

interface CollapsibleFormHeaderProps {
  balance?: number | null;
  cost?: number;
  mode: GenerationMode;
  onModeChange?: (mode: GenerationMode) => void;
  onOpenHistory?: () => void;
  model?: string;
  onModelChange?: (model: string) => void;
  onClose?: () => void;
}

const MODE_CONFIG = {
  simple: { icon: Zap, label: "Быстро", desc: "Простое описание" },
  custom: { icon: Settings2, label: "Полный", desc: "Все настройки" },
} as const;

const MODE_KEYS: GenerationMode[] = ["simple", "custom"];

export const CollapsibleFormHeader = memo(function CollapsibleFormHeader({
  balance,
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
  const lowBalance = balance != null && balance < cost;
  const haptic = useHapticFeedback();
  const modeRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const onModeKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const next = (idx + (e.key === "ArrowRight" ? 1 : -1) + MODE_KEYS.length) % MODE_KEYS.length;
        modeRefs.current[next]?.focus();
        if (mode !== MODE_KEYS[next]) {
          haptic.selectionChanged();
          onModeChange?.(MODE_KEYS[next]);
        }
      }
    },
    [mode, onModeChange, haptic],
  );

  const balanceLabel =
    balance == null
      ? "Баланс кредитов загружается"
      : lowBalance
        ? `Недостаточно кредитов: ${Math.floor(balance)} из ${cost}`
        : `Баланс ${Math.floor(balance)} кредитов, стоимость ${cost}`;

  return (
    <div className="space-y-3 py-2">
      {/* Row 1 */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2
            id="generate-sheet-title"
            className="text-base font-bold tracking-tight text-foreground truncate"
            style={{ fontFamily: '"Bricolage Grotesque", var(--font-display, inherit)' }}
          >
            Создание трека
          </h2>
          <p className="text-[10px] font-medium text-muted-foreground/80 mt-0.5 uppercase tracking-wider">
            MusicVerse Studio
          </p>
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border tabular-nums",
            balance == null
              ? "bg-muted/40 border-border/50 text-muted-foreground"
              : lowBalance
                ? "bg-destructive/10 border-destructive/30 text-destructive"
                : "bg-neon/10 border-neon/30 text-neon",
          )}
          role="status"
          aria-live="polite"
          aria-label={balanceLabel}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              balance == null
                ? "bg-muted-foreground"
                : lowBalance
                  ? "bg-destructive shadow-[0_0_8px_hsl(var(--destructive))]"
                  : "bg-neon shadow-[0_0_8px_hsl(var(--neon))]",
            )}
            aria-hidden
          />
          <span className="text-xs font-semibold leading-none tabular-nums">
            {balance == null ? "…" : Math.floor(balance)}
          </span>
          <span className="text-[10px] leading-none opacity-70 tabular-nums">/ {cost}</span>
        </div>

        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full hover:bg-muted flex-shrink-0 focus-visible:ring-2 focus-visible:ring-primary/60"
            onClick={onClose}
            aria-label="Закрыть форму генерации"
          >
            <X className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* Row 2 */}
      <div className="flex items-center gap-2">
        {/* Segmented mode switch — radiogroup with roving tabindex */}
        <div
          className="relative grid grid-cols-2 flex-1 p-1 rounded-2xl bg-muted/40 border border-border/50 overflow-hidden"
          role="radiogroup"
          aria-label="Режим генерации"
        >
          {MODE_KEYS.map((modeKey, idx) => {
            const config = MODE_CONFIG[modeKey];
            const Icon = config.icon;
            const isActive = mode === modeKey;
            return (
              <button
                key={modeKey}
                ref={(el) => {
                  modeRefs.current[idx] = el;
                }}
                type="button"
                role="radio"
                aria-checked={isActive}
                tabIndex={isActive ? 0 : -1}
                onKeyDown={(e) => onModeKeyDown(e, idx)}
                onClick={() => {
                  if (mode !== modeKey) haptic.selectionChanged();
                  onModeChange?.(modeKey);
                }}
                aria-label={`${config.label} — ${config.desc}`}
                className={cn(
                  "flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl text-xs font-semibold transition-all duration-200 relative",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                  isActive
                    ? "bg-background text-foreground shadow-sm ring-1 ring-neon/40 after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-8 after:h-0.5 after:rounded-full after:bg-neon"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive && "text-neon")} aria-hidden="true" />
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
                className="flex items-center gap-1 min-h-[44px] min-w-[44px] px-2.5 rounded-xl bg-muted/40 border border-border/50 hover:bg-muted transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                aria-label={`Модель генерации: ${currentModel.name}. Открыть список моделей`}
              >
                {(() => {
                  const info = getModelDisplayInfo(currentModel.apiModel ?? model);
                  const Icon = info?.icon;
                  return Icon ? (
                    <Icon className={cn("w-3.5 h-3.5", info?.color)} aria-hidden="true" />
                  ) : (
                    <span className="text-[10px] font-semibold">{currentModel.name}</span>
                  );
                })()}
                <ChevronDown className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[200px] bg-popover">
              {availableModels.map((m) => {
                const info = getModelDisplayInfo(m.apiModel ?? m.key);
                const Icon = info?.icon;
                return (
                  <DropdownMenuItem
                    key={m.key}
                    onClick={() => onModelChange(m.key)}
                    className={cn("flex items-center gap-2 text-xs", model === m.key && "bg-neon/10")}
                    aria-current={model === m.key ? "true" : undefined}
                  >
                    {Icon ? <Icon className={cn("w-3.5 h-3.5", info?.color)} aria-hidden="true" /> : null}
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium text-xs">{m.name}</span>
                      <span className="text-[9px] text-muted-foreground">{m.cost} кр.</span>
                    </div>
                    {m.status === "latest" && (
                      <span className="text-[8px] px-1 py-0.5 rounded bg-neon/20 text-neon font-semibold">NEW</span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* History */}
        {onOpenHistory && (
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl bg-muted/40 border border-border/50 hover:bg-muted flex-shrink-0 focus-visible:ring-2 focus-visible:ring-primary/60"
            onClick={(e) => {
              e.stopPropagation();
              onOpenHistory();
            }}
            aria-label="Открыть историю промптов"
          >
            <History className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
});
