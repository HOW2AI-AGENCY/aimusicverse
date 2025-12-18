// DoubleTapLike - Instagram-style double-tap to like with heart animation
import { useState, useRef, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLikeTrack } from '@/hooks/engagement/useLikeTrack';
import { useAuth } from '@/hooks/useAuth';
import { useTelegram } from '@/contexts/TelegramContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DoubleTapLikeProps {
  trackId: string;
  children: React.ReactNode;
  className?: string;
  onSingleTap?: () => void;
}

export function DoubleTapLike({ trackId, children, className, onSingleTap }: DoubleTapLikeProps) {
  const { user } = useAuth();
  const { hapticFeedback } = useTelegram();
  const { isLiked, toggleLike } = useLikeTrack(trackId);
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef<number>(0);
  const singleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    // Clear pending single tap
    if (singleTapTimeoutRef.current) {
      clearTimeout(singleTapTimeoutRef.current);
      singleTapTimeoutRef.current = null;
    }

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      e.stopPropagation();
      e.preventDefault();
      
      if (!user) {
        toast.error('Войдите, чтобы ставить лайки');
        return;
      }

      // Show heart animation
      setShowHeart(true);
      hapticFeedback('medium');

      // Only like if not already liked
      if (!isLiked) {
        toggleLike();
      }

      // Hide heart after animation
      setTimeout(() => setShowHeart(false), 1000);
      
      lastTapRef.current = 0;
    } else {
      // First tap - wait to see if it's a double tap
      lastTapRef.current = now;
      
      singleTapTimeoutRef.current = setTimeout(() => {
        onSingleTap?.();
        singleTapTimeoutRef.current = null;
      }, DOUBLE_TAP_DELAY);
    }
  }, [user, isLiked, toggleLike, hapticFeedback, onSingleTap]);

  return (
    <div 
      className={cn("relative", className)}
      onClick={handleTap}
    >
      {children}
      
      {/* Instagram-style heart animation */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ 
                scale: [0, 1.3, 1, 1.1, 1],
                rotate: [0, -10, 10, -5, 0]
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                duration: 0.6,
                times: [0, 0.2, 0.4, 0.6, 1]
              }}
            >
              <Heart 
                className="w-20 h-20 text-red-500 fill-red-500 drop-shadow-lg"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.5))'
                }}
              />
            </motion.div>
            
            {/* Particles effect */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-red-400 rounded-full"
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 0,
                  opacity: 1 
                }}
                animate={{ 
                  x: Math.cos(i * 60 * Math.PI / 180) * 60,
                  y: Math.sin(i * 60 * Math.PI / 180) * 60,
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0]
                }}
                transition={{ 
                  duration: 0.6,
                  delay: 0.1
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
