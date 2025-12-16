/**
 * Popular Creators Section - Shows top music creators on homepage
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Crown, TrendingUp, Music2, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useTelegram } from '@/contexts/TelegramContext';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface PopularCreator {
  user_id: string;
  first_name: string;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  display_name: string | null;
  bio: string | null;
  tracks_count: number;
  total_likes: number;
  followers_count: number;
}

interface PopularCreatorsSectionProps {
  className?: string;
  maxCreators?: number;
}

export function PopularCreatorsSection({ className, maxCreators = 10 }: PopularCreatorsSectionProps) {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();

  const { data: creators, isLoading } = useQuery({
    queryKey: ['popular-creators', maxCreators],
    queryFn: async (): Promise<PopularCreator[]> => {
      // Get creators with public tracks, sorted by likes and track count
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('user_id, likes_count')
        .eq('is_public', true)
        .eq('status', 'completed');

      if (tracksError) throw tracksError;

      // Aggregate by user
      const userStats = new Map<string, { tracks: number; likes: number }>();
      tracksData?.forEach(track => {
        const stats = userStats.get(track.user_id) || { tracks: 0, likes: 0 };
        stats.tracks += 1;
        stats.likes += track.likes_count || 0;
        userStats.set(track.user_id, stats);
      });

      // Get user IDs sorted by popularity (tracks + likes)
      const sortedUsers = Array.from(userStats.entries())
        .sort((a, b) => (b[1].tracks + b[1].likes) - (a[1].tracks + a[1].likes))
        .slice(0, maxCreators)
        .map(([userId]) => userId);

      if (sortedUsers.length === 0) return [];

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, username, photo_url, display_name, bio, followers_count')
        .in('user_id', sortedUsers)
        .eq('is_public', true);

      if (profilesError) throw profilesError;

      // Combine data
      return sortedUsers
        .map(userId => {
          const profile = profiles?.find(p => p.user_id === userId);
          const stats = userStats.get(userId);
          if (!profile) return null;
          return {
            user_id: userId,
            first_name: profile.first_name,
            last_name: profile.last_name,
            username: profile.username,
            photo_url: profile.photo_url,
            display_name: profile.display_name,
            bio: profile.bio,
            tracks_count: stats?.tracks || 0,
            total_likes: stats?.likes || 0,
            followers_count: profile.followers_count || 0,
          };
        })
        .filter((c): c is PopularCreator => c !== null);
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleCreatorClick = (userId: string) => {
    hapticFeedback?.('light');
    navigate(`/profile/${userId}`);
  };

  if (isLoading) {
    return (
      <section className={cn('space-y-4', className)}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-32 h-44 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (!creators || creators.length === 0) {
    return null;
  }

  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20">
          <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold">Топ создатели</h2>
          <p className="text-xs text-muted-foreground">Лучшие авторы сообщества</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3">
        {creators.map((creator, index) => (
          <CreatorCard 
            key={creator.user_id} 
            creator={creator} 
            rank={index + 1}
            onClick={() => handleCreatorClick(creator.user_id)}
          />
        ))}
      </div>
    </section>
  );
}

function CreatorCard({ 
  creator, 
  rank, 
  onClick 
}: { 
  creator: PopularCreator; 
  rank: number;
  onClick: () => void;
}) {
  const displayName = creator.display_name || 
    [creator.first_name, creator.last_name].filter(Boolean).join(' ') || 
    creator.username || 
    'Пользователь';

  const getRankBadge = () => {
    if (rank === 1) return { bg: 'bg-gradient-to-r from-amber-400 to-yellow-500', icon: '🥇' };
    if (rank === 2) return { bg: 'bg-gradient-to-r from-gray-300 to-gray-400', icon: '🥈' };
    if (rank === 3) return { bg: 'bg-gradient-to-r from-amber-600 to-orange-700', icon: '🥉' };
    return null;
  };

  const rankBadge = getRankBadge();

  return (
    <motion.div
      className="relative flex-shrink-0 w-32 sm:w-36 cursor-pointer group"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div className="relative p-3 sm:p-4 rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm hover:border-primary/30 transition-all">
        {/* Rank Badge */}
        {rankBadge && (
          <div className="absolute -top-2 -right-2 z-10">
            <span className="text-lg">{rankBadge.icon}</span>
          </div>
        )}
        
        {/* Avatar with glow effect for top 3 */}
        <div className="flex justify-center mb-3">
          <div className={cn(
            "relative",
            rank <= 3 && "after:absolute after:inset-0 after:rounded-full after:bg-primary/20 after:blur-xl after:-z-10"
          )}>
            <Avatar className={cn(
              "w-16 h-16 sm:w-20 sm:h-20 border-2 transition-all",
              rank === 1 && "border-amber-400",
              rank === 2 && "border-gray-400",
              rank === 3 && "border-amber-600",
              rank > 3 && "border-border group-hover:border-primary/50"
            )}>
              <AvatarImage src={creator.photo_url || undefined} alt={displayName} />
              <AvatarFallback className="text-lg bg-primary/10">
                {displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-sm text-center truncate mb-1">
          {displayName}
        </h3>
        
        {creator.username && (
          <p className="text-[10px] text-muted-foreground text-center truncate mb-2">
            @{creator.username}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-0.5">
            <Music2 className="w-3 h-3" />
            <span>{creator.tracks_count}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Heart className="w-3 h-3 text-red-400" />
            <span>{creator.total_likes}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
