/**
 * Interface Hints - Contextual tooltips and hints throughout the app
 *
 * NOTE: Now routes through the unified HintRegistry so that:
 *  - the same hint id is never displayed twice across systems;
 *  - only one hint is visible at a time globally;
 *  - hints don't appear over open modals/sheets/drawers.
 */

import { useState, useEffect } from 'react';
import { Info, Lightbulb, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { backdrop } from '@/lib/overlay-colors';
import { useHintRegistry } from '@/components/hints';

interface HintProps {
  id: string;
  children: React.ReactNode;
  hint: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showOnce?: boolean;
  delay?: number;
}

// Legacy key — kept for reference only; storage is now unified via HintRegistry.
// const HINTS_STORAGE_KEY = 'mvai_hints_shown';

export function Hint({
  id,
  children,
  hint,
  position = 'top',
  showOnce = true,
  delay = 2000,
}: HintProps) {
  const reg = useHintRegistry();
  const isActive = reg.activeId === id;
  const dismissed = showOnce && reg.hasSeen(id);

  useEffect(() => {
    if (dismissed) return;
    const timer = setTimeout(() => {
      reg.request(id);
    }, delay);
    return () => {
      clearTimeout(timer);
      reg.release(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, dismissed, delay]);

  const handleDismiss = () => {
    if (showOnce) reg.markSeen(id);
    reg.release(id);
  };

  const showHint = isActive && !dismissed;

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-card border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-card border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-card border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-card border-y-transparent border-l-transparent',
  };

  return (
    <div className="relative inline-flex">
      {children}
      
      <AnimatePresence>
        {showHint && !dismissed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              'absolute z-50 w-48 p-3 rounded-lg bg-card border border-border shadow-lg',
              positionClasses[position]
            )}
          >
            {/* Arrow */}
            <div className={cn(
              'absolute w-0 h-0 border-[6px]',
              arrowClasses[position]
            )} />
            
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground flex-1">{hint}</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 -mt-1 -mr-1"
                onClick={handleDismiss}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Pulsing indicator for new features
interface PulseIndicatorProps {
  show?: boolean;
  className?: string;
}

export function PulseIndicator({ show = true, className }: PulseIndicatorProps) {
  if (!show) return null;
  
  return (
    <span className={cn('relative flex h-2 w-2', className)}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
    </span>
  );
}

// Info tooltip for explaining features
interface InfoTooltipProps {
  text: string;
  className?: string;
}

export function InfoTooltip({ text, className }: InfoTooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        className={cn('text-muted-foreground hover:text-foreground transition-colors', className)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
      >
        <Info className="w-4 h-4" />
      </button>
      
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-48 p-2 rounded-lg bg-popover border border-border shadow-md"
          >
            <p className="text-xs text-popover-foreground">{text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Feature spotlight - highlights new features
interface SpotlightProps {
  id: string;
  children: React.ReactNode;
  title: string;
  description: string;
  showOnce?: boolean;
}

export function Spotlight({ id, children, title, description, showOnce = true }: SpotlightProps) {
  const reg = useHintRegistry();
  const active = reg.activeId === id;

  useEffect(() => {
    if (showOnce && reg.hasSeen(id)) return;
    const timer = setTimeout(() => reg.request(id), 1000);
    return () => {
      clearTimeout(timer);
      reg.release(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, showOnce]);

  const handleDismiss = () => {
    if (showOnce) reg.markSeen(id);
    reg.release(id);
  };

  return (
    <div className="relative">
      {children}
      
      <AnimatePresence>
        {active && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn("fixed inset-0 z-40", backdrop.medium)}
              onClick={handleDismiss}
            />
            
            {/* Spotlight ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 ring-4 ring-primary rounded-lg z-50 pointer-events-none"
            />
            
            {/* Info card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-full mt-3 left-1/2 -translate-x-1/2 z-50 w-64 p-4 rounded-xl bg-card border border-border shadow-xl"
            >
              <h4 className="font-semibold text-sm mb-1">{title}</h4>
              <p className="text-xs text-muted-foreground mb-3">{description}</p>
              <Button size="sm" className="w-full" onClick={handleDismiss}>
                Понятно
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
