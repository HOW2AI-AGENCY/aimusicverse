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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentText: string;
  onApply: (text: string, targetSectionId?: string) => void;
}

export function LyricsAssistantSheet({ open, onOpenChange, currentText, onApply }: Props) {
  const [previewCollapsed, setPreviewCollapsed] = useState(false);

  // Lock body scroll while lyrics assistant sheet is open
  useScrollLock(open);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[80]" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[81] bg-background rounded-t-2xl p-4 pb-safe max-h-[85dvh] flex flex-col">
          <Drawer.Handle className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/30 mb-3" />

          <div className="flex items-center justify-between mb-3">
            <Drawer.Title className="text-base font-semibold">🤖 AI-помощник</Drawer.Title>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Готово
            </Button>
          </div>

          {!previewCollapsed && currentText && (
            <div className="rounded-xl border bg-muted/30 p-3 mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-muted-foreground">Ваш текущий текст</span>
                <button
                  type="button"
                  aria-label="скрыть превью"
                  onClick={() => setPreviewCollapsed(true)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
              <pre className={cn("text-xs whitespace-pre-wrap font-sans", "max-h-24 overflow-y-auto")}>
                {currentText}
              </pre>
            </div>
          )}

          {previewCollapsed && currentText && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewCollapsed(false)}
              className="mb-3 self-start min-h-[44px]"
            >
              <ChevronDown className="w-4 h-4 mr-1" /> Показать превью
            </Button>
          )}

          <div className="flex-1 overflow-hidden">
            <LyricsAssistantChat onApply={onApply} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
