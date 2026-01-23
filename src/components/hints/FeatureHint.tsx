/**
 * FeatureHint - Contextual tooltip for first-time feature discovery
 * Enhanced with better animations and DialogHeader consistency
 */

import { motion, AnimatePresence } from '@/lib/motion';
import { X, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FEATURE_HINTS, FeatureHintId } from '@/hooks/useFeatureHints';
import { Button } from '@/components/ui/button';

interface FeatureHintProps {
  hintId: FeatureHintId;
  isVisible: boolean;
  onDismiss: () => void;
  onAction?: () => void;
  actionLabel?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'default' | 'premium' | 'info';
  className?: string;
}

export function FeatureHint({ 
  hintId, 
  isVisible, 
  onDismiss,
  onAction,
  actionLabel,
  position = 'bottom',
  variant = 'default',
  className 
}: FeatureHintProps) {
  const hint = FEATURE_HINTS[hintId];
  
  if (!hint) return null;

  const positionClasses = {
    top: 'bottom-full mb-3 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-3 left-1/2 -translate-x-1/2',
    left: 'right-full mr-3 top-1/2 -translate-y-1/2',
    right: 'left-full ml-3 top-1/2 -translate-y-1/2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-[8px] border-b-[8px] border-l-[8px] border-t-transparent border-b-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-[8px] border-b-[8px] border-r-[8px] border-t-transparent border-b-transparent'
  };

  const variantStyles = {
    default: {
      bg: 'bg-primary',
      text: 'text-primary-foreground',
      arrow: 'border-t-primary border-b-primary border-l-primary border-r-primary',
      glow: 'shadow-primary/25'
    },
    premium: {
      bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
      text: 'text-white',
      arrow: 'border-t-amber-500 border-b-amber-500 border-l-amber-500 border-r-amber-500',
      glow: 'shadow-amber-500/30'
    },
    info: {
      bg: 'bg-accent',
      text: 'text-accent-foreground',
      arrow: 'border-t-accent border-b-accent border-l-accent border-r-accent',
      glow: 'shadow-accent/20'
    }
  };

  const styles = variantStyles[variant];

  const enterAnimation = {
    top: { opacity: 0, y: 10, scale: 0.9 },
    bottom: { opacity: 0, y: -10, scale: 0.9 },
    left: { opacity: 0, x: 10, scale: 0.9 },
    right: { opacity: 0, x: -10, scale: 0.9 }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            "absolute z-50 w-72 max-w-[85vw] rounded-xl overflow-hidden",
            styles.bg,
            styles.text,
            `shadow-lg ${styles.glow}`,
            positionClasses[position],
            className
          )}
          initial={enterAnimation[position]}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {/* Arrow with matching color */}
          <div 
            className={cn(
              "absolute w-0 h-0",
              arrowClasses[position],
              styles.arrow
            )} 
          />
          
          {/* Animated shimmer for premium variant */}
          {variant === 'premium' && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
          )}
          
          {/* Content */}
          <div className="relative p-3">
            {/* Header with icon */}
            <div className="flex items-start gap-2.5">
              {hint.icon && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-base">{hint.icon}</span>
                </div>
              )}
              
              <div className="flex-1 min-w-0 pr-6">
                <h4 className="font-semibold text-sm leading-tight mb-1">
                  {hint.title}
                </h4>
                <p className="text-xs opacity-90 leading-relaxed">
                  {hint.description}
                </p>
              </div>
            </div>
            
            {/* Action buttons */}
            {(onAction || actionLabel) && (
              <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-white/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-7 text-xs text-inherit hover:bg-white/10"
                >
                  Пропустить
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onAction || onDismiss}
                  className="h-7 text-xs gap-1 bg-white/20 hover:bg-white/30 text-inherit"
                >
                  {actionLabel || 'Попробовать'}
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Close button - ALWAYS top-right with 44px touch target */}
          <button
            onClick={onDismiss}
            className={cn(
              "absolute top-1 right-1",
              "w-8 h-8 min-w-[32px] min-h-[32px]",
              "flex items-center justify-center rounded-full",
              "hover:bg-white/20 active:bg-white/30",
              "transition-colors touch-manipulation"
            )}
            aria-label="Закрыть подсказку"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Compact inline hint for smaller spaces
 */
interface InlineHintProps {
  text: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'premium';
  className?: string;
}

export function InlineHint({ text, icon, variant = 'default', className }: InlineHintProps) {
  const variantStyles = {
    default: 'bg-accent/50 text-accent-foreground',
    premium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
  };

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs",
        variantStyles[variant],
        className
      )}
    >
      {icon || <Sparkles className="w-3 h-3" />}
      <span>{text}</span>
    </div>
  );
}

export default FeatureHint;
