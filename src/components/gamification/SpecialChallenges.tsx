import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Rocket, Crown, Gem, Zap, Lock, Gift, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInHours } from 'date-fns';

interface SpecialChallenge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target: number;
  current: number;
  reward: { credits: number; xp: number; badge?: string };
  endsIn?: string;
  type: 'limited' | 'milestone' | 'secret';
  unlocked: boolean;
}

export function SpecialChallenges() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['special-challenge-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get total tracks
      const { count: totalTracks } = await supabase
        .from('tracks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get total likes received
      const { data: userTracks } = await supabase
        .from('tracks')
        .select('id')
        .eq('user_id', user.id);
      
      const trackIds = userTracks?.map(t => t.id) || [];
      let totalLikes = 0;
      
      if (trackIds.length > 0) {
        const { count } = await supabase
          .from('track_likes')
          .select('*', { count: 'exact', head: true })
          .in('track_id', trackIds);
        totalLikes = count || 0;
      }

      // Get credits data
      const { data: credits } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Get artists count
      const { count: artistsCount } = await supabase
        .from('artists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get achievements count
      const { count: achievementsCount } = await supabase
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      return {
        totalTracks: totalTracks || 0,
        totalLikes,
        longestStreak: credits?.longest_streak || 0,
        level: credits?.level || 1,
        artistsCount: artistsCount || 0,
        achievementsCount: achievementsCount || 0,
      };
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  const challenges: SpecialChallenge[] = [
    {
      id: 'first-100',
      title: 'Первая сотня',
      description: 'Создай 100 треков',
      icon: <Rocket className="w-5 h-5" />,
      target: 100,
      current: stats?.totalTracks || 0,
      reward: { credits: 200, xp: 500, badge: '💯' },
      type: 'milestone',
      unlocked: true,
    },
    {
      id: 'viral-hit',
      title: 'Вирусный хит',
      description: 'Получи 100 лайков на свои треки',
      icon: <Crown className="w-5 h-5" />,
      target: 100,
      current: stats?.totalLikes || 0,
      reward: { credits: 150, xp: 400, badge: '👑' },
      type: 'milestone',
      unlocked: true,
    },
    {
      id: 'streak-master',
      title: 'Мастер серий',
      description: 'Держи серию 30 дней подряд',
      icon: <Zap className="w-5 h-5" />,
      target: 30,
      current: stats?.longestStreak || 0,
      reward: { credits: 300, xp: 750, badge: '🔥' },
      type: 'milestone',
      unlocked: true,
    },
    {
      id: 'producer',
      title: 'Продюсер',
      description: 'Создай 5 AI-артистов',
      icon: <Gem className="w-5 h-5" />,
      target: 5,
      current: stats?.artistsCount || 0,
      reward: { credits: 100, xp: 300, badge: '🎤' },
      type: 'milestone',
      unlocked: true,
    },
    {
      id: 'collector',
      title: 'Коллекционер',
      description: 'Открой 10 достижений',
      icon: <Gift className="w-5 h-5" />,
      target: 10,
      current: stats?.achievementsCount || 0,
      reward: { credits: 75, xp: 200 },
      type: 'milestone',
      unlocked: true,
    },
    {
      id: 'secret-legend',
      title: '???',
      description: 'Секретное достижение',
      icon: <Lock className="w-5 h-5" />,
      target: 1,
      current: 0,
      reward: { credits: 500, xp: 1000, badge: '🏆' },
      type: 'secret',
      unlocked: false,
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Gem className="w-4 h-4 text-purple-500" />
          Особые челленджи
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        {challenges.map((challenge, index) => {
          const isCompleted = challenge.current >= challenge.target;
          const progress = Math.min((challenge.current / challenge.target) * 100, 100);

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-4 rounded-lg border transition-all",
                !challenge.unlocked && "opacity-50",
                isCompleted 
                  ? "bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30" 
                  : "bg-muted/50 border-border"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                  isCompleted 
                    ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white" 
                    : challenge.unlocked
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                )}>
                  {challenge.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "font-semibold",
                      isCompleted && "text-purple-600 dark:text-purple-400"
                    )}>
                      {challenge.title}
                    </span>
                    {challenge.type === 'secret' && !challenge.unlocked && (
                      <Badge variant="outline" className="text-[10px]">Секрет</Badge>
                    )}
                    {challenge.type === 'limited' && challenge.endsIn && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Timer className="w-3 h-3" />
                        {challenge.endsIn}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {challenge.description}
                  </p>
                  
                  {challenge.unlocked && (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Progress value={progress} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground min-w-[50px] text-right">
                          {challenge.current}/{challenge.target}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                          +{challenge.reward.credits} 💎
                        </span>
                        <span className="text-purple-600 dark:text-purple-400">
                          +{challenge.reward.xp} XP
                        </span>
                        {challenge.reward.badge && (
                          <span className="text-muted-foreground">
                            Значок: {challenge.reward.badge}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
