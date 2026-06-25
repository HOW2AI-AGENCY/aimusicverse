/**
 * StudioPresetsSheet — bottom sheet wrapper around PresetManager (Sprint 031 US3)
 *
 * Surfaces the preset library inside the unified studio so users can apply
 * saved mixer/effects presets to the active track or save the current studio
 * settings as a new preset.
 *
 * @module src/components/studio/unified/StudioPresetsSheet
 * @see src/components/studio/unified/PresetManager.tsx
 */

import { memo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PresetManager } from './PresetManager';
import type { PresetCategory, PresetSettings } from '@/api/presets.api';
import { SlidersHorizontal, X } from '@/lib/icons';

interface StudioPresetsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Active track the preset is applied to. */
  trackId?: string;
  /** Current studio settings captured when saving a new preset. */
  currentSettings?: PresetSettings;
  /** Default category for the save dialog. */
  defaultCategory?: PresetCategory;
}

export const StudioPresetsSheet = memo(function StudioPresetsSheet({
  open,
  onOpenChange,
  trackId,
  currentSettings,
  defaultCategory = 'mastering',
}: StudioPresetsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[85vh] flex-col rounded-t-2xl p-0">
        <SheetHeader className="border-b p-4 pb-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Пресеты
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

        <div className="min-h-0 flex-1 p-4">
          <PresetManager
            trackId={trackId}
            currentSettings={currentSettings}
            defaultCategory={defaultCategory}
            className="h-full"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
});

export default StudioPresetsSheet;
