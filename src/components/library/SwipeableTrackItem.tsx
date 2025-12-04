import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ListPlus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';

interface SwipeableTrackItemProps {
  children: React.ReactNode;
  onAddToQueue?: () => void;
  onSwitchVersion?: () => void;
  hasMultipleVersions?: boolean;
  className?: string;
}

const SWIPE_THRESHOLD = 50;
const ACTION_WIDTH = 64;

export function SwipeableTrackItem({
  children,
  onAddToQueue,
  onSwitchVersion,
  hasMultipleVersions = false,
  className,
}: SwipeableTrackItemProps) {
  const [isOpen, setIsOpen] = useState<'left' | 'right' | null>(null);
  const x = useMotionValue(0);
  
  // Transform for action button opacity and scale
  const leftOpacity = useTransform(x, [-ACTION_WIDTH, -20, 0], [1, 0.5, 0]);
  const leftScale = useTransform(x, [-ACTION_WIDTH, -20, 0], [1, 0.8, 0.6]);
  const rightOpacity = useTransform(x, [0, 20, ACTION_WIDTH], [0, 0.5, 1]);
  const rightScale = useTransform(x, [0, 20, ACTION_WIDTH], [0.6, 0.8, 1]);
  
  const handleDragEnd = (_: any, info: PanInfo) => {
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

  const handleActionClick = (action: 'queue' | 'version') => {
    hapticImpact('medium');
    
    if (action === 'queue') {
      onAddToQueue?.();
    } else if (action === 'version') {
      onSwitchVersion?.();
    }
    
    // Reset position after action
    setTimeout(() => {
      setIsOpen(null);
      x.set(0);
    }, 150);
  };

  const closeSwipe = () => {
    setIsOpen(null);
    x.set(0);
  };

  return (
    <div 
      className={cn("relative overflow-hidden rounded-lg", className)}
    >
      {/* Left action - Add to Queue (revealed when swiping left) */}
      <motion.div
        className="absolute inset-y-0 right-0 w-16 flex items-center justify-center bg-primary rounded-r-lg"
        style={{ opacity: leftOpacity, scale: leftScale }}
      >
        <button
          onClick={() => handleActionClick('queue')}
          className="flex flex-col items-center justify-center gap-0.5 text-primary-foreground p-2 touch-manipulation active:scale-95 transition-transform"
        >
          <ListPlus className="w-5 h-5" />
          <span className="text-[9px] font-medium leading-tight">Очередь</span>
        </button>
      </motion.div>

      {/* Right action - Switch Version (revealed when swiping right) */}
      {hasMultipleVersions && (
        <motion.div
          className="absolute inset-y-0 left-0 w-16 flex items-center justify-center bg-secondary rounded-l-lg"
          style={{ opacity: rightOpacity, scale: rightScale }}
        >
          <button
            onClick={() => handleActionClick('version')}
            className="flex flex-col items-center justify-center gap-0.5 text-secondary-foreground p-2 touch-manipulation active:scale-95 transition-transform"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="text-[9px] font-medium leading-tight">Версия</span>
          </button>
        </motion.div>
      )}

      {/* Main content */}
      <motion.div
        drag="x"
        dragConstraints={{ 
          left: -ACTION_WIDTH, 
          right: hasMultipleVersions ? ACTION_WIDTH : 0 
        }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        style={{ x }}
        onTap={() => {
          if (isOpen) {
            closeSwipe();
          }
        }}
        className="relative bg-background touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
