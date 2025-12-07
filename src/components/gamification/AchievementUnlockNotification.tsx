import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Coins, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AchievementUnlockNotificationProps {
  show: boolean;
  name: string;
  description: string;
  icon: string;
  creditsReward: number;
  experienceReward: number;
  onClose: () => void;
}

export function AchievementUnlockNotification({
  show,
  name,
  description,
  icon,
  creditsReward,
  experienceReward,
  onClose,
}: AchievementUnlockNotificationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative bg-card rounded-2xl p-6 max-w-sm mx-4 shadow-2xl border border-primary/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Trophy animation */}
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex justify-center mb-4"
            >
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg"
                >
                  <span className="text-4xl">{icon}</span>
                </motion.div>
                
                {/* Glow ring */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-yellow-500/30"
                />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-4"
            >
              <div className="flex items-center justify-center gap-2 text-yellow-500 mb-2">
                <Trophy className="w-4 h-4" />
                <span className="text-sm font-medium">Достижение разблокировано!</span>
              </div>
              <h2 className="text-xl font-bold">{name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </motion.div>

            {/* Rewards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center gap-4"
            >
              {creditsReward > 0 && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-lg"
                >
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="font-bold text-yellow-500">+{creditsReward}</span>
                </motion.div>
              )}
              {experienceReward > 0 && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg"
                >
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="font-bold text-primary">+{experienceReward} XP</span>
                </motion.div>
              )}
            </motion.div>

            {/* Action button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6"
            >
              <Button onClick={onClose} className="w-full">
                Отлично!
              </Button>
            </motion.div>

            {/* Floating stars */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: '50%', y: '50%' }}
                animate={{
                  scale: [0, 1, 0],
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
                className="absolute pointer-events-none"
              >
                <Sparkles className="w-3 h-3 text-yellow-400" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
