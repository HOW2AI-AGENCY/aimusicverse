/**
 * UnifiedRewardNotification - Consolidated notification for all gamification rewards
 * 
 * Replaces: LevelUpNotification, AchievementUnlockNotification, RewardCelebration
 * 
 * Supports:
 * - Level up notifications
 * - Achievement unlocks
 * - Credit rewards
 * - Experience rewards
 * - Streak celebrations
 * - Welcome bonuses
 * - Subscription success
 */

import { motion, AnimatePresence } from '@/lib/motion';
import { useEffect, useState, memo, useCallback } from 'react';
import { 
  Coins, 
  Sparkles, 
  Star, 
  Flame, 
  Trophy, 
  Crown,
  Zap,
  Gift,
  TrendingUp,
  X,
  PartyPopper,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============= Types =============

export type RewardNotificationType = 
  | 'level_up'
  | 'achievement'
  | 'credits'
  | 'experience'
  | 'streak'
  | 'welcome_bonus'
  | 'subscription';

export interface RewardNotificationData {
  type: RewardNotificationType;
  
  // Common
  title?: string;
  description?: string;
  
  // Level up
  level?: number;
  levelTitle?: string;
  
  // Achievement
  achievementName?: string;
  achievementIcon?: string;
  
  // Credits/XP
  credits?: number;
  experience?: number;
  
  // Streak
  streak?: number;
  
  // Welcome bonus
  welcomeBonus?: number;
  
  // Subscription
  subscriptionTier?: 'pro' | 'premium';
  subscriptionCredits?: number;
  subscriptionFeatures?: string[];
  
  // Behavior
  autoClose?: boolean;
  autoCloseDelay?: number;
  showConfetti?: boolean;
  requireDismiss?: boolean;
}

interface UnifiedRewardNotificationProps {
  data: RewardNotificationData | null;
  onComplete?: () => void;
}

// ============= Constants =============

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

const SUBSCRIPTION_INFO = {
  pro: {
    name: 'PRO',
    icon: Zap,
    gradient: 'from-blue-500 to-cyan-500',
  },
  premium: {
    name: 'PREMIUM',
    icon: Crown,
    gradient: 'from-amber-500 to-orange-500',
  },
};

const DEFAULT_AUTO_CLOSE_DELAY = 4000;

// ============= Utils =============

const getLevelGradient = (level: number): string => {
  if (level >= 10) return LEVEL_COLORS[10];
  return LEVEL_COLORS[level] || LEVEL_COLORS[1];
};

const generateParticlePositions = () => 
  Array.from({ length: 8 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
  }));

const triggerConfetti = (variant: 'burst' | 'sides' | 'stars' = 'sides') => {
  const colors = ['#FFD700', '#FFA500', '#FF6347', '#9370DB', '#00CED1', '#8B5CF6', '#EC4899'];
  
  if (variant === 'burst') {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    });
  } else if (variant === 'sides') {
    const duration = 2000;
    const end = Date.now() + duration;
    
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }
};

// ============= Sub-Components =============

const FloatingParticles = memo(function FloatingParticles() {
  const [positions] = useState(generateParticlePositions);
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {positions.map((pos, i) => (
        <motion.div
          key={i}
          initial={{ x: '50%', y: '50%', scale: 0, opacity: 0 }}
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
  );
});

const RewardRow = memo(function RewardRow({ 
  icon: Icon, 
  value, 
  label, 
  color,
  delay = 0.3,
}: { 
  icon: typeof Coins; 
  value: number; 
  label: string; 
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay }}
      className={cn("flex items-center justify-center gap-3 bg-primary/10 rounded-lg p-3")}
    >
      <motion.div
        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 0.5, repeat: 2 }}
      >
        <Icon className={cn("w-6 h-6", color)} />
      </motion.div>
      <motion.span
        initial={{ scale: 0.5 }}
        animate={{ scale: [0.5, 1.3, 1] }}
        transition={{ delay: delay + 0.1, duration: 0.4 }}
        className={cn("text-xl font-bold", color)}
      >
        +{value}
      </motion.span>
      <span className="text-muted-foreground">{label}</span>
    </motion.div>
  );
});

