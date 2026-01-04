import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { DrumKit } from '@/lib/drum-kits';

interface KitSelectorProProps {
  kits: DrumKit[];
  currentKit: DrumKit;
  onSelectKit: (kitId: string) => void;
  className?: string;
}

export const KitSelectorPro = memo(function KitSelectorPro({
  kits,
  currentKit,
  onSelectKit,
  className
}: KitSelectorProProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-12 px-4 gap-3 rounded-xl',
            'bg-gradient-to-r from-card to-muted/30',
            'border-border/50 hover:border-primary/50',
            'transition-all',
            className
          )}
        >
          <span className="text-2xl">{currentKit.icon}</span>
          <div className="flex flex-col items-start">
            <span className="font-semibold text-sm">{currentKit.name}</span>
            <span className="text-[10px] text-muted-foreground">{currentKit.description}</span>
          </div>
          <ChevronDown className="h-4 w-4 ml-auto opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-64 p-2 bg-popover/95 backdrop-blur-sm"
      >
        {kits.map((kit) => (
          <DropdownMenuItem
            key={kit.id}
            onClick={() => onSelectKit(kit.id)}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg cursor-pointer',
              'transition-colors',
              kit.id === currentKit.id && 'bg-primary/10'
            )}
          >
            <span className="text-2xl">{kit.icon}</span>
            <div className="flex flex-col flex-1">
              <span className="font-medium">{kit.name}</span>
              <span className="text-xs text-muted-foreground">{kit.description}</span>
            </div>
            {kit.id === currentKit.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
