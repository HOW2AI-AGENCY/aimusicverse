import { useState } from 'react';
import { motion } from '@/lib/motion';
import { useLeaderboard, LeaderboardCategory, LEADERBOARD_CATEGORIES } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Medal, Award, Flame, Star, Music, Share2, Heart, Headphones } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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

const getCategoryIcon = (category: LeaderboardCategory) => {
  switch (category) {
    case 'generators':
      return <Music className="w-3 h-3" />;
    case 'sharers':
      return <Share2 className="w-3 h-3" />;
    case 'popular':
      return <Heart className="w-3 h-3" />;
    case 'listeners':
      return <Headphones className="w-3 h-3" />;
    default:
      return <Star className="w-3 h-3" />;
  }
};

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string | null;
  photo_url: string | null;
  level: number;
  experience: number;
  total_earned: number;
  current_streak: number;
  achievements_count: number;
  total_tracks: number;
  total_shares: number;
  total_likes_received: number;
  total_plays: number;
}

const getCategoryStat = (entry: LeaderboardEntry, category: LeaderboardCategory) => {
  switch (category) {
    case 'generators':
      return { value: entry.total_tracks, label: 'треков' };
    case 'sharers':
      return { value: entry.total_shares, label: 'шеров' };
    case 'popular':
      return { value: entry.total_likes_received, label: 'лайков' };
    case 'listeners':
      return { value: entry.total_plays, label: 'прослуш.' };
    default:
      return { value: entry.experience, label: 'XP' };
  }
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

interface LeaderboardProps {
  limit?: number;
}

export function Leaderboard({ limit = 20 }: LeaderboardProps) {
  const [category, setCategory] = useState<LeaderboardCategory>('overall');
  const { data: leaderboard, isLoading } = useLeaderboard(limit, category);
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
    <div className="space-y-4">
      {/* Category Tabs */}
      <ScrollArea className="w-full whitespace-nowrap">
        <Tabs value={category} onValueChange={(v) => setCategory(v as LeaderboardCategory)}>
          <TabsList className="inline-flex h-9 w-max">
            {Object.entries(LEADERBOARD_CATEGORIES).map(([key, { label, icon }]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="text-xs px-3 gap-1.5"
              >
                <span>{icon}</span>
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Leaderboard List */}
      <div className="space-y-2">
        {leaderboard.map((entry, index) => {
          const isCurrentUser = entry.user_id === user?.id;
          const rankIcon = getRankIcon(Number(entry.rank));
          const rankBg = getRankBg(Number(entry.rank));
          const stat = getCategoryStat(entry, category);

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
                        {entry.current_streak > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 text-orange-500">
                              <Flame className="w-3 h-3" />
                              {entry.current_streak}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Category-specific stat */}
                    <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1.5 rounded-full">
                      {getCategoryIcon(category)}
                      <span className="text-sm font-semibold">{formatNumber(stat.value)}</span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">{stat.label}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
