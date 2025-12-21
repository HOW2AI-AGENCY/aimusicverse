/**
 * FeatureHint - Contextual tooltip for first-time feature discovery
 */

import { motion, AnimatePresence } from '@/lib/motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FEATURE_HINTS, FeatureHintId } from '@/hooks/useFeatureHints';

interface FeatureHintProps {
  hintId: FeatureHintId;
  isVisible: boolean;
  onDismiss: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function FeatureHint({ 
  hintId, 
  isVisible, 
  onDismiss, 
  position = 'bottom',
  className 
}: FeatureHintProps) {
  const hint = FEATURE_HINTS[hintId];
  
  if (!hint) return null;

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-primary',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-primary',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-primary',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-primary'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            "absolute z-50 w-64 p-3 rounded-xl",
            "bg-primary text-primary-foreground shadow-lg",
            positionClasses[position],
            className
          )}
          initial={{ opacity: 0, scale: 0.9, y: position === 'bottom' ? -10 : 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {/* Arrow */}
          <div 
            className={cn(
              "absolute w-0 h-0 border-8",
              arrowClasses[position]
            )} 
          />
          
          {/* Content */}
          <div className="flex items-start gap-2">
            {hint.icon && (
              <span className="text-lg flex-shrink-0">{hint.icon}</span>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm mb-0.5">{hint.title}</h4>
              <p className="text-xs opacity-90 leading-relaxed">{hint.description}</p>
            </div>
            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-1 rounded-full hover:bg-primary-foreground/20 transition-colors"
              aria-label="Закрыть подсказку"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            className="mt-2 w-full py-1.5 text-xs font-medium rounded-lg bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
          >
            Понятно
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
