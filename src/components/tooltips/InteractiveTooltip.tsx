import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  const tooltipRef = useRef<HTMLDivElement>(null);
  const position = config.position || 'bottom';

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleNext = () => {
    setIsVisible(false);
    onNext?.();
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-primary border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-primary border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-primary border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-primary border-y-transparent border-l-transparent'
  };

  return (
    <div className={cn('relative inline-block', className)}>
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              'absolute z-[100] w-64 p-3 rounded-xl bg-primary text-primary-foreground shadow-xl',
              positionClasses[position]
            )}
          >
            {/* Arrow */}
            <div 
              className={cn(
                'absolute w-0 h-0 border-[6px]',
                arrowClasses[position]
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
    </div>
  );
}
