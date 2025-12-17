/**
 * QuickMixPresets - 16 quick preset buttons
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { QUICK_MIX_PRESETS, QuickMixPreset } from '@/lib/prompt-dj-presets';

interface QuickMixPresetsProps {
  onApply: (preset: QuickMixPreset) => void;
  disabled?: boolean;
}

export const QuickMixPresets = memo(function QuickMixPresets({
  onApply,
  disabled,
}: QuickMixPresetsProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-medium text-muted-foreground">Быстрые миксы</span>
        <span className="text-[10px] text-muted-foreground">{QUICK_MIX_PRESETS.length} пресетов</span>
      </div>
      
      <ScrollArea className="w-full">
        <div className="flex gap-1.5 pb-2">
          {QUICK_MIX_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant="ghost"
              size="sm"
              className={cn(
                'shrink-0 h-7 px-2.5 text-[11px] rounded-full',
                'bg-muted/20 hover:bg-muted/40',
                'border border-transparent hover:border-primary/30'
              )}
              onClick={() => onApply(preset)}
              disabled={disabled}
            >
              <span className="mr-1">{preset.emoji}</span>
              {preset.label}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
});