// ============= Main Component =============

export const UnifiedRewardNotification = memo(function UnifiedRewardNotification({
  data,
  onComplete,
}: UnifiedRewardNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  const handleClose = useCallback(() => {
    setIsVisible(false);
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (!data) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    
    // Trigger confetti if enabled
    if (data.showConfetti !== false) {
      const confettiVariant = 
        data.type === 'welcome_bonus' || data.type === 'subscription' ? 'burst' : 'sides';
      setTimeout(() => triggerConfetti(confettiVariant), 300);
    }

    // Auto-close logic
    if (data.autoClose !== false && !data.requireDismiss) {
      const delay = data.autoCloseDelay || DEFAULT_AUTO_CLOSE_DELAY;
      const timer = setTimeout(handleClose, delay);
      return () => clearTimeout(timer);
    }
  }, [data, handleClose]);

  if (!data) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center",
            data.requireDismiss 
              ? "bg-black/50 backdrop-blur-sm" 
              : "pointer-events-none"
          )}
          onClick={data.requireDismiss ? handleClose : undefined}
        >
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: -50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={cn(
              "bg-card/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-primary/30 max-w-sm mx-4 relative",
              data.requireDismiss && "pointer-events-auto"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button for dismissable notifications */}
            {data.requireDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleClose}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            
            {/* Render based on type */}
            <NotificationContent data={data} onClose={handleClose} />
            
            {/* Floating particles */}
            <FloatingParticles />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// ============= Content Renderer =============

const NotificationContent = memo(function NotificationContent({ 
  data, 
  onClose 
}: { 
  data: RewardNotificationData;
  onClose: () => void;
}) {
  switch (data.type) {
    case 'level_up':
      return <LevelUpContent data={data} />;
    case 'achievement':
      return <AchievementContent data={data} onClose={onClose} />;
    case 'welcome_bonus':
      return <WelcomeBonusContent data={data} onClose={onClose} />;
    case 'subscription':
      return <SubscriptionContent data={data} onClose={onClose} />;
    default:
      return <GenericRewardContent data={data} />;
  }
});

// ============= Type-Specific Content =============

const LevelUpContent = memo(function LevelUpContent({ data }: { data: RewardNotificationData }) {
  const level = data.level || 1;
  
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="relative inline-block mb-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className={cn(
            "absolute inset-0 bg-gradient-to-r rounded-full blur-xl opacity-50",
            getLevelGradient(level)
          )}
        />
        <div className={cn(
          "relative w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-lg bg-gradient-to-br",
          getLevelGradient(level)
        )}>
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
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center gap-2 mb-2"
      >
        <TrendingUp className="w-4 h-4 text-green-500" />
        <span className="text-sm font-medium text-muted-foreground">Новый уровень!</span>
      </motion.div>
      
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-xl font-bold bg-gradient-to-r from-primary to-yellow-500 bg-clip-text text-transparent"
      >
        {data.levelTitle || `Уровень ${level}`}
      </motion.h2>
      
      {/* Rewards */}
      <div className="mt-4 space-y-2">
        {data.credits && data.credits > 0 && (
          <RewardRow icon={Coins} value={data.credits} label="кредитов" color="text-yellow-500" delay={0.5} />
        )}
        {data.experience && data.experience > 0 && (
          <RewardRow icon={Sparkles} value={data.experience} label="опыта" color="text-primary" delay={0.6} />
        )}
      </div>
    </div>
  );
});

