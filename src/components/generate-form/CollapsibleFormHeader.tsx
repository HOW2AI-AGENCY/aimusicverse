/**
 * CollapsibleFormHeader - Compact header for GenerateSheet
 * Mobile: dropdown mode switcher | Desktop: segmented control
 */

import { memo, useMemo } from 'react';
import { Zap, Settings2, Wand2, History, Coins, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { SUNO_MODELS, getAvailableModels } from '@/constants/sunoModels';
import { useIsMobile } from '@/hooks/use-media-query';

// Wizard mode removed for UX simplification - now exported from useGenerateForm
export type GenerationMode = 'simple' | 'custom';

interface CollapsibleFormHeaderProps {
  balance?: number;
  cost?: number;
  mode: GenerationMode;
  onModeChange?: (mode: GenerationMode) => void;
  onOpenHistory?: () => void;
  model?: string;
  onModelChange?: (model: string) => void;
  onClose?: () => void;
}

interface ModeConfig {
  icon: typeof Zap;
  label: string;
  shortLabel: string;
  description: string;
  isNew?: boolean;
}

const MODE_CONFIG: Record<GenerationMode, ModeConfig> = {
  simple: {
    icon: Zap,
    label: 'Быстро',
    shortLabel: 'Быстро',
    description: 'Простое описание',
  },
  custom: {
    icon: Settings2,
    label: 'Полный',
    shortLabel: 'Полный',
    description: 'Все настройки',
  },
};

// Wizard mode removed for UX simplification - only 2 modes now
const MODE_KEYS: GenerationMode[] = ['simple', 'custom'];

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
  const isMobile = useIsMobile();
  
  const handleHistoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenHistory?.();
  };

  const availableModels = useMemo(() => getAvailableModels(), []);
  const currentModel = SUNO_MODELS[model] || SUNO_MODELS.V4_5ALL;
  const currentModeConfig = MODE_CONFIG[mode] || MODE_CONFIG.simple;
  const CurrentIcon = currentModeConfig.icon;

  return (
    <div className="flex items-center justify-between py-1.5 gap-2 min-h-[40px]">
      {/* Left: History + Mode Switcher */}
      <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
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
        
        {/* Mode Switcher - Dropdown on mobile, Segmented on desktop */}
        {isMobile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                type="button"
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all relative",
                  "bg-muted/60 hover:bg-muted min-h-[28px]"
                )}
              >
                <CurrentIcon className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium">{currentModeConfig.shortLabel}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
                {currentModeConfig.isNew && (
                  <span className="absolute -top-1 -right-1 text-[8px] px-1 py-0.5 rounded bg-primary text-primary-foreground font-bold leading-none">
                    NEW
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[180px] bg-popover">
              {MODE_KEYS.map((modeKey) => {
                const config = MODE_CONFIG[modeKey];
                const Icon = config.icon;
                const isActive = mode === modeKey;
                
                return (
                  <DropdownMenuItem 
                    key={modeKey}
                    onClick={() => onModeChange?.(modeKey)}
                    className={cn(
                      "flex items-center gap-2 text-xs cursor-pointer",
                      isActive && "bg-primary/10"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{config.label}</span>
                        {config.isNew && (
                          <span className="text-[8px] px-1 py-0.5 rounded bg-primary text-primary-foreground font-bold leading-none">
                            NEW
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{config.description}</span>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex bg-muted/60 rounded-lg p-0.5 gap-0.5">
            {MODE_KEYS.map((modeKey) => {
              const config = MODE_CONFIG[modeKey];
              const Icon = config.icon;
              const isActive = mode === modeKey;
              
              return (
                <button
                  key={modeKey}
                  type="button"
                  onClick={() => onModeChange?.(modeKey)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all relative",
                    "min-h-[28px] min-w-[60px] justify-center",
                    isActive
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <Icon className={cn(
                    "w-3.5 h-3.5 flex-shrink-0",
                    isActive && "text-primary"
                  )} />
                  <span>{config.shortLabel}</span>
                  {config.isNew && (
                    <span className="absolute -top-1 -right-1 text-[8px] px-1 py-0.5 rounded bg-primary text-primary-foreground font-bold leading-none">
                      NEW
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Model + Balance + Close */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Model selector - compact */}
        {onModelChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                type="button"
                className={cn(
                  "flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
                  "bg-muted/50 hover:bg-muted min-h-[28px]"
                )}
              >
                <span className="text-sm">{currentModel.emoji}</span>
                <span className="font-medium text-[11px] max-w-[40px] truncate hidden sm:inline">{currentModel.name}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px] bg-popover">
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
        
        {/* Balance indicator */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg bg-primary/10 text-primary min-h-[28px]">
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
