import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { DrumKit } from '@/lib/drum-kits';

interface DrumKitSelectorProps {
  kits: DrumKit[];
  currentKitId: string;
  onSelectKit: (kitId: string) => void;
  className?: string;
}

export const DrumKitSelector = memo(function DrumKitSelector({
  kits,
  currentKitId,
  onSelectKit,
  className
}: DrumKitSelectorProps) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {kits.map((kit) => (
        <Button
          key={kit.id}
          variant={kit.id === currentKitId ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelectKit(kit.id)}
          className="h-8 gap-1.5"
        >
          <span>{kit.icon}</span>
          <span className="text-xs">{kit.name}</span>
        </Button>
      ))}
    </div>
  );
});
