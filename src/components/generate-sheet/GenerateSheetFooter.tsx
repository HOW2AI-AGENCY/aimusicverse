// src/components/generate-sheet/GenerateSheetFooter.tsx
import { useState, useEffect, useRef } from "react";
import { Sparkles, Loader2, Coins, Info, Check } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  loading: boolean;
  canGenerate: boolean;
  hasWarnings: boolean;
  warningCount: number;
  hasUnsavedData: boolean;
  generationCost: number;
  onGenerate: () => void;
  onSaveDraft: () => void;
  onShowReasons: () => void;
  shouldShowUIButton: boolean;
  shouldShowSecondaryUIButton: boolean;
  isKeyboardOpen: boolean;
  keyboardHeight: number;
  /** Sprint 055-B2: summary line e.g. "Vocal · 60-90s · 8 credits" */
  summary?: string;
}

export function GenerateSheetFooter(props: Props) {
  const paddingBottom = props.isKeyboardOpen
    ? `${props.keyboardHeight + 16}px`
    : "max(1rem, var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))";

  // Sprint P2.2: brief "saved" indicator when draft auto-saves
  const [showSaved, setShowSaved] = useState(false);
  const prevUnsavedRef = useRef(props.hasUnsavedData);

  useEffect(() => {
    // Transition from unsaved → saved: show indicator briefly
    if (prevUnsavedRef.current && !props.hasUnsavedData) {
      setShowSaved(true);
      const t = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(t);
    }
    // Transition from saved → unsaved: hide indicator
    if (!prevUnsavedRef.current && props.hasUnsavedData) {
      setShowSaved(false);
    }
    prevUnsavedRef.current = props.hasUnsavedData;
  }, [props.hasUnsavedData]);

  return (
    <div
      className="px-4 pt-2.5 border-t border-border/10 bg-sheet/85 backdrop-blur-xl"
      style={{ paddingBottom, transition: "padding-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
    >
      {/* Status strip: saved indicator or warning link. Cost lives in the CTA badge. */}
      {props.shouldShowUIButton && (showSaved || props.hasWarnings) && (
        <div className="mb-1.5 flex items-center justify-between px-1 min-h-[16px]">
          {showSaved ? (
            <span className="text-[11px] text-neon/80 flex items-center gap-1">
              <Check className="w-3 h-3" aria-hidden /> Черновик сохранён
            </span>
          ) : (
            <span />
          )}
          {props.hasWarnings && (
            <button
              type="button"
              onClick={props.onShowReasons}
              className="text-[11px] font-semibold text-amber-400 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 rounded"
            >
              {props.warningCount} {props.warningCount === 1 ? "замечание" : "замечаний"}
            </button>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {props.shouldShowSecondaryUIButton && (
          <Button
            onClick={props.onSaveDraft}
            variant="outline"
            disabled={props.loading || !props.hasUnsavedData}
            className="h-12 px-4 text-sm font-semibold rounded-2xl border-border/10 bg-sheet-card text-foreground hover:bg-sheet-card/80"
          >
            Черновик
          </Button>
        )}
        {props.shouldShowUIButton && (
          <Button
            onClick={props.canGenerate ? props.onGenerate : props.onShowReasons}
            disabled={props.loading}
            aria-label={
              props.loading
                ? "Идёт создание трека"
                : props.canGenerate
                  ? `Сгенерировать трек за ${props.generationCost} кредитов`
                  : "Открыть причины, почему нельзя сгенерировать"
            }
            className={cn(
              "h-12 text-[15px] font-bold gap-2 rounded-2xl flex-1 flex items-center justify-center leading-none transition-all active:scale-[0.98]",
              "bg-neon text-sheet hover:bg-neon/90",
              "shadow-[0_8px_24px_hsl(var(--neon)/0.28)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/60",
              !props.canGenerate && !props.loading && "bg-muted text-muted-foreground shadow-none",
            )}
          >
            {props.loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                Создание…
              </span>
            ) : props.canGenerate ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" aria-hidden />
                Сгенерировать
                <span className="inline-flex items-center gap-1 rounded-md bg-sheet/15 px-2 py-0.5 text-[11px] font-extrabold tabular-nums">
                  <Coins className="w-3 h-3" aria-hidden />
                  {props.generationCost}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4" aria-hidden />
                Почему нельзя?
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

