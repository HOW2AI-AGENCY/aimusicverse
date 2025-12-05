import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const STORAGE_KEY = 'swipe-onboarding-shown';

interface SwipeOnboardingTooltipProps {
  children: React.ReactNode;
  isFirstSwipeableItem?: boolean;
}

export function SwipeOnboardingTooltip({ 
  children, 
  isFirstSwipeableItem = false 
}: SwipeOnboardingTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!isFirstSwipeableItem) return;
    
    const hasSeenOnboarding = localStorage.getItem(STORAGE_KEY);
    if (!hasSeenOnboarding) {
      // Delay showing tooltip for better UX
      const timer = setTimeout(() => setShowTooltip(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isFirstSwipeableItem]);

  const dismissTooltip = () => {
    setShowTooltip(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  return (
    <div className="relative">
      {children}
      
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute inset-x-0 -top-12 z-50 flex justify-center pointer-events-none"
          >
            <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-xs font-medium pointer-events-auto">
              <div className="flex items-center gap-1">
                <ChevronLeft className="w-3 h-3 animate-pulse" />
                <span>Свайп</span>
                <ChevronRight className="w-3 h-3 animate-pulse" />
              </div>
              <span className="text-primary-foreground/80">для быстрых действий</span>
              <button 
                onClick={dismissTooltip}
                className="ml-1 p-0.5 hover:bg-primary-foreground/20 rounded"
              >
                <X className="w-3 h-3" />
              </button>
              
              {/* Arrow pointing down */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
