/**
 * CollapsibleFormHeader - Compact header for GenerateSheet
 * Single-line layout with mode dropdown, model selector, balance and history
 */

import { memo, useState } from 'react';
import { Zap, Settings2, History, Coins, ChevronDown, Flame, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

interface CollapsibleFormHeaderProps {
  balance?: number;
  cost?: number;
  mode: 'simple' | 'custom';
  onModeChange?: (mode: 'simple' | 'custom') => void;
  onOpenHistory?: () => void;
  model?: string;
  onModelChange?: (model: string) => void;
}

const MODELS = [
  { value: 'chirp-v4', label: '4.5 Turbo', icon: Flame },
  { value: 'chirp-v3-5', label: 'v3.5', icon: Cpu },
  { value: 'chirp-v3', label: 'v3', icon: Cpu },
];

export const CollapsibleFormHeader = memo(function CollapsibleFormHeader({
  balance = 0,
  cost = 10,
  mode,
  onModeChange,
  onOpenHistory,
  model = 'chirp-v4',
  onModelChange,
}: CollapsibleFormHeaderProps) {
  const handleHistoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenHistory?.();
  };

  const currentModel = MODELS.find(m => m.value === model) || MODELS[0];

  return (
    <div className="flex items-center justify-between py-2.5 gap-2">
      {/* Left: Logo + Mode dropdown */}
      <div className="flex items-center gap-2 min-w-0">
        <img 
          src={logo} 
          alt="MusicVerse AI" 
          className="h-7 w-7 rounded-lg shadow-sm flex-shrink-0"
        />
        
        {/* Mode dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              type="button"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                "bg-muted/60 hover:bg-muted border border-transparent hover:border-primary/20"
              )}
            >
              {mode === 'simple' ? (
                <Zap className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Settings2 className="w-3.5 h-3.5 text-primary" />
              )}
              <span className="truncate">
                {mode === 'simple' ? 'Быстрый' : 'Полный'}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[140px]">
            <DropdownMenuItem 
              onClick={() => onModeChange?.('simple')}
              className={cn(mode === 'simple' && "bg-primary/10")}
            >
              <Zap className="w-4 h-4 mr-2 text-primary" />
              Быстрый
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onModeChange?.('custom')}
              className={cn(mode === 'custom' && "bg-primary/10")}
            >
              <Settings2 className="w-4 h-4 mr-2 text-primary" />
              Полный
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right: Model + Balance + History */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Model selector - compact */}
        {onModelChange && (
          <Select value={model} onValueChange={onModelChange}>
            <SelectTrigger className="h-7 w-auto gap-1 px-2 text-xs border-0 bg-muted/60 hover:bg-muted rounded-lg">
              <currentModel.icon className="w-3 h-3 text-orange-500" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value} className="text-xs">
                  <div className="flex items-center gap-2">
                    <m.icon className="w-3 h-3" />
                    {m.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {/* Balance pill */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary">
          <Coins className="w-3 h-3" />
          <span className="text-xs font-semibold">{balance}</span>
          <span className="text-[10px] text-primary/60">/{cost}</span>
        </div>
        
        {/* History button */}
        {onOpenHistory && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 p-0 rounded-lg hover:bg-muted" 
            onClick={handleHistoryClick}
          >
            <History className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
});
