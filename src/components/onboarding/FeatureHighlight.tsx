/**
 * Feature Highlight Component
 * 
 * Pulsing highlight effect for new features.
 * Use to draw attention to new UI elements.
 * 
 * @module components/onboarding/FeatureHighlight
 */

import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface FeatureHighlightProps {
  /** Unique ID for persistence */
  id: string;
  /** Whether to show the highlight */
  enabled?: boolean;
  /** Pulse animation color */
  color?: 'primary' | 'success' | 'warning';
  /** Additional class name */
  className?: string;
  /** Children to wrap */
  children: React.ReactNode;
}

const STORAGE_KEY = 'feature-highlights-seen';

function getSeenHighlights(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function markHighlightSeen(id: string) {
  try {
    const seen = getSeenHighlights();
    seen.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  } catch {
    // Ignore storage errors
  }
}

export const FeatureHighlight = memo(function FeatureHighlight({
  id,
  enabled = true,
  color = 'primary',
  className,
  children,
}: FeatureHighlightProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const seen = getSeenHighlights();
    if (seen.has(id)) return;

    setIsVisible(true);

    // Mark as seen after 5 seconds
    const timer = setTimeout(() => {
      markHighlightSeen(id);
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, enabled]);

  const handleClick = () => {
    if (isVisible) {
      markHighlightSeen(id);
      setIsVisible(false);
    }
  };

  const colorClasses = {
    primary: 'bg-primary/30',
    success: 'bg-green-500/30',
    warning: 'bg-amber-500/30',
  };

  return (
    <div className={cn('relative', className)} onClick={handleClick}>
      {children}

      <AnimatePresence>
        {isVisible && (
          <>
            {/* Pulsing ring */}
            <motion.div
              className={cn(
                'absolute inset-0 rounded-xl pointer-events-none',
                colorClasses[color]
              )}
              initial={{ opacity: 0.5, scale: 1 }}
              animate={{
                opacity: [0.5, 0.2, 0.5],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* "New" badge */}
            <motion.div
              className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full shadow-lg"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              NEW
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});
