/**
 * GenerateModal — единая оболочка модальных окон системы формы генерации.
 *
 * Одна разметка для всех вспомогательных окон (аудио-референс, выбор проекта/трека,
 * мастер кастомного голоса и т.п.):
 *  - на мобильных рендерится Drawer (bottom sheet), на десктопе — Dialog;
 *  - шапка: иконка + заголовок + подзаголовок в едином стиле;
 *  - опциональный индикатор шагов (прогресс + «Шаг N из M»);
 *  - единые отступы, скролл контента и «липкий» футер для основных действий.
 */
import type { ComponentType, ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface GenerateModalStep {
  /** Текущий шаг, 1-based. 0 — шаги не показывать. */
  current: number;
  /** Всего шагов. */
  total: number;
  /** Подпись шага (например, «Образец голоса»). */
  label?: string;
}

export interface GenerateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Иконка из `@/lib/icons`. */
  icon?: ComponentType<{ className?: string }>;
  /** Индикатор прогресса многошаговых сценариев. */
  step?: GenerateModalStep;
  /** Основные действия, закреплённые снизу. */
  footer?: ReactNode;
  /** Максимальная ширина на десктопе. */
  size?: "sm" | "md" | "lg";
  className?: string;
  contentClassName?: string;
  children: ReactNode;
  "data-testid"?: string;
}

const SIZE_CLASS: Record<NonNullable<GenerateModalProps["size"]>, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
};

function StepBar({ step }: { step: GenerateModalStep }) {
  if (!step.total || step.current <= 0) return null;
  const pct = Math.min(100, Math.round((step.current / step.total) * 100));
  return (
    <div className="space-y-1.5 pt-1">
      <Progress value={pct} className="h-1" />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.6875rem] font-medium text-foreground/80 truncate">{step.label}</span>
        <span className="text-[0.6875rem] tabular-nums text-muted-foreground shrink-0">
          Шаг {step.current} из {step.total}
        </span>
      </div>
    </div>
  );
}

export function GenerateModal({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  step,
  footer,
  size = "md",
  className,
  contentClassName,
  children,
  "data-testid": testId,
}: GenerateModalProps) {
  const isMobile = useIsMobile();

  const header = (
    <>
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <span className="text-base font-semibold leading-tight">{title}</span>
      </div>
      {description ? <span className="text-xs text-muted-foreground">{description}</span> : null}
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn("max-h-[90dvh] flex flex-col", className)} data-testid={testId}>
          <DrawerHeader className="px-4 pt-2 pb-3 text-left space-y-1.5 border-b border-border/50">
            <DrawerTitle asChild>
              <div>{header}</div>
            </DrawerTitle>
            <DrawerDescription className="sr-only">{description || title}</DrawerDescription>
            {step ? <StepBar step={step} /> : null}
          </DrawerHeader>
          <ScrollArea className="flex-1 min-h-0">
            <div className={cn("px-4 py-4 space-y-4", contentClassName)}>{children}</div>
          </ScrollArea>
          {footer ? (
            <div className="border-t border-border/50 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-2">
              {footer}
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("max-h-[90vh] flex flex-col gap-0 p-0", SIZE_CLASS[size], className)}
        data-testid={testId}
      >
        <DialogHeader className="space-y-1.5 border-b border-border/50 px-5 pt-5 pb-3 text-left">
          <DialogTitle asChild>
            <div>{header}</div>
          </DialogTitle>
          <DialogDescription className="sr-only">{description || title}</DialogDescription>
          {step ? <StepBar step={step} /> : null}
        </DialogHeader>
        <ScrollArea className="flex-1 min-h-0">
          <div className={cn("px-5 py-4 space-y-4", contentClassName)}>{children}</div>
        </ScrollArea>
        {footer ? <div className="border-t border-border/50 px-5 py-3 space-y-2">{footer}</div> : null}
      </DialogContent>
    </Dialog>
  );
}
