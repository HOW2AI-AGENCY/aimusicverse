import { motion, AnimatePresence } from '@/lib/motion';
import { useEffect, useState } from 'react';
import { Coins, Sparkles, Star, Flame, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RewardCelebrationProps {
  show: boolean;
  credits?: number;
  experience?: number;
  streak?: number;
  achievementName?: string;
  levelUp?: number;
  onComplete?: () => void;
}

// Generate random particle positions outside of component to ensure purity
const generateParticlePositions = () => 
  Array.from({ length: 8 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
  }));

export function RewardCelebration({
  show,
  credits = 0,
  experience = 0,
  streak,
  achievementName,
  levelUp,
  onComplete,
}: RewardCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [particlePositions] = useState(generateParticlePositions);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (show) {
      setIsVisible(true);

      // Trigger confetti for level up or achievements
      if (levelUp || achievementName) {
        const duration = 2000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#FFD700', '#FFA500', '#FF6347', '#9370DB', '#00CED1'],
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#FFD700', '#FFA500', '#FF6347', '#9370DB', '#00CED1'],
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
      }

      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, levelUp, achievementName, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: -50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-card/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-primary/30 max-w-sm mx-4"
          >
            {/* Level Up */}
            {levelUp && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-center mb-4"
              >
                <div className="relative inline-block">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 bg-gradient-to-r from-primary via-yellow-500 to-primary rounded-full blur-xl opacity-50"
                  />
                  <div className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-lg">
                    {levelUp}
                  </div>
                </div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl font-bold mt-4 bg-gradient-to-r from-primary to-yellow-500 bg-clip-text text-transparent"
                >
                  Новый уровень!
                </motion.h2>
              </motion.div>
            )}

            {/* Achievement */}
            {achievementName && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-center mb-4"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg"
                >
                  <Trophy className="w-8 h-8 text-yellow-900" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg font-bold mt-3"
                >
                  Достижение разблокировано!
                </motion.h2>
                <p className="text-muted-foreground text-sm mt-1">{achievementName}</p>
              </motion.div>
            )}

            {/* Rewards */}
            <div className="space-y-3">
              {credits > 0 && (
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-center gap-3 bg-primary/10 rounded-lg p-3"
                >
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: 2 }}
                  >
                    <Coins className="w-6 h-6 text-yellow-500" />
                  </motion.div>
                  <motion.span
                    initial={{ scale: 0.5 }}
                    animate={{ scale: [0.5, 1.3, 1] }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="text-xl font-bold text-yellow-500"
                  >
                    +{credits}
                  </motion.span>
                  <span className="text-muted-foreground">кредитов</span>
                </motion.div>
              )}

              {experience > 0 && (
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center gap-3 bg-primary/10 rounded-lg p-3"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: 2 }}
                  >
                    <Sparkles className="w-6 h-6 text-primary" />
                  </motion.div>
                  <motion.span
                    initial={{ scale: 0.5 }}
                    animate={{ scale: [0.5, 1.3, 1] }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="text-xl font-bold text-primary"
                  >
                    +{experience}
                  </motion.span>
                  <span className="text-muted-foreground">опыта</span>
                </motion.div>
              )}

              {streak && streak > 1 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center gap-2 text-orange-500"
                >
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <Flame className="w-5 h-5" />
                  </motion.div>
                  <span className="font-semibold">День {streak}</span>
                </motion.div>
              )}
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {particlePositions.map((pos, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: '50%', 
                    y: '50%', 
                    scale: 0,
                    opacity: 0 
                  }}
                  animate={{ 
                    x: `${pos.x}%`,
                    y: `${pos.y}%`,
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                  className="absolute"
                >
                  <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
