import { useNavigate } from 'react-router-dom';
import { motion } from '@/lib/motion';
import { Crown, ChevronRight, Trophy, Music, Share2, Heart, Headphones } from 'lucide-react';
import { useLeaderboard, LEADERBOARD_CATEGORIES, LeaderboardCategory } from '@/hooks/useGamification';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const getCategoryIcon = (category: LeaderboardCategory) => {
  switch (category) {
    case 'generators': return <Music className="w-3 h-3" />;
    case 'sharers': return <Share2 className="w-3 h-3" />;
    case 'popular': return <Heart className="w-3 h-3" />;
    case 'listeners': return <Headphones className="w-3 h-3" />;
    default: return <Crown className="w-3 h-3" />;
  }
};

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1: return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/30';
    case 2: return 'bg-gradient-to-r from-slate-400/20 to-slate-300/10 border-slate-400/30';
    case 3: return 'bg-gradient-to-r from-orange-600/20 to-orange-500/10 border-orange-600/30';
    default: return 'bg-card/50 border-border/50';
  }
};

const getRankBadge = (rank: number) => {
  switch (rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return `#${rank}`;
  }
};

export function LeaderboardSection() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<LeaderboardCategory>('overall');
  const { data: leaderboard, isLoading } = useLeaderboard(5, category);

  const categories: LeaderboardCategory[] = ['overall', 'generators', 'popular'];

  if (isLoading) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-semibold">Топ участников</h2>
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-500/10 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Топ участников</h2>
            <p className="text-[10px] text-muted-foreground">Лидеры сообщества</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/rewards')}
          className="text-xs text-muted-foreground hover:text-primary gap-1 h-8"
        >
          Все
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors shrink-0",
              category === cat 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            {getCategoryIcon(cat)}
            {LEADERBOARD_CATEGORIES[cat].label}
          </button>
        ))}
      </div>

      {/* Leaderboard List - Compact */}
      <div className="space-y-1.5">
        {leaderboard?.slice(0, 5).map((entry, index) => (
          <motion.div
            key={entry.user_id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(`/profile/${entry.user_id}`)}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:scale-[1.01] transition-transform",
              getRankStyle(Number(entry.rank))
            )}
          >
            {/* Rank */}
            <div className="w-6 text-center text-sm font-bold">
              {getRankBadge(Number(entry.rank))}
            </div>

            {/* Avatar */}
            <Avatar className="w-7 h-7">
              <AvatarImage src={entry.photo_url || undefined} />
              <AvatarFallback className="text-[10px] bg-muted">
                {entry.username?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>

            {/* Name & Level */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{entry.username || 'Аноним'}</p>
              <p className="text-[10px] text-muted-foreground">Ур. {entry.level}</p>
            </div>

            {/* Score */}
            <div className="text-right">
              <p className="text-xs font-semibold text-primary">{entry.experience.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">XP</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View All Button */}
      <Button
        variant="outline"
        className="w-full mt-3 rounded-lg border-dashed h-9 text-xs"
        onClick={() => navigate('/rewards')}
      >
        <Trophy className="w-3.5 h-3.5 mr-2" />
        Полная таблица лидеров
        <ChevronRight className="w-4 h-4 ml-auto" />
      </Button>
    </section>
  );
}