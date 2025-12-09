import { motion } from '@/lib/motion';
import { useUserCredits } from '@/hooks/useGamification';
import { Coins, TrendingUp, Flame, Sparkles, Star } from 'lucide-react';

interface CreditsBalanceProps {
  compact?: boolean;
  showStats?: boolean;
}

export function CreditsBalance({ compact = false, showStats = true }: CreditsBalanceProps) {
  const { data: credits, isLoading } = useUserCredits();

  if (isLoading) {
    return <div className={`${compact ? 'h-8 w-20' : 'h-20'} bg-muted animate-pulse rounded-md`} />;
  }

  if (compact) {
    return (
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <Coins className="w-4 h-4 text-yellow-500" />
        </motion.div>
        <span className="font-bold text-yellow-600 dark:text-yellow-400">
          {credits?.balance || 0}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-yellow-500/10 border border-yellow-500/20 relative overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute top-2 right-2 opacity-10">
        <Star className="w-16 h-16 text-yellow-500" />
      </div>

      <div className="relative flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 15 }}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg"
          >
            <Coins className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <p className="text-sm text-muted-foreground">Баланс кредитов</p>
            <motion.p 
              key={credits?.balance}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent"
            >
              {credits?.balance || 0}
            </motion.p>
          </div>
        </div>
      </div>

      {showStats && (
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-yellow-500/10">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 bg-green-500/5 p-2 rounded-lg"
          >
            <TrendingUp className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-[10px] text-muted-foreground">Заработано</p>
              <p className="font-semibold text-sm">{credits?.total_earned || 0}</p>
            </div>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 bg-orange-500/5 p-2 rounded-lg"
          >
            <Flame className="w-4 h-4 text-orange-500" />
            <div>
              <p className="text-[10px] text-muted-foreground">Макс. серия</p>
              <p className="font-semibold text-sm">{credits?.longest_streak || 0}</p>
            </div>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 bg-primary/5 p-2 rounded-lg"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground">Опыт</p>
              <p className="font-semibold text-sm">{credits?.experience || 0}</p>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
