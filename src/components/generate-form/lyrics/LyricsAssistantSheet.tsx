/**
 * LyricsAssistantSheet
 *
 * Sprint 056 — Task 7. Vaul-based bottom sheet that replaces the
 * Dialog-based `LyricsChatAssistant.tsx`. Shows a collapsible preview
 * row of the user's current lyrics text plus an inline chat body
 * (`LyricsAssistantChat`). Tapping "Готово" closes the sheet via
 * `onOpenChange(false)`. a11y: Drawer.Title, aria-label on toggle,
 * 44px touch targets on the collapse button.
 */
import { useState } from "react";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { LyricsAssistantChat } from "./LyricsAssistantChat";
import { useScrollLock } from "@/hooks/useScrollLock";
import type { useLyricsAssistant } from "@/hooks/lyrics/useLyricsAssistant";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentText: string;
  genre?: string;
  mood?: string[];
  language?: string;
  projectContext?: Parameters<typeof useLyricsAssistant>[0]["projectContext"];
  trackContext?: Parameters<typeof useLyricsAssistant>[0]["trackContext"];
  onApply: (text: string, targetSectionId?: string) => void;
  onApplyTitle?: (title: string) => void;
  onApplyStyle?: (style: string) => void;
}

export function LyricsAssistantSheet({
  open,
  onOpenChange,
  currentText,
  genre,
  mood,
  language,
  projectContext,
  trackContext,
  onApply,
  onApplyTitle,
  onApplyStyle,
}: Props) {
  const [previewCollapsed, setPreviewCollapsed] = useState(false);

  // Lock body scroll while lyrics assistant sheet is open
  useScrollLock(open);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[80]" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-[81] bg-background rounded-t-2xl p-4 pb-safe flex flex-col"
          style={{ maxHeight: "calc(85dvh - var(--keyboard-h, 0px))" }}
        >
          <Drawer.Handle className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/30 mb-3" />

          <div className="flex items-center justify-between gap-2 mb-3">
            <Drawer.Title className="flex min-w-0 items-center gap-2 text-base font-semibold">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </span>
              <span className="truncate">ИИ-агент лирики</span>
            </Drawer.Title>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="shrink-0">
              Готово
            </Button>
          </div>

          {currentText && (
            <div className="rounded-xl border bg-muted/30 mb-3">
              <button
                type="button"
                aria-label={previewCollapsed ? "показать превью" : "скрыть превью"}
                aria-expanded={!previewCollapsed}
                onClick={() => setPreviewCollapsed((v) => !v)}
                className="flex min-h-[44px] w-full items-center justify-between gap-2 px-3"
              >
                <span className="truncate text-xs font-semibold text-muted-foreground">
                  Ваш текущий текст · {currentText.length} симв.
                </span>
                {previewCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
              {!previewCollapsed && (
                <pre className={cn("px-3 pb-3 text-xs whitespace-pre-wrap font-sans", "max-h-24 overflow-y-auto")}>
                  {currentText}
                </pre>
              )}
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <LyricsAssistantChat
              currentLyrics={currentText}
              genre={genre}
              mood={mood}
              language={language}
              projectContext={projectContext}
              trackContext={trackContext}
              onApply={onApply}
              onApplyTitle={onApplyTitle}
              onApplyStyle={onApplyStyle}
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
