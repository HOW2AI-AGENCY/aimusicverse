/**
 * Popular Creators Section - Shows top music creators on homepage
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Crown, Music2, Heart, Users, UserPlus, Check, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useTelegram } from '@/contexts/TelegramContext';
import { useAuth } from '@/hooks/useAuth';
import { useFollow } from '@/hooks/social/useFollow';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { SectionHeader } from '@/components/common/SectionHeader';

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
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('user_id, likes_count')
        .eq('is_public', true)
        .eq('status', 'completed');

      if (tracksError) throw tracksError;

      const userStats = new Map<string, { tracks: number; likes: number }>();
      tracksData?.forEach(track => {
        const stats = userStats.get(track.user_id) || { tracks: 0, likes: 0 };
        stats.tracks += 1;
        stats.likes += track.likes_count || 0;
        userStats.set(track.user_id, stats);
      });

      const sortedUsers = Array.from(userStats.entries())
        .sort((a, b) => (b[1].tracks + b[1].likes) - (a[1].tracks + a[1].likes))
        .slice(0, maxCreators)
        .map(([userId]) => userId);

      if (sortedUsers.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, username, photo_url, display_name, bio, followers_count')
        .in('user_id', sortedUsers)
        .eq('is_public', true);

      if (profilesError) throw profilesError;

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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Топ создатели</h2>
            <p className="text-xs text-muted-foreground">Лучшие авторы</p>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-[140px] h-44 rounded-2xl flex-shrink-0" />
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
      <SectionHeader
        icon={Crown}
        iconColor="text-amber-500"
        iconGradient="from-amber-500/20 to-orange-500/10"
        title="Топ создатели"
        subtitle="Лучшие авторы сообщества"
        showMoreLink="/community"
        showMoreLabel="Все авторы"
        badge={{
          label: creators.length,
          icon: Users,
          className: "bg-amber-500/10 text-amber-600 border-amber-500/20"
        }}
      />

      <ScrollArea className="-mx-3 px-3">
        <div className="flex gap-3 pb-3">
          {creators.map((creator, index) => (
            <motion.div
              key={creator.user_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.3 }}
            >
              <CreatorCard 
                creator={creator} 
                rank={index + 1}
                onClick={() => handleCreatorClick(creator.user_id)}
              />
            </motion.div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
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
  const { user } = useAuth();
  const { hapticFeedback } = useTelegram();
  const isOwnProfile = user?.id === creator.user_id;
  const { isFollowing, toggleFollow, isLoading: isFollowLoading } = useFollow(creator.user_id);

  const displayName = creator.display_name || 
    [creator.first_name, creator.last_name].filter(Boolean).join(' ') || 
    creator.username || 
    'Пользователь';

  const getRankConfig = () => {
    if (rank === 1) return { emoji: '🥇', ring: 'ring-amber-400', bg: 'from-amber-500/20 to-yellow-500/10' };
    if (rank === 2) return { emoji: '🥈', ring: 'ring-gray-400', bg: 'from-gray-400/20 to-gray-500/10' };
    if (rank === 3) return { emoji: '🥉', ring: 'ring-amber-600', bg: 'from-amber-600/20 to-orange-600/10' };
    return null;
  };

  const rankConfig = getRankConfig();

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback?.('light');
    toggleFollow();
  };

  return (
    <motion.div
      className="relative flex-shrink-0 w-[140px] sm:w-[150px] cursor-pointer group"
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div className={cn(
        "relative p-3 rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm h-full min-h-[180px] flex flex-col",
        "hover:border-primary/30 hover:shadow-md transition-all",
        rankConfig && `bg-gradient-to-br ${rankConfig.bg}`
      )}>
        {/* Rank Badge */}
        {rankConfig && (
          <div className="absolute -top-1.5 -right-1.5 z-10 text-base">
            {rankConfig.emoji}
          </div>
        )}
        
        {/* Avatar */}
        <div className="flex justify-center mb-2">
          <div className={cn(
            "relative",
            rank <= 3 && "after:absolute after:inset-0 after:rounded-full after:bg-primary/10 after:blur-lg after:-z-10"
          )}>
            <Avatar className={cn(
              "w-14 h-14 border-2 transition-all shadow-md",
              rankConfig?.ring || "border-border/50 group-hover:border-primary/50"
            )}>
              <AvatarImage src={creator.photo_url || undefined} alt={displayName} />
              <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-primary/5">
                {displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-[11px] text-center truncate mb-0.5 group-hover:text-primary transition-colors">
          {displayName}
        </h3>
        
        {/* Username - always reserve space */}
        <p className="text-[9px] text-muted-foreground text-center truncate mb-1.5 h-3">
          {creator.username ? `@${creator.username}` : ''}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-2 text-[10px] mb-2">
          <div className="flex items-center gap-0.5 text-muted-foreground">
            <Music2 className="w-2.5 h-2.5" />
            <span className="font-medium">{creator.tracks_count}</span>
          </div>
          <div className="flex items-center gap-0.5 text-red-400">
            <Heart className="w-2.5 h-2.5 fill-current" />
            <span className="font-medium">{creator.total_likes}</span>
          </div>
        </div>

        {/* Follow Button - pushed to bottom */}
        {user && !isOwnProfile && (
          <Button
            size="sm"
            variant={isFollowing ? "outline" : "default"}
            className={cn(
              "w-full h-7 text-[10px] mt-auto gap-1 rounded-lg",
              isFollowing && "border-primary/30 text-primary"
            )}
            onClick={handleFollowClick}
            disabled={isFollowLoading}
          >
            {isFollowLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isFollowing ? (
              <>
                <Check className="w-3 h-3" />
                Подписка
              </>
            ) : (
              <>
                <UserPlus className="w-3 h-3" />
                Подписаться
              </>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
