import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Lightbulb } from 'lucide-react';

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
      const timer = setTimeout(() => setShowTooltip(true), 1500);
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-x-0 -top-16 z-50 flex justify-center pointer-events-none"
          >
            <div className="bg-primary text-primary-foreground px-4 py-3 rounded-xl shadow-xl pointer-events-auto max-w-[280px]">
              {/* Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  <span className="font-semibold text-sm">Свайп-жесты</span>
                </div>
                <button 
                  onClick={dismissTooltip}
                  className="p-0.5 hover:bg-primary-foreground/20 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {/* Description */}
              <p className="text-xs text-primary-foreground/90 leading-relaxed mb-2">
                Проведите по карточке трека для быстрых действий
              </p>
              
              {/* Actions hint */}
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <ChevronLeft className="w-3 h-3 animate-pulse" />
                  <span>Версия</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Очередь</span>
                  <ChevronRight className="w-3 h-3 animate-pulse" />
                </div>
              </div>
              
              {/* Arrow pointing down */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
