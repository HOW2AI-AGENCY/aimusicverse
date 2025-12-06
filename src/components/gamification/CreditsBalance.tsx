import { motion } from 'framer-motion';
import { useUserCredits } from '@/hooks/useGamification';
import { Coins, TrendingUp, Flame } from 'lucide-react';

interface CreditsBalanceProps {
  compact?: boolean;
  showStats?: boolean;
}

export function CreditsBalance({ compact = false, showStats = true }: CreditsBalanceProps) {
  const { data: credits, isLoading } = useUserCredits();

  if (isLoading) {
    return <div className={`${compact ? 'h-6 w-16' : 'h-20'} bg-muted animate-pulse rounded-md`} />;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-sm">
        <Coins className="w-4 h-4 text-yellow-500" />
        <span className="font-semibold">{credits?.balance || 0}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Coins className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Баланс</p>
            <p className="text-2xl font-bold">{credits?.balance || 0}</p>
          </div>
        </div>
      </div>

      {showStats && (
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Заработано</p>
              <p className="font-medium">{credits?.total_earned || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Макс. серия</p>
              <p className="font-medium">{credits?.longest_streak || 0} дней</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
