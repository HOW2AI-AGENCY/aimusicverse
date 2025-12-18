import { memo } from 'react';
import { motion } from '@/lib/motion';
import { useNavigate } from 'react-router-dom';
import { useUserCredits, getLevelProgress, useLeaderboard } from '@/hooks/useGamification';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { useAuth } from '@/hooks/useAuth';
import { 
  Coins, ChevronRight, Flame, Zap, Trophy, 
  TrendingUp, TrendingDown, Music, Heart, Play 
} from 'lucide-react';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CompactStatsWidgetProps {
  className?: string;
}

export const CompactStatsWidget = memo(function CompactStatsWidget({ className }: CompactStatsWidgetProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: credits, isLoading: creditsLoading } = useUserCredits();
  const { data: analytics } = useAnalyticsData();
  const { data: leaderboard } = useLeaderboard(10);

  if (!user || creditsLoading) {
    return (
      <div className={cn("h-16 bg-muted/20 animate-pulse rounded-xl", className)} />
    );
  }

  const level = credits?.level || 1;
  const { progress, current: currentXP, next: nextLevelXP } = getLevelProgress(credits?.experience || 0);
  const streak = credits?.current_streak || 0;
  const balance = credits?.balance || 0;

  // Find user's rank
  const userRank = leaderboard?.findIndex(e => e.user_id === user.id);
  const rank = userRank !== undefined && userRank >= 0 ? userRank + 1 : null;

  // Weekly stats
  const weeklyTracks = analytics?.weeklySummary?.tracks || 0;
  const weeklyChange = analytics?.weeklySummary?.tracksChange || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-2 p-2 rounded-xl bg-card/60 backdrop-blur-sm border border-border/40",
        className
      )}
    >
      {/* Level Ring - Compact */}
      <motion.div 
        className="flex-shrink-0 cursor-pointer"
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/rewards')}
      >
        <ProgressRing value={progress} size="sm" color="gradient">
          <span className="text-[10px] font-bold">{level}</span>
        </ProgressRing>
      </motion.div>

      {/* Stats Row */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {/* Credits */}
        <StatBadge
          icon={<Coins className="w-3 h-3" />}
          value={balance}
          variant={balance < 20 ? 'danger' : 'warning'}
          onClick={() => navigate('/rewards')}
        />

        {/* XP */}
        <StatBadge
          icon={<Zap className="w-3 h-3" />}
          value={`${currentXP}/${nextLevelXP}`}
          variant="primary"
          onClick={() => navigate('/rewards')}
        />

        {/* Streak */}
        {streak > 0 && (
          <StatBadge
            icon={<Flame className="w-3 h-3" />}
            value={`${streak}д`}
            variant="streak"
          />
        )}

        {/* Rank */}
        {rank && (
          <StatBadge
            icon={<Trophy className="w-3 h-3" />}
            value={`#${rank}`}
            variant="rank"
            onClick={() => navigate('/leaderboard')}
          />
        )}

        {/* Weekly Activity */}
        {weeklyTracks > 0 && (
          <StatBadge
            icon={weeklyChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            value={weeklyTracks}
            variant={weeklyChange >= 0 ? 'success' : 'muted'}
            onClick={() => navigate('/analytics')}
          />
        )}
      </div>

      {/* Arrow */}
      <ChevronRight 
        className="w-4 h-4 text-muted-foreground flex-shrink-0 cursor-pointer hover:text-primary transition-colors" 
        onClick={() => navigate('/rewards')}
      />
    </motion.div>
  );
});

// Compact stat badge component
interface StatBadgeProps {
  icon: React.ReactNode;
  value: string | number;
  variant: 'primary' | 'warning' | 'danger' | 'streak' | 'rank' | 'success' | 'muted';
  onClick?: () => void;
}

const StatBadge = memo(function StatBadge({ icon, value, variant, onClick }: StatBadgeProps) {
  const variantStyles = {
    primary: 'bg-primary/10 text-primary',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-destructive/10 text-destructive',
    streak: 'bg-orange-500/10 text-orange-500',
    rank: 'bg-yellow-500/10 text-yellow-500',
    success: 'bg-green-500/10 text-green-500',
    muted: 'bg-muted/30 text-muted-foreground',
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap",
        variantStyles[variant],
        onClick && "cursor-pointer hover:opacity-80 transition-opacity"
      )}
      onClick={onClick}
    >
      {icon}
      <span className="tabular-nums">{value}</span>
    </div>
  );
});
