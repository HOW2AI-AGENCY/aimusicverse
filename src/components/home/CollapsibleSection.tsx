/**
 * CollapsibleSection - Collapsible content section with animation
 * 
 * Features:
 * - Smooth expand/collapse animation
 * - Persists state to localStorage
 * - Haptic feedback on toggle
 * - Accessibility support
 */

import { memo, useState, useCallback, useEffect, useId } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';

interface CollapsibleSectionProps {
  /** Unique key for localStorage persistence */
  storageKey: string;
  /** Section title */
  title: string;
  /** Optional icon before title */
  icon?: React.ReactNode;
  /** Content count badge */
  count?: number;
  /** Section content */
  children: React.ReactNode;
  /** Initial collapsed state (default: false - expanded) */
  defaultCollapsed?: boolean;
  /** Whether to persist state to localStorage */
  persistState?: boolean;
  /** Additional class for the container */
  className?: string;
  /** Callback when collapse state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
}

export const CollapsibleSection = memo(function CollapsibleSection({
  storageKey,
  title,
  icon,
  count,
  children,
  defaultCollapsed = false,
  persistState = true,
  className,
  onCollapsedChange,
}: CollapsibleSectionProps) {
  const { hapticFeedback } = useTelegram();
  const id = useId();
  const contentId = `collapsible-content-${id}`;
  const buttonId = `collapsible-button-${id}`;

  // Load persisted state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (persistState && typeof window !== 'undefined') {
      const stored = localStorage.getItem(`section-collapsed-${storageKey}`);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return defaultCollapsed;
  });

  // Persist state changes
  useEffect(() => {
    if (persistState && typeof window !== 'undefined') {
      localStorage.setItem(`section-collapsed-${storageKey}`, String(isCollapsed));
    }
  }, [isCollapsed, storageKey, persistState]);

  const handleToggle = useCallback(() => {
    hapticFeedback('light');
    setIsCollapsed(prev => {
      const newState = !prev;
      onCollapsedChange?.(newState);
      return newState;
    });
  }, [hapticFeedback, onCollapsedChange]);

  return (
    <motion.section
      className={cn("space-y-2", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header button */}
      <motion.button
        id={buttonId}
        onClick={handleToggle}
        className={cn(
          "w-full flex items-center justify-between gap-2 p-2 rounded-lg",
          "hover:bg-muted/50 active:bg-muted transition-colors duration-200",
          "touch-manipulation select-none"
        )}
        aria-expanded={!isCollapsed}
        aria-controls={contentId}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <div className="flex-shrink-0 w-6 h-6 rounded-md bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
              {icon}
            </div>
          )}
          <h2 className="text-sm font-semibold text-foreground truncate">{title}</h2>
          {count !== undefined && count > 0 && (
            <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-muted rounded-full text-muted-foreground">
              {count}
            </span>
          )}
        </div>

        <motion.div
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </motion.button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            id={contentId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: 'auto', 
              opacity: 1,
              transition: {
                height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.2, delay: 0.1 }
              }
            }}
            exit={{ 
              height: 0, 
              opacity: 0,
              transition: {
                height: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.1 }
              }
            }}
            className="overflow-hidden"
          >
            <div className="pt-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
});
