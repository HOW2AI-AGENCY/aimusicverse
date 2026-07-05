// src/components/generate-sheet/GenerateSheetFooter.tsx
import { useState } from "react";
import { Sparkles, Loader2, Coins } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Props {
  loading: boolean;
  canGenerate: boolean;
  hasWarnings: boolean;
  warningCount: number;
  hasUnsavedData: boolean;
  generationCost: number;
  generationCostBreakdown: { label: string; value: number }[];
  onGenerate: () => void;
  onSaveDraft: () => void;
  onShowReasons: () => void;
  shouldShowUIButton: boolean;
  shouldShowSecondaryUIButton: boolean;
  isKeyboardOpen: boolean;
  keyboardHeight: number;
}

export function GenerateSheetFooter(props: Props) {
  const paddingBottom = props.isKeyboardOpen
    ? `${props.keyboardHeight + 16}px`
    : "max(1rem, var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))";

  return (
    <div
      className="px-4 pt-3 border-t border-border/40 bg-background/95 backdrop-blur-xl"
      style={{ paddingBottom, transition: "padding-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
    >
      <div className="flex gap-2">
        {props.shouldShowSecondaryUIButton && (
          <Button
            onClick={props.onSaveDraft}
            variant="outline"
            disabled={props.loading || !props.hasUnsavedData}
            className="flex-1 h-14 text-sm font-semibold rounded-2xl border-border/60"
          >
            Черновик
          </Button>
        )}
        {props.shouldShowUIButton && (
          <Button
            onClick={props.canGenerate ? props.onGenerate : props.onShowReasons}
            disabled={props.loading}
            className={cn(
              "h-14 text-sm font-bold gap-2 rounded-2xl flex items-center justify-center leading-none transition-all active:scale-[0.98]",
              "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground",
              "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.12)]",
              props.shouldShowSecondaryUIButton ? "flex-1" : "w-full",
              !props.canGenerate && !props.loading && "opacity-50",
            )}
          >
            {props.loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Создание…
              </span>
            ) : (
              <span className="flex flex-col items-center gap-0.5">
                <span className="flex items-center gap-2 text-[15px]">
                  <Sparkles className="w-4 h-4" />
                  Сгенерировать
                  {props.hasWarnings && (
                    <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[10px] bg-yellow-500 text-yellow-950">
                      {props.warningCount}
                    </span>
                  )}
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="text-[10px] font-medium tabular-nums text-primary-foreground/75 hover:text-primary-foreground flex items-center gap-1"
                    >
                      <Coins className="w-3 h-3" />
                      {props.generationCost} кредитов
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top" className="w-56 text-xs space-y-1">
                    <p className="font-semibold mb-1 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5" />
                      {props.generationCost} кредитов
                    </p>
                    {props.generationCostBreakdown.map((row, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="tabular-nums">+{row.value}</span>
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
