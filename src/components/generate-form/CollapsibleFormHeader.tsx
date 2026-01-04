/**
 * CollapsibleFormHeader - Ultra compact header for GenerateSheet
 * Mobile-optimized with minimal padding and no logo
 */

import { memo, useMemo } from 'react';
import { Zap, Settings2, History, Coins, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { SUNO_MODELS, getAvailableModels } from '@/constants/sunoModels';

interface CollapsibleFormHeaderProps {
  balance?: number;
  cost?: number;
  mode: 'simple' | 'custom';
  onModeChange?: (mode: 'simple' | 'custom') => void;
  onOpenHistory?: () => void;
  model?: string;
  onModelChange?: (model: string) => void;
  onClose?: () => void;
}

export const CollapsibleFormHeader = memo(function CollapsibleFormHeader({
  balance = 0,
  cost = 12,
  mode,
  onModeChange,
  onOpenHistory,
  model = 'V4_5ALL',
  onModelChange,
  onClose,
}: CollapsibleFormHeaderProps) {
  const handleHistoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenHistory?.();
  };

  const availableModels = useMemo(() => getAvailableModels(), []);
  const currentModel = SUNO_MODELS[model] || SUNO_MODELS.V4_5ALL;

  return (
    <div className="flex items-center justify-between py-1 gap-1 min-h-[32px]">
      {/* Left: History + Mode */}
      <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
        {onOpenHistory && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 p-0 rounded-md hover:bg-muted flex-shrink-0" 
            onClick={handleHistoryClick}
          >
            <History className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        )}
        
        {/* Mode dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              type="button"
              className={cn(
                "flex items-center gap-0.5 px-1.5 py-1 rounded-md text-xs font-medium transition-all",
                "bg-muted/50 hover:bg-muted"
              )}
            >
              {mode === 'simple' ? (
                <Zap className="w-3 h-3 text-primary" />
              ) : (
                <Settings2 className="w-3 h-3 text-primary" />
              )}
              <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[120px]">
            <DropdownMenuItem 
              onClick={() => onModeChange?.('simple')}
              className={cn("text-xs", mode === 'simple' && "bg-primary/10")}
            >
              <Zap className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Быстрый
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onModeChange?.('custom')}
              className={cn("text-xs", mode === 'custom' && "bg-primary/10")}
            >
              <Settings2 className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Полный
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right: Model + Balance + Close */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Model selector */}
        {onModelChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                type="button"
                className={cn(
                  "flex items-center gap-0.5 px-1.5 py-1 rounded-md text-xs font-medium transition-all",
                  "bg-muted/50 hover:bg-muted"
                )}
              >
                <span className="text-xs">{currentModel.emoji}</span>
                <span className="font-medium text-[11px] max-w-[50px] truncate">{currentModel.name}</span>
                <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {availableModels.map((m) => (
                <DropdownMenuItem 
                  key={m.key}
                  onClick={() => onModelChange(m.key)}
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    model === m.key && "bg-primary/10"
                  )}
                >
                  <span>{m.emoji}</span>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-xs">{m.name}</span>
                    <span className="text-[9px] text-muted-foreground">{m.cost}💎</span>
                  </div>
                  {m.status === 'latest' && (
                    <span className="text-[8px] px-1 py-0.5 rounded bg-primary/20 text-primary font-medium">NEW</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* Balance */}
        <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-md bg-primary/10 text-primary">
          <Coins className="w-3 h-3" />
          <span className="text-[11px] font-semibold tabular-nums">{balance}</span>
          <span className="text-[9px] text-primary/60">/{cost}</span>
        </div>
        
        {/* Close */}
        {onClose && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 p-0 rounded-md hover:bg-muted flex-shrink-0" 
            onClick={onClose}
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
});
