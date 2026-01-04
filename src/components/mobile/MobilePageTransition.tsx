/**
 * MobilePageTransition - Smooth page transitions for mobile
 * Provides native-feeling navigation animations
 */

import { memo, ReactNode } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { useLocation } from 'react-router-dom';

interface MobilePageTransitionProps {
  children: ReactNode;
  className?: string;
}

// Animation variants for different transition types
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
  },
};

const pageTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

export const MobilePageTransition = memo(function MobilePageTransition({
  children,
  className,
}: MobilePageTransitionProps) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
});

// Simpler fade transition for overlays/modals
export const MobileFadeTransition = memo(function MobileFadeTransition({
  children,
  className,
  isVisible,
}: {
  children: ReactNode;
  className?: string;
  isVisible: boolean;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// Slide up transition for bottom sheets
export const MobileSlideUpTransition = memo(function MobileSlideUpTransition({
  children,
  className,
  isVisible,
}: {
  children: ReactNode;
  className?: string;
  isVisible: boolean;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ 
            type: 'spring',
            stiffness: 400,
            damping: 35,
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
});
