/**
 * CollapsibleFormHeader - Compact header for GenerateSheet
 * Mobile-optimized layout with all controls in one row
 * Uses dynamic models from sunoModels.ts
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
import logo from '@/assets/logo.png';
import { SUNO_MODELS, getAvailableModels, type SunoModelKey } from '@/constants/sunoModels';

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

  // Get available models dynamically
  const availableModels = useMemo(() => getAvailableModels(), []);
  
  // Get current model info
  const currentModel = SUNO_MODELS[model] || SUNO_MODELS.V4_5ALL;

  return (
    <div className="flex items-center justify-between py-2 gap-2 min-h-[44px]">
      {/* Left side: History + Logo + Mode */}
      <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
        {/* History button - moved to left to avoid close button conflict */}
        {onOpenHistory && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 p-0 rounded-lg hover:bg-muted flex-shrink-0" 
            onClick={handleHistoryClick}
          >
            <History className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
        
        <img 
          src={logo} 
          alt="MusicVerse AI" 
          className="h-6 w-6 rounded-md shadow-sm flex-shrink-0"
        />
        
        {/* Mode dropdown - compact */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              type="button"
              className={cn(
                "flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
                "bg-muted/60 hover:bg-muted border border-transparent hover:border-primary/20"
              )}
            >
              {mode === 'simple' ? (
                <Zap className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Settings2 className="w-3.5 h-3.5 text-primary" />
              )}
              <span className="hidden xs:inline text-xs">
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

      {/* Right side: Model + Balance + Close */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Model selector dropdown */}
        {onModelChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                type="button"
                className={cn(
                  "flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
                  "bg-muted/60 hover:bg-muted border border-transparent hover:border-primary/20"
                )}
              >
                <span className="text-sm">{currentModel.emoji}</span>
                <span className="font-semibold text-xs">{currentModel.name}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              {availableModels.map((m) => (
                <DropdownMenuItem 
                  key={m.key}
                  onClick={() => onModelChange(m.key)}
                  className={cn(
                    "flex items-center gap-2",
                    model === m.key && "bg-primary/10"
                  )}
                >
                  <span className="text-base">{m.emoji}</span>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-sm">{m.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{m.desc} • {m.cost}💎</span>
                  </div>
                  {m.status === 'latest' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium flex-shrink-0">NEW</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* Balance pill - compact */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary">
          <Coins className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold tabular-nums">{balance}</span>
          <span className="text-[10px] text-primary/60">/{cost}</span>
        </div>
        
        {/* Close button */}
        {onClose && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 p-0 rounded-lg hover:bg-muted flex-shrink-0" 
            onClick={onClose}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
});
