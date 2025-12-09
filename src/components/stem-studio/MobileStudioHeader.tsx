/**
 * Mobile Studio Header
 * 
 * Compact header with contextual hints and actions
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { ChevronLeft, Scissors, Sliders, HelpCircle, Sparkles, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MobileStudioHeaderProps {
  title: string;
  onBack: () => void;
  canReplace: boolean;
  effectsEnabled: boolean;
  onEnableEffects: () => void;
  onStartReplace: () => void;
  onHelp: () => void;
  editMode: 'none' | 'selecting' | 'editing' | 'comparing';
}

const TIPS = [
  { icon: Scissors, text: 'Выберите секцию для замены AI' },
  { icon: Sliders, text: 'Включите эффекты для обработки звука' },
  { icon: Music, text: 'Нажмите на стем для Solo/Mute' },
];

export function MobileStudioHeader({
  title,
  onBack,
  canReplace,
  effectsEnabled,
  onEnableEffects,
  onStartReplace,
  onHelp,
  editMode,
}: MobileStudioHeaderProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [showTip, setShowTip] = useState(true);

  // Rotate tips
  useEffect(() => {
    if (!showTip) return;
    
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIPS.length);
    }, 5000);

    // Hide tips after 15 seconds
    const timeout = setTimeout(() => {
      setShowTip(false);
    }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [showTip]);

  const currentTip = TIPS[tipIndex];

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/50">
      {/* Main header row */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 rounded-full flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
              Студия
            </span>
            <h1 className="text-sm font-semibold truncate">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Replace button */}
          {canReplace && editMode === 'none' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onStartReplace}
              className="h-8 gap-1 px-2.5"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span className="text-xs">AI</span>
            </Button>
          )}

          {/* Effects toggle */}
          {!effectsEnabled ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onEnableEffects}
              className="h-8 gap-1 px-2.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="text-xs">FX</span>
            </Button>
          ) : (
            <Badge variant="secondary" className="h-8 px-2.5 gap-1">
              <Sliders className="w-3 h-3" />
              <span className="text-[10px]">FX</span>
            </Badge>
          )}

          {/* Help */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onHelp}
            className="h-8 w-8 rounded-full"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Contextual tip banner */}
      <AnimatePresence>
        {showTip && editMode === 'none' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div 
              className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-t border-primary/10 cursor-pointer"
              onClick={() => setShowTip(false)}
            >
              <motion.div
                key={tipIndex}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <currentTip.icon className="w-3.5 h-3.5" />
                <span>{currentTip.text}</span>
              </motion.div>
              <span className="text-[10px] text-muted-foreground/50 ml-auto">Скрыть</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit mode indicator */}
      <AnimatePresence>
        {editMode !== 'none' && editMode !== 'comparing' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-t border-amber-500/20">
              <Scissors className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-amber-500 font-medium">
                {editMode === 'selecting' ? 'Выберите секцию для замены' : 'Редактирование секции'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
