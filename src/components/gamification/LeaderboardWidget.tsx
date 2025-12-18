// LeaderboardWidget - Compact leaderboard for homepage
import { useMemo, memo } from 'react';
import { Crown, ChevronRight, User, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useLeaderboard, useUserCredits } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';

const RANK_COLORS = {
  1: 'from-yellow-500 to-amber-600',
  2: 'from-gray-300 to-gray-400',
  3: 'from-orange-400 to-orange-600',
};

export const LeaderboardWidget = memo(function LeaderboardWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: leaderboard, isLoading } = useLeaderboard(10);
  const { data: userCredits } = useUserCredits();

  // Find current user's position
  const userPosition = useMemo(() => {
    if (!user?.id || !leaderboard) return null;
    const index = leaderboard.findIndex(entry => entry.user_id === user.id);
    return index >= 0 ? index + 1 : null;
  }, [user?.id, leaderboard]);

  // Calculate XP needed for next rank
  const xpToNextRank = useMemo(() => {
    if (!userPosition || !leaderboard || userPosition <= 1) return null;
    const currentUser = leaderboard[userPosition - 1];
    const nextUser = leaderboard[userPosition - 2];
    if (!currentUser || !nextUser) return null;
    return nextUser.experience - currentUser.experience;
  }, [userPosition, leaderboard]);

  if (!user) return null;

  const topThree = leaderboard?.slice(0, 3) || [];

  return (
    <Card className="p-3 bg-gradient-to-br from-card/90 to-card/50 border-primary/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-500" />
          <h3 className="text-sm font-semibold">Лидеры</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 text-xs gap-1"
          onClick={() => navigate('/gamification')}
        >
          Все <ChevronRight className="w-3 h-3" />
        </Button>
      </div>

      {/* Top 3 compact */}
      <div className="flex items-end justify-center gap-2 mb-3">
        {topThree.map((entry, index) => {
          const position = index + 1;
          const isCurrentUser = entry.user_id === user?.id;
          
          return (
            <motion.div
              key={entry.user_id}
              className={cn(
                "flex flex-col items-center",
                position === 1 && "order-2",
                position === 2 && "order-1",
                position === 3 && "order-3"
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={cn(
                "relative",
                position === 1 && "mb-1"
              )}>
                {position === 1 && (
                  <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 text-yellow-500" />
                )}
                <Avatar className={cn(
                  "border-2",
                  position === 1 && "w-10 h-10 border-yellow-500",
                  position === 2 && "w-8 h-8 border-gray-400",
                  position === 3 && "w-8 h-8 border-orange-500",
                  isCurrentUser && "ring-2 ring-primary ring-offset-1"
                )}>
                  <AvatarImage src={entry.photo_url || undefined} />
                  <AvatarFallback className={cn(
                    "text-[10px] bg-gradient-to-br",
                    RANK_COLORS[position as keyof typeof RANK_COLORS] || 'from-primary/20 to-primary/10'
                  )}>
                    {entry.username?.[0]?.toUpperCase() || <User className="w-3 h-3" />}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <span className={cn(
                "text-[10px] font-bold mt-1",
                position === 1 && "text-yellow-500",
                position === 2 && "text-gray-400",
                position === 3 && "text-orange-500"
              )}>
                #{position}
              </span>
              
              <span className="text-[9px] text-muted-foreground truncate max-w-[50px]">
                {entry.username || 'User'}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Current user position */}
      {userPosition && (
        <motion.div
          className={cn(
            "flex items-center gap-2 p-2 rounded-lg",
            "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-sm font-bold text-primary">#{userPosition}</span>
          <div className="flex-1">
            <p className="text-xs font-medium">Твоя позиция</p>
            {xpToNextRank && xpToNextRank > 0 && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {xpToNextRank} XP до #{userPosition - 1}
              </p>
            )}
          </div>
          <span className="text-xs text-primary font-medium">
            {userCredits?.experience || 0} XP
          </span>
        </motion.div>
      )}

      {!userPosition && userCredits && (
        <div className="text-center py-2">
          <p className="text-[10px] text-muted-foreground">
            Набери больше XP, чтобы попасть в топ!
          </p>
          <p className="text-xs font-medium text-primary mt-1">
            {userCredits.experience || 0} XP
          </p>
        </div>
      )}
    </Card>
  );
});
