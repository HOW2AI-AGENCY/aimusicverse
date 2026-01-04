/**
 * CollapsibleFormHeader - Collapsible header for GenerateSheet
 * Minimizes to show just essential info when scrolled
 */

import { memo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { ChevronDown, ChevronUp, Sparkles, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

interface CollapsibleFormHeaderProps {
  isCollapsed: boolean;
  onToggle: () => void;
  balance?: number;
  cost?: number;
  mode: 'simple' | 'custom';
  onOpenHistory?: () => void;
}

export const CollapsibleFormHeader = memo(function CollapsibleFormHeader({
  isCollapsed,
  onToggle,
  balance = 0,
  cost = 10,
  mode,
  onOpenHistory,
}: CollapsibleFormHeaderProps) {
  const handleHistoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenHistory?.();
  };

  return (
    <motion.div
      layout
      className={cn(
        "flex items-center transition-all cursor-pointer",
        isCollapsed ? "justify-between py-2" : "justify-center flex-col py-3"
      )}
      onClick={onToggle}
    >
      <AnimatePresence mode="wait">
        {isCollapsed ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <img 
                src={logo} 
                alt="MusicVerse AI" 
                className="h-6 w-6 rounded-lg shadow-sm"
              />
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium">
                  {mode === 'simple' ? 'Быстрый' : 'Кастом'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {onOpenHistory && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 p-0" 
                  onClick={handleHistoryClick}
                >
                  <History className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              )}
              <span className="text-xs text-muted-foreground">
                {balance} ⚡ / {cost}
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center"
          >
            <img 
              src={logo} 
              alt="MusicVerse AI" 
              className="h-10 w-10 rounded-xl shadow-md"
            />
            <span className="text-xs font-bold text-gradient mt-1">MusicVerse AI</span>
            <ChevronUp className="w-4 h-4 text-muted-foreground mt-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
