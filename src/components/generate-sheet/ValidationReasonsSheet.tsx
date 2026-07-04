/**
 * ValidationReasonsSheet
 *
 * Sprint 056 — Task 3. Bottom-sheet (vaul Drawer) that lists all
 * validation reasons produced by `useGenerateSheetValidation`. Pure
 * presentation: receives reasons + open state via props; the caller
 * owns the hook so this component stays decoupled from the composer.
 *
 * a11y: Vaul Drawer handles focus trap + Escape close + role="dialog".
 * Severity icons are marked `aria-hidden` because the Russian text
 * carries the semantic meaning for screen readers.
 */
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import type { ValidationReason } from "@/hooks/generation/useGenerateSheetValidation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reasons: ValidationReason[];
}

export function ValidationReasonsSheet({ open, onOpenChange, reasons }: Props) {
  const errors = reasons.filter((r) => r.severity === "error");
  const warnings = reasons.filter((r) => r.severity === "warning");

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[80]" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[81] bg-background rounded-t-2xl p-4 pb-safe max-h-[80dvh] flex flex-col">
          <Drawer.Handle className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/30 mb-3" />
          <Drawer.Title className="text-base font-semibold mb-3">
            {reasons.length === 0 ? "Всё готово к генерации" : "Чтобы сгенерировать трек"}
          </Drawer.Title>

          <div className="flex-1 overflow-y-auto space-y-2">
            {errors.map((r, i) => (
              <ReasonRow key={`e-${i}`} reason={r} tone="error" />
            ))}
            {warnings.map((r, i) => (
              <ReasonRow key={`w-${i}`} reason={r} tone="warning" />
            ))}
          </div>

          <Button variant="outline" onClick={() => onOpenChange(false)} className="mt-3 h-11 w-full">
            Закрыть
          </Button>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function ReasonRow({ reason, tone }: { reason: ValidationReason; tone: "error" | "warning" }) {
  const icon = tone === "error" ? "❌" : "⚠️";
  const cls = tone === "error" ? "border-destructive/40 bg-destructive/5" : "border-yellow-500/30 bg-yellow-500/5";

  return (
    <div className={cn("rounded-xl border p-3 space-y-1", cls)}>
      <div className="flex items-start gap-2">
        <span aria-hidden>{icon}</span>
        <div className="flex-1">
          <p className="text-sm font-medium">{reason.messageRu}</p>
          {reason.deepLink && (
            <button
              type="button"
              onClick={() => {
                haptics.light();
                reason.deepLink?.();
              }}
              className="text-xs text-primary underline-offset-2 hover:underline mt-1 min-h-[44px] inline-flex items-center"
            >
              Перейти к полю
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
