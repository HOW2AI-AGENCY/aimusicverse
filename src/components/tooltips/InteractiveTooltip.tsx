import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from '@/lib/motion';
import { X, ChevronRight, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getTelegramSafeAreaInsets } from '@/lib/telegramSafeArea';

export interface TooltipConfig {
  id: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  priority?: number;
}

interface InteractiveTooltipProps {
  config: TooltipConfig;
  children: React.ReactNode;
  onDismiss?: () => void;
  onNext?: () => void;
  hasNext?: boolean;
  className?: string;
}

export function InteractiveTooltip({
  config,
  children,
  onDismiss,
  onNext,
  hasNext,
  className
}: InteractiveTooltipProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestedPosition = config.position || 'bottom';

  // Calculate safe position based on Telegram safe areas
  const safePosition = useMemo(() => {
    if (typeof window === 'undefined') return requestedPosition;
    
    const insets = getTelegramSafeAreaInsets();
    const totalTopInset = insets.top + insets.contentTop;
    
    if (requestedPosition === 'top') {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        if (rect.top < totalTopInset + 80) {
          return 'bottom';
        }
      } else {
        if (totalTopInset > 50) {
          return 'bottom';
        }
      }
    }
    
    if (requestedPosition === 'bottom') {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        if (window.innerHeight - rect.bottom < insets.bottom + 80) {
          return 'top';
        }
      }
    }
    
    return requestedPosition;
  }, [requestedPosition]);

  // Calculate tooltip position relative to viewport
  useEffect(() => {
    if (!containerRef.current || !isVisible) return;
    
    const updatePosition = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const tooltipWidth = 256; // w-64 = 16rem = 256px
      const tooltipHeight = 120; // approximate height
      
      let top = 0;
      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      
      // Clamp left to viewport
      left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8));
      
      switch (safePosition) {
        case 'top':
          top = rect.top - tooltipHeight - 8;
          break;
        case 'bottom':
          top = rect.bottom + 8;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - 8;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + 8;
          break;
      }
      
      setTooltipPosition({ top, left });
    };
    
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [safePosition, isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleNext = () => {
    setIsVisible(false);
    onNext?.();
  };

  const arrowClasses = {
    top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-t-primary border-x-transparent border-b-transparent',
    bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-b-primary border-x-transparent border-t-transparent',
    left: 'right-0 top-1/2 -translate-y-1/2 translate-x-full border-l-primary border-y-transparent border-r-transparent',
    right: 'left-0 top-1/2 -translate-y-1/2 -translate-x-full border-r-primary border-y-transparent border-l-transparent'
  };

  const tooltipContent = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={{
            position: 'fixed',
            top: Math.max(16, tooltipPosition.top),
            left: Math.max(8, Math.min(tooltipPosition.left, window.innerWidth - 264)),
            zIndex: 70, // z-[70] per Z_INDEX_HIERARCHY.md for tooltips
          }}
          className="w-64 max-w-[calc(100vw-1rem)] p-3 rounded-xl bg-primary text-primary-foreground shadow-xl"
        >
          {/* Arrow */}
          <div 
            className={cn(
              'absolute w-0 h-0 border-[6px]',
              arrowClasses[safePosition]
            )} 
          />
          
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              <span className="font-semibold text-sm">{config.title}</span>
            </div>
            <button
              onClick={handleDismiss}
              className="p-0.5 rounded hover:bg-primary-foreground/20 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* Description */}
          <p className="text-xs text-primary-foreground/90 leading-relaxed mb-3">
            {config.description}
          </p>
          
          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleDismiss}
              className="text-xs text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              Понятно
            </button>
            
            {hasNext && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleNext}
                className="h-7 text-xs gap-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
              >
                Далее
                <ChevronRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="w-full">{children}</div>
      {typeof document !== 'undefined' && createPortal(tooltipContent, document.body)}
    </div>
  );
}
