import { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from '@/lib/motion';
import type { PanInfo } from '@/lib/motion';
import { ListPlus, RefreshCw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';
import { useFeatureUsageTracking, FeatureEvents } from '@/hooks/analytics';

interface SwipeableTrackItemProps {
  children: React.ReactNode;
  onAddToQueue?: () => void;
  onSwitchVersion?: () => void;
  hasMultipleVersions?: boolean;
  className?: string;
}

const SWIPE_THRESHOLD = 60;
const ACTION_WIDTH = 72;
const MIN_DRAG_DISTANCE = 10;
const VERTICAL_DOMINANCE_RATIO = 1.5;

export function SwipeableTrackItem({
  children,
  onAddToQueue,
  onSwitchVersion,
  hasMultipleVersions = false,
  className,
}: SwipeableTrackItemProps) {
  const [isOpen, setIsOpen] = useState<'left' | 'right' | null>(null);
  const [actionTriggered, setActionTriggered] = useState<'queue' | 'version' | null>(null);
  const x = useMotionValue(0);
  const dragDirectionRef = useRef<'x' | 'y' | null>(null);
  const { trackFeature } = useFeatureUsageTracking();
  
  // Transform for action button opacity, scale and glow
  const leftOpacity = useTransform(x, [-ACTION_WIDTH, -20, 0], [1, 0.5, 0]);
  const leftScale = useTransform(x, [-ACTION_WIDTH, -20, 0], [1, 0.85, 0.6]);
  const leftGlow = useTransform(x, [-ACTION_WIDTH, -30, 0], [1, 0.3, 0]);
  const rightOpacity = useTransform(x, [0, 20, ACTION_WIDTH], [0, 0.5, 1]);
  const rightScale = useTransform(x, [0, 20, ACTION_WIDTH], [0.6, 0.85, 1]);
  const rightGlow = useTransform(x, [0, 30, ACTION_WIDTH], [0, 0.3, 1]);

  const handleDragStart = () => {
    dragDirectionRef.current = null;
  };

  const handleDrag = (_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    const absX = Math.abs(info.offset.x);
    const absY = Math.abs(info.offset.y);

    // Determine direction after minimal movement
    if (!dragDirectionRef.current && (absX > MIN_DRAG_DISTANCE || absY > MIN_DRAG_DISTANCE)) {
      // If vertical movement dominates - lock as vertical
      if (absY > absX * VERTICAL_DOMINANCE_RATIO) {
        dragDirectionRef.current = 'y';
      } else if (absX > absY) {
        dragDirectionRef.current = 'x';
      }
    }

    // If vertical - reset horizontal position
    if (dragDirectionRef.current === 'y') {
      x.set(0);
    }
  };
  
  const handleDragEnd = (_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    // If was vertical scroll - just reset
    if (dragDirectionRef.current === 'y') {
      setIsOpen(null);
      x.set(0);
      return;
    }

    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    // Quick swipe detection
    const isQuickSwipe = Math.abs(velocity) > 400;
    
    if (offset < -SWIPE_THRESHOLD || (isQuickSwipe && velocity < 0)) {
      // Swipe left - show queue action
      hapticImpact('light');
      setIsOpen('left');
      x.set(-ACTION_WIDTH);
    } else if ((offset > SWIPE_THRESHOLD || (isQuickSwipe && velocity > 0)) && hasMultipleVersions) {
      // Swipe right - show version action (only if has multiple versions)
      hapticImpact('light');
      setIsOpen('right');
      x.set(ACTION_WIDTH);
    } else {
      // Reset
      setIsOpen(null);
      x.set(0);
    }
  };

  const handleActionClick = useCallback((action: 'queue' | 'version') => {
    hapticImpact('medium');
    setActionTriggered(action);
    
    // Track swipe action
    if (action === 'queue') {
      trackFeature(FeatureEvents.SWIPE_ACTION('add_to_queue'));
      trackFeature(FeatureEvents.QUEUE_MODIFIED('add'));
      onAddToQueue?.();
    } else if (action === 'version') {
      trackFeature(FeatureEvents.SWIPE_ACTION('switch_version'));
      onSwitchVersion?.();
    }
    
    // Show success feedback then reset
    setTimeout(() => {
      setActionTriggered(null);
      setIsOpen(null);
      x.set(0);
    }, 400);
  }, [onAddToQueue, onSwitchVersion, trackFeature, x]);

  const closeSwipe = () => {
    setIsOpen(null);
    x.set(0);
  };

  return (
    <div 
      className={cn("relative overflow-hidden rounded-xl", className)}
    >
      {/* Left action - Add to Queue (revealed when swiping left) */}
      <motion.div
        className="absolute inset-y-0 right-0 w-[72px] flex items-center justify-center rounded-r-xl overflow-hidden"
        style={{ opacity: leftOpacity }}
      >
        {/* Animated gradient background */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-l from-primary via-primary/90 to-primary/70"
          style={{ opacity: leftGlow }}
        />
        <motion.div 
          className="absolute inset-0 bg-primary/20"
          animate={{ 
            opacity: isOpen === 'left' ? [0.3, 0.6, 0.3] : 0 
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        <motion.button
          onClick={() => handleActionClick('queue')}
          className="relative flex flex-col items-center justify-center gap-1 text-primary-foreground p-3 touch-manipulation z-10"
          style={{ scale: leftScale }}
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence mode="wait">
            {actionTriggered === 'queue' ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <Check className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="icon"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <ListPlus className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="text-[10px] font-semibold tracking-wide">Очередь</span>
        </motion.button>
      </motion.div>

      {/* Right action - Switch Version (revealed when swiping right) */}
      {hasMultipleVersions && (
        <motion.div
          className="absolute inset-y-0 left-0 w-[72px] flex items-center justify-center rounded-l-xl overflow-hidden"
          style={{ opacity: rightOpacity }}
        >
          {/* Animated gradient background */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/90 to-secondary/70"
            style={{ opacity: rightGlow }}
          />
          <motion.div 
            className="absolute inset-0 bg-secondary/20"
            animate={{ 
              opacity: isOpen === 'right' ? [0.3, 0.6, 0.3] : 0 
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          
          <motion.button
            onClick={() => handleActionClick('version')}
            className="relative flex flex-col items-center justify-center gap-1 text-secondary-foreground p-3 touch-manipulation z-10"
            style={{ scale: rightScale }}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {actionTriggered === 'version' ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <Check className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="icon"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="animate-spin-slow"
                >
                  <RefreshCw className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
            <span className="text-[10px] font-semibold tracking-wide">Версия</span>
          </motion.button>
        </motion.div>
      )}

      {/* Main content with shadow on swipe */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ 
          left: -ACTION_WIDTH, 
          right: hasMultipleVersions ? ACTION_WIDTH : 0 
        }}
        dragElastic={0.15}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x }}
        onTap={() => {
          if (isOpen) {
            closeSwipe();
          }
        }}
        className={cn(
          "relative bg-background rounded-xl transition-shadow duration-200",
          isOpen && "shadow-lg"
        )}
      >
        {children}
      </motion.div>
    </div>
  );
}