const AchievementContent = memo(function AchievementContent({ 
  data, 
  onClose 
}: { 
  data: RewardNotificationData;
  onClose: () => void;
}) {
  return (
    <div className="text-center">
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
            <span className="text-4xl">{data.achievementIcon || '🏆'}</span>
          </motion.div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-yellow-500/30"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-4"
      >
        <div className="flex items-center justify-center gap-2 text-yellow-500 mb-2">
          <Trophy className="w-4 h-4" />
          <span className="text-sm font-medium">Достижение разблокировано!</span>
        </div>
        <h2 className="text-xl font-bold">{data.achievementName || data.title}</h2>
        {data.description && (
          <p className="text-sm text-muted-foreground mt-1">{data.description}</p>
        )}
      </motion.div>

      {/* Rewards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-center gap-4 mb-4"
      >
        {data.credits && data.credits > 0 && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-lg"
          >
            <Coins className="w-5 h-5 text-yellow-500" />
            <span className="font-bold text-yellow-500">+{data.credits}</span>
          </motion.div>
        )}
        {data.experience && data.experience > 0 && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg"
          >
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-bold text-primary">+{data.experience} XP</span>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button onClick={onClose} className="w-full">
          Отлично!
        </Button>
      </motion.div>
    </div>
  );
});

const WelcomeBonusContent = memo(function WelcomeBonusContent({ 
  data, 
  onClose 
}: { 
  data: RewardNotificationData;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center">
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
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-2 -right-2"
        >
          <PartyPopper className="w-8 h-8 text-amber-500" />
        </motion.div>
      </motion.div>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold mb-2"
      >
        Добро пожаловать! 🎉
      </motion.h2>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground mb-6"
      >
        Мы рады тебя видеть в MusicVerse AI!
      </motion.p>

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
              +{data.welcomeBonus || data.credits || 50} 💎
            </span>
          </motion.div>
        </div>
      </motion.div>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-sm text-muted-foreground mb-6"
      >
        Используй кредиты для создания музыки с помощью AI!
      </motion.p>

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
    </div>
  );
});

const SubscriptionContent = memo(function SubscriptionContent({ 
  data, 
  onClose 
}: { 
  data: RewardNotificationData;
  onClose: () => void;
}) {
  const tier = data.subscriptionTier || 'pro';
  const info = SUBSCRIPTION_INFO[tier];
  const Icon = info.icon;
  
  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br mb-6",
          info.gradient
        )}
      >
        <Icon className="w-10 h-10 text-white" />
      </motion.div>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold mb-2"
      >
        Добро пожаловать в {info.name}! 🎉
      </motion.h2>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, type: 'spring' }}
        className="mb-6 px-6 py-3 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20"
      >
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500" />
          <span className="text-xl font-bold">+{data.subscriptionCredits || data.credits} кредитов</span>
        </div>
      </motion.div>

      {data.subscriptionFeatures && data.subscriptionFeatures.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full mb-6"
        >
          <p className="text-sm text-muted-foreground mb-3">
            Теперь тебе доступно:
          </p>
          <ul className="space-y-2 text-left">
            {data.subscriptionFeatures.map((feature, i) => (
              <motion.li
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-center gap-2 text-sm"
              >
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>{feature}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Button
          onClick={onClose}
          className={cn("px-8 bg-gradient-to-r", info.gradient)}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Начать творить!
        </Button>
      </motion.div>
    </div>
  );
});

const GenericRewardContent = memo(function GenericRewardContent({ 
  data 
}: { 
  data: RewardNotificationData;
}) {
  return (
    <div className="text-center">
      {/* Title */}
      {data.title && (
        <motion.h2
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-xl font-bold mb-4 bg-gradient-to-r from-primary to-yellow-500 bg-clip-text text-transparent"
        >
          {data.title}
        </motion.h2>
      )}

      {/* Description */}
      {data.description && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mb-4"
        >
          {data.description}
        </motion.p>
      )}

      {/* Rewards */}
      <div className="space-y-3">
        {data.credits && data.credits > 0 && (
          <RewardRow icon={Coins} value={data.credits} label="кредитов" color="text-yellow-500" delay={0.3} />
        )}
        {data.experience && data.experience > 0 && (
          <RewardRow icon={Sparkles} value={data.experience} label="опыта" color="text-primary" delay={0.4} />
        )}
        {data.streak && data.streak > 1 && (
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
            <span className="font-semibold">День {data.streak}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
});

export default UnifiedRewardNotification;
