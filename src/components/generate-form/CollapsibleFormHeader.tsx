/**
 * CollapsibleFormHeader - Compact header for GenerateSheet
 * Single-line layout with mode dropdown, model selector, balance and history
 * Uses dynamic models from sunoModels.ts
 */

import { memo, useMemo } from 'react';
import { Zap, Settings2, History, Coins, ChevronDown } from 'lucide-react';
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
}

export const CollapsibleFormHeader = memo(function CollapsibleFormHeader({
  balance = 0,
  cost = 12,
  mode,
  onModeChange,
  onOpenHistory,
  model = 'V4_5ALL',
  onModelChange,
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
    <div className="flex items-center justify-between py-2.5 gap-1.5">
      {/* Left: Logo + Mode dropdown */}
      <div className="flex items-center gap-1.5 min-w-0">
        <img 
          src={logo} 
          alt="MusicVerse AI" 
          className="h-6 w-6 rounded-md shadow-sm flex-shrink-0"
        />
        
        {/* Mode dropdown - compact on mobile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              type="button"
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all",
                "bg-muted/60 hover:bg-muted border border-transparent hover:border-primary/20"
              )}
            >
              {mode === 'simple' ? (
                <Zap className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Settings2 className="w-3.5 h-3.5 text-primary" />
              )}
              <span className="hidden xs:inline truncate max-w-[60px]">
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
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Model selector - dropdown with all versions */}
        {onModelChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                type="button"
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all",
                  "bg-muted/60 hover:bg-muted border border-transparent hover:border-primary/20"
                )}
              >
                <span className="text-sm">{currentModel.emoji}</span>
                <span className="font-semibold">{currentModel.name}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
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
                  <div className="flex flex-col">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-[10px] text-muted-foreground">{m.desc} • {m.cost}💎</span>
                  </div>
                  {m.status === 'latest' && (
                    <span className="ml-auto text-[9px] px-1 py-0.5 rounded bg-primary/20 text-primary font-medium">NEW</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* Balance pill - compact */}
        <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-md bg-primary/10 text-primary">
          <Coins className="w-3 h-3" />
          <span className="text-xs font-semibold">{balance}</span>
          <span className="text-[9px] text-primary/60">/{cost}</span>
        </div>
        
        {/* History button */}
        {onOpenHistory && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 p-0 rounded-md hover:bg-muted" 
            onClick={handleHistoryClick}
          >
            <History className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
});
