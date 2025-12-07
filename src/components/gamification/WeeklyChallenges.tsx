import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Clock, Star, Flame, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays, endOfWeek, startOfWeek, format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target: number;
  current: number;
  reward: { credits: number; xp: number };
  difficulty: 'easy' | 'medium' | 'hard';
}

export function WeeklyChallenges() {
  const { user } = useAuth();
  
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const daysLeft = differenceInDays(weekEnd, new Date()) + 1;
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['weekly-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const weekStartStr = weekStart.toISOString();
      const weekEndStr = weekEnd.toISOString();
      
      // Get week's generation count
      const { count: generationsCount } = await supabase
        .from('tracks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', weekStartStr)
        .lte('created_at', weekEndStr);
      
      // Get week's share count
      const { count: sharesCount } = await supabase
        .from('user_activity')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action_type', 'share')
        .gte('created_at', weekStartStr)
        .lte('created_at', weekEndStr);

      // Get week's likes received
      const { data: userTracks } = await supabase
        .from('tracks')
        .select('id')
        .eq('user_id', user.id);
      
      const trackIds = userTracks?.map(t => t.id) || [];
      let likesReceived = 0;
      
      if (trackIds.length > 0) {
        const { count } = await supabase
          .from('track_likes')
          .select('*', { count: 'exact', head: true })
          .in('track_id', trackIds)
          .gte('created_at', weekStartStr)
          .lte('created_at', weekEndStr);
        likesReceived = count || 0;
      }

      // Get streak
      const { data: credits } = await supabase
        .from('user_credits')
        .select('current_streak')
        .eq('user_id', user.id)
        .single();
      
      return {
        generations: generationsCount || 0,
        shares: sharesCount || 0,
        likesReceived,
        currentStreak: credits?.current_streak || 0,
      };
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  const challenges: Challenge[] = [
    {
      id: 'weekly-creator',
      title: 'Плодотворная неделя',
      description: 'Создай 10 треков за неделю',
      icon: <Star className="w-4 h-4" />,
      target: 10,
      current: stats?.generations || 0,
      reward: { credits: 50, xp: 150 },
      difficulty: 'medium',
    },
    {
      id: 'weekly-influencer',
      title: 'Инфлюенсер',
      description: 'Поделись 10 треками',
      icon: <Sparkles className="w-4 h-4" />,
      target: 10,
      current: stats?.shares || 0,
      reward: { credits: 30, xp: 100 },
      difficulty: 'medium',
    },
    {
      id: 'weekly-popular',
      title: 'Народный любимец',
      description: 'Получи 20 лайков на свои треки',
      icon: <Trophy className="w-4 h-4" />,
      target: 20,
      current: stats?.likesReceived || 0,
      reward: { credits: 75, xp: 200 },
      difficulty: 'hard',
    },
    {
      id: 'weekly-streak',
      title: 'На огне',
      description: 'Держи серию 7 дней',
      icon: <Flame className="w-4 h-4" />,
      target: 7,
      current: stats?.currentStreak || 0,
      reward: { credits: 100, xp: 300 },
      difficulty: 'hard',
    },
  ];

  const getDifficultyColor = (difficulty: Challenge['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'hard': return 'bg-red-500/20 text-red-500 border-red-500/30';
    }
  };

  const getDifficultyLabel = (difficulty: Challenge['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'Легко';
      case 'medium': return 'Средне';
      case 'hard': return 'Сложно';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedCount = challenges.filter(c => c.current >= c.target).length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Еженедельные челленджи
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {daysLeft} {daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {completedCount}/{challenges.length}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {format(weekStart, 'd MMM', { locale: ru })} - {format(weekEnd, 'd MMM', { locale: ru })}
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        {challenges.map((challenge, index) => {
          const isCompleted = challenge.current >= challenge.target;
          const progress = Math.min((challenge.current / challenge.target) * 100, 100);
          
          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-3 rounded-lg border transition-all",
                isCompleted 
                  ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30" 
                  : "bg-muted/50 border-border"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  isCompleted 
                    ? "bg-gradient-to-br from-yellow-500 to-orange-500 text-white" 
                    : "bg-primary/10 text-primary"
                )}>
                  {challenge.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "font-medium text-sm",
                      isCompleted && "text-yellow-600 dark:text-yellow-400"
                    )}>
                      {challenge.title}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={cn("text-[10px] px-1.5 py-0", getDifficultyColor(challenge.difficulty))}
                    >
                      {getDifficultyLabel(challenge.difficulty)}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {challenge.description}
                  </p>
                  
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Progress value={progress} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground min-w-[45px] text-right">
                        {challenge.current}/{challenge.target}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                        +{challenge.reward.credits} 💎
                      </span>
                      <span className="text-purple-600 dark:text-purple-400">
                        +{challenge.reward.xp} XP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
