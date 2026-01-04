/**
 * CollapsibleFormHeader - Minimalist header for GenerateSheet
 * Collapsed: compact one-line with essential info
 * Expanded: centered logo with mode selector
 */

import { memo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { ChevronDown, ChevronUp, Zap, Settings2, History, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

interface CollapsibleFormHeaderProps {
  isCollapsed: boolean;
  onToggle: () => void;
  balance?: number;
  cost?: number;
  mode: 'simple' | 'custom';
  onModeChange?: (mode: 'simple' | 'custom') => void;
  onOpenHistory?: () => void;
}

export const CollapsibleFormHeader = memo(function CollapsibleFormHeader({
  isCollapsed,
  onToggle,
  balance = 0,
  cost = 10,
  mode,
  onModeChange,
  onOpenHistory,
}: CollapsibleFormHeaderProps) {
  const handleHistoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenHistory?.();
  };

  const handleModeClick = (e: React.MouseEvent, newMode: 'simple' | 'custom') => {
    e.stopPropagation();
    onModeChange?.(newMode);
  };

  return (
    <motion.div
      layout
      className={cn(
        "transition-all cursor-pointer select-none",
        isCollapsed ? "py-2" : "py-3"
      )}
      onClick={onToggle}
    >
      <AnimatePresence mode="wait">
        {isCollapsed ? (
          /* ========== COLLAPSED VIEW ========== */
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-between w-full"
          >
            {/* Left: Logo + Mode indicator */}
            <div className="flex items-center gap-2">
              <img 
                src={logo} 
                alt="MusicVerse AI" 
                className="h-7 w-7 rounded-lg shadow-sm"
              />
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50">
                {mode === 'simple' ? (
                  <Zap className="w-3 h-3 text-primary" />
                ) : (
                  <Settings2 className="w-3 h-3 text-primary" />
                )}
                <span className="text-xs font-medium">
                  {mode === 'simple' ? 'Быстрый' : 'Полный'}
                </span>
              </div>
            </div>

            {/* Right: Balance + History + Chevron */}
            <div className="flex items-center gap-2">
              {/* Balance pill */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary">
                <Coins className="w-3 h-3" />
                <span className="text-xs font-semibold">{balance}</span>
                <span className="text-[10px] text-primary/60">/{cost}</span>
              </div>
              
              {onOpenHistory && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 p-0" 
                  onClick={handleHistoryClick}
                >
                  <History className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
              
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </motion.div>
        ) : (
          /* ========== EXPANDED VIEW ========== */
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center gap-2"
          >
            {/* Logo */}
            <img 
              src={logo} 
              alt="MusicVerse AI" 
              className="h-12 w-12 rounded-xl shadow-md"
            />
            
            {/* Title */}
            <span className="text-sm font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              MusicVerse AI
            </span>
            
            {/* Mode toggle pills */}
            {onModeChange && (
              <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50">
                <button
                  type="button"
                  onClick={(e) => handleModeClick(e, 'simple')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    mode === 'simple'
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Zap className="w-3 h-3" />
                  Быстрый
                </button>
                <button
                  type="button"
                  onClick={(e) => handleModeClick(e, 'custom')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    mode === 'custom'
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Settings2 className="w-3 h-3" />
                  Полный
                </button>
              </div>
            )}
            
            {/* Balance row */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Coins className="w-3 h-3" />
                <span>Баланс: <span className="font-semibold text-foreground">{balance}</span></span>
              </div>
              <span className="text-muted-foreground/50">•</span>
              <span>Стоимость: <span className="font-semibold text-foreground">{cost}</span></span>
            </div>
            
            {/* Collapse indicator */}
            <ChevronUp className="w-4 h-4 text-muted-foreground/50 mt-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});