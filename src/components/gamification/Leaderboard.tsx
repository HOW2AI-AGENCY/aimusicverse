import { motion } from 'framer-motion';
import { useLeaderboard } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Medal, Award, Flame, Star } from 'lucide-react';

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-500" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Award className="w-5 h-5 text-amber-600" />;
    default:
      return null;
  }
};

const getRankBg = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/30';
    case 2:
      return 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30';
    case 3:
      return 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-amber-500/30';
    default:
      return '';
  }
};

interface LeaderboardProps {
  limit?: number;
}

export function Leaderboard({ limit = 20 }: LeaderboardProps) {
  const { data: leaderboard, isLoading } = useLeaderboard(limit);
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Лидерборд пуст</p>
        <p className="text-sm">Будь первым!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {leaderboard.map((entry, index) => {
        const isCurrentUser = entry.user_id === user?.id;
        const rankIcon = getRankIcon(Number(entry.rank));
        const rankBg = getRankBg(Number(entry.rank));

        return (
          <motion.div
            key={entry.user_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`transition-all ${rankBg} ${isCurrentUser ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 text-center font-bold text-lg">
                    {rankIcon || entry.rank}
                  </div>
                  
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={entry.photo_url || undefined} />
                    <AvatarFallback>
                      {entry.username?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                        {entry.username || 'Аноним'}
                      </span>
                      {isCurrentUser && (
                        <Badge variant="secondary" className="text-xs">Вы</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Уровень {entry.level}</span>
                      <span>•</span>
                      <span>{entry.experience} XP</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {entry.current_streak > 0 && (
                      <div className="flex items-center gap-1 text-orange-500">
                        <Flame className="w-3 h-3" />
                        <span className="text-xs font-medium">{entry.current_streak}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs">{entry.achievements_count}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
