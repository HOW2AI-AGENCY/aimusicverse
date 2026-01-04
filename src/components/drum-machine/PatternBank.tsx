import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Music, Trash2 } from 'lucide-react';
import type { DrumPattern } from '@/lib/drum-kits';

interface PatternBankProps {
  patterns: DrumPattern[];
  onLoadPattern: (pattern: DrumPattern) => void;
  onClearPattern: () => void;
  className?: string;
}

export const PatternBank = memo(function PatternBank({
  patterns,
  onLoadPattern,
  onClearPattern,
  className
}: PatternBankProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Паттерны</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearPattern}
          className="h-6 gap-1 text-xs text-destructive hover:text-destructive"
        >
          <Trash2 className="w-3 h-3" />
          Очистить
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-1.5">
        {patterns.map((pattern) => (
          <Button
            key={pattern.id}
            variant="outline"
            size="sm"
            onClick={() => onLoadPattern(pattern)}
            className="h-7 gap-1.5 text-xs"
          >
            <Music className="w-3 h-3" />
            <span>{pattern.name}</span>
            <span className="text-muted-foreground">({pattern.bpm})</span>
          </Button>
        ))}
      </div>
    </div>
  );
});
