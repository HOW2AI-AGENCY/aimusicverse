/**
 * WelcomeBonusPopup - Animated welcome popup for new users
 * Shows +50 credits bonus with confetti animation
 */

import { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Gift, PartyPopper } from 'lucide-react';
import { ECONOMY } from '@/lib/economy';
import confetti from 'canvas-confetti';

interface WelcomeBonusPopupProps {
  open: boolean;
  onClose: () => void;
}

export const WelcomeBonusPopup = memo(function WelcomeBonusPopup({
  open,
  onClose,
}: WelcomeBonusPopupProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (open) {
      // Delay content appearance for dramatic effect
      const timer = setTimeout(() => setShowContent(true), 300);
      
      // Fire confetti
      const fireConfetti = () => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981'],
        });
      };
      
      const confettiTimer = setTimeout(fireConfetti, 500);
      
      // Auto-close after 6 seconds
      const closeTimer = setTimeout(onClose, 6000);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(confettiTimer);
        clearTimeout(closeTimer);
      };
    } else {
      setShowContent(false);
    }
  }, [open, onClose]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', damping: 15 }}
              className="flex flex-col items-center text-center py-6"
            >
              {/* Icon */}
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="relative mb-6"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <Gift className="w-10 h-10 text-primary" />
                </div>
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-2 -right-2"
                >
                  <PartyPopper className="w-8 h-8 text-amber-500" />
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold mb-2"
              >
                Добро пожаловать! 🎉
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground mb-6"
              >
                Мы рады тебя видеть в MusicVerse AI!
              </motion.p>

              {/* Bonus Display */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', damping: 10 }}
                className="relative mb-6"
              >
                <div className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 border border-primary/30">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex items-center gap-3"
                  >
                    <Sparkles className="w-6 h-6 text-amber-500" />
                    <span className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                      +{ECONOMY.WELCOME_BONUS} 💎
                    </span>
                  </motion.div>
                </div>
                
                {/* Floating particles */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-primary/60"
                    initial={{ 
                      x: 0, 
                      y: 0,
                      opacity: 0 
                    }}
                    animate={{ 
                      x: [0, (i - 2) * 30],
                      y: [0, -40 - i * 10],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                    style={{
                      left: '50%',
                      top: '50%',
                    }}
                  />
                ))}
              </motion.div>

              {/* Description */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-sm text-muted-foreground mb-6"
              >
                Используй кредиты для создания музыки с помощью AI!
              </motion.p>

              {/* CTA Button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  onClick={onClose}
                  className="px-8 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                >
                  Начать творить! 🎵
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
});
