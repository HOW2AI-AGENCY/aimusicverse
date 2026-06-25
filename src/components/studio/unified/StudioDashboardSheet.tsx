/**
 * StudioDashboardSheet — bottom sheet with studio statistics (Sprint 031 US3)
 *
 * Surfaces the professional studio dashboard inside the unified StudioShell.
 * Reuses the existing real-data widgets (StatsSummaryCard / StatsWidget),
 * which read from useUserStudioStats — no mock data, no extra RPC.
 *
 * @module src/components/studio/unified/StudioDashboardSheet
 * @see src/components/professional/StatsWidget.tsx
 * @see src/hooks/useUserStudioStats.ts
 */

import { memo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { StatsWidget, StatsSummaryCard } from '@/components/professional';
import { BarChart3, X } from '@/lib/icons';

interface StudioDashboardSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StudioDashboardSheet = memo(function StudioDashboardSheet({
  open,
  onOpenChange,
}: StudioDashboardSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[85vh] flex-col rounded-t-2xl p-0">
        <SheetHeader className="border-b p-4 pb-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Статистика студии
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => onOpenChange(false)}
              aria-label="Закрыть"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4 p-4 pb-8">
            {/* Productivity summary (30 days) — real data */}
            <StatsSummaryCard />

            {/* Detailed metrics grid — real data */}
            <div className="space-y-2">
              <h4 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Метрики
              </h4>
              <StatsWidget variant="grid" />
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
});

export default StudioDashboardSheet;
