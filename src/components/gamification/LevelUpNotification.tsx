import { motion, AnimatePresence } from 'framer-motion';
import { Star, TrendingUp, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LevelUpNotificationProps {
  level: number;
  title: string;
  show: boolean;
  onComplete?: () => void;
}

const LEVEL_COLORS: Record<number, string> = {
  1: 'from-gray-400 to-gray-600',
  2: 'from-green-400 to-green-600',
  3: 'from-blue-400 to-blue-600',
  4: 'from-purple-400 to-purple-600',
  5: 'from-yellow-400 to-yellow-600',
  6: 'from-orange-400 to-orange-600',
  7: 'from-red-400 to-red-600',
  8: 'from-pink-400 to-pink-600',
  9: 'from-indigo-400 to-indigo-600',
  10: 'from-amber-300 via-yellow-400 to-amber-500',
};

function getLevelGradient(level: number): string {
  if (level >= 10) return LEVEL_COLORS[10];
  return LEVEL_COLORS[level] || LEVEL_COLORS[1];
}

export function LevelUpNotification({ level, title, show, onComplete }: LevelUpNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const handleShow = () => {
      if (show && mounted) {
        setIsVisible(true);
        const timer = setTimeout(() => {
          if (mounted) {
            setIsVisible(false);
            onComplete?.();
          }
        }, 4000);
        return timer;
      }
    };

    const timer = handleShow();
    
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={`relative bg-gradient-to-r ${getLevelGradient(level)} rounded-2xl p-1 shadow-2xl`}
          >
            <div className="bg-card/95 backdrop-blur-sm rounded-xl px-6 py-4">
              <div className="flex items-center gap-4">
                {/* Level Badge */}
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="relative"
                >
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getLevelGradient(level)} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                    {level}
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute -top-1 -right-1"
                  >
                    <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
                  </motion.div>
                </motion.div>

                {/* Text */}
                <div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-muted-foreground">Новый уровень!</span>
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-lg font-bold"
                  >
                    {title}
                  </motion.h3>
                </div>

                {/* Sparkles */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </motion.div>
              </div>
            </div>

            {/* Glow effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`absolute inset-0 bg-gradient-to-r ${getLevelGradient(level)} rounded-2xl blur-xl -z-10`}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
