import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { StepLength } from '@/hooks/useDrumMachine';

interface DrumStepLengthSelectorProps {
  stepLength: StepLength;
  onSetStepLength: (length: StepLength) => void;
  className?: string;
}

const stepLengths: StepLength[] = [16, 32, 64];

export const DrumStepLengthSelector = memo(function DrumStepLengthSelector({
  stepLength,
  onSetStepLength,
  className
}: DrumStepLengthSelectorProps) {
  return (
    <div className={cn('flex items-center gap-1 p-0.5 bg-muted rounded-md', className)}>
      {stepLengths.map((length) => (
        <Button
          key={length}
          variant={stepLength === length ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onSetStepLength(length)}
          className="h-6 px-2 text-xs"
        >
          {length}
        </Button>
      ))}
    </div>
  );
});
