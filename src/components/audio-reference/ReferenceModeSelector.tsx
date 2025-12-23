/**
 * Reference Mode Selector Component
 * Allows switching between Cover/Extend/Reference modes inline
 */

import { memo } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Disc, ArrowRight, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReferenceMode } from '@/services/audio-reference';

interface ReferenceModeSelectorProps {
  mode: ReferenceMode | undefined;
  onModeChange: (mode: ReferenceMode) => void;
  compact?: boolean;
  className?: string;
}

const modeConfig = {
  cover: { 
    icon: Disc, 
    label: 'Кавер', 
    shortLabel: 'Кавер',
    desc: 'Новая версия в другом стиле',
    color: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30',
  },
  extend: { 
    icon: ArrowRight, 
    label: 'Расширить', 
    shortLabel: 'Расшир.',
    desc: 'Продолжить композицию',
    color: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
  },
  reference: { 
    icon: Music, 
    label: 'Референс', 
    shortLabel: 'Реф.',
    desc: 'Использовать как стилистический референс',
    color: 'bg-muted text-muted-foreground border-border',
  },
};

export const ReferenceModeSelector = memo(function ReferenceModeSelector({
  mode = 'reference',
  onModeChange,
  compact = false,
  className,
}: ReferenceModeSelectorProps) {
  if (compact) {
    // Compact badge-style selector
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {(['cover', 'extend', 'reference'] as const).map((m) => {
          const cfg = modeConfig[m];
          const isActive = mode === m;
          return (
            <Badge
              key={m}
              variant="outline"
              className={cn(
                "cursor-pointer transition-all text-[10px] px-1.5 py-0.5 h-5",
                isActive ? cfg.color : "opacity-50 hover:opacity-80"
              )}
              onClick={() => onModeChange(m)}
            >
              {cfg.shortLabel}
            </Badge>
          );
        })}
      </div>
    );
  }

  // Full tabs selector
  return (
    <div className={cn("space-y-1.5", className)}>
      <Tabs 
        value={mode || 'reference'} 
        onValueChange={(v) => onModeChange(v as ReferenceMode)} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 h-9">
          {(['cover', 'extend', 'reference'] as const).map((m) => {
            const cfg = modeConfig[m];
            const Icon = cfg.icon;
            return (
              <TabsTrigger 
                key={m} 
                value={m}
                className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary/10"
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cfg.shortLabel}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
      <p className="text-[10px] text-muted-foreground text-center">
        {modeConfig[mode || 'reference'].desc}
      </p>
    </div>
  );
});

export { modeConfig };
