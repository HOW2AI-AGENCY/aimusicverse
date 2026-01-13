import { motion } from '@/lib/motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Target, Music, Share2, Heart, Zap, Check, Gift, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { triggerHapticFeedback } from '@/lib/mobile-utils';
import { toast } from 'sonner';

interface Mission {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target: number;
  current: number;
  reward: { credits: number; xp: number };
  actionPath?: string;
  actionLabel?: string;
  claimed?: boolean;
}

export function DailyMissions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Get today's activity counts and claimed missions
  const { data: activity, isLoading } = useQuery({
    queryKey: ['daily-activity', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const today = new Date().toISOString().split('T')[0];
      const todayStart = `${today}T00:00:00.000Z`;
      const todayEnd = `${today}T23:59:59.999Z`;
      
      // Get today's generation count
      const { count: generationsCount } = await supabase
        .from('tracks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);
      
      // Get today's share count (from user_activity)
      const { count: sharesCount } = await supabase
        .from('user_activity')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action_type', 'share')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);

      // Get today's likes given
      const { count: likesCount } = await supabase
        .from('track_likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);
        
      // Check if checked in today
      const { data: checkin } = await supabase
        .from('user_checkins')
        .select('id')
        .eq('user_id', user.id)
        .eq('checkin_date', today)
        .maybeSingle();

      // Get claimed missions for today (from user_activity with mission_ prefix)
      const { data: claimedMissions } = await supabase
        .from('user_activity')
        .select('action_type')
        .eq('user_id', user.id)
        .like('action_type', 'mission_%')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);
      
      const claimedIds = new Set(
        (claimedMissions || []).map((m: { action_type: string }) => 
          m.action_type.replace('mission_', '')
        )
      );
      
      return {
        generations: generationsCount || 0,
        shares: sharesCount || 0,
        likes: likesCount || 0,
        checkedIn: !!checkin,
        claimedIds,
      };
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000, // Refresh every minute
  });

  // Claim mission reward mutation
  const claimMission = useMutation({
    mutationFn: async (mission: Mission) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase.functions.invoke('reward-action', {
        body: {
          userId: user.id,
          actionType: `mission_${mission.id}`,
          customCredits: mission.reward.credits,
          customExperience: mission.reward.xp,
          description: `Миссия: ${mission.title}`,
        },
      });
      
      if (error) throw error;
      return mission;
    },
    onSuccess: (mission) => {
      triggerHapticFeedback('success');
      toast.success(`+${mission.reward.credits} кредитов за миссию "${mission.title}"!`);
      queryClient.invalidateQueries({ queryKey: ['daily-activity'] });
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    },
    onError: (error) => {
      console.error('Failed to claim mission:', error);
      toast.error('Не удалось получить награду');
    },
  });

  const missions: Mission[] = [
    {
      id: 'generate',
      title: 'Создатель',
      description: 'Сгенерируй 3 трека',
      icon: <Music className="w-4 h-4" />,
      target: 3,
      current: activity?.generations || 0,
      reward: { credits: 10, xp: 30 },
      actionPath: '/generate',
      actionLabel: 'Создать',
      claimed: activity?.claimedIds?.has('generate'),
    },
    {
      id: 'share',
      title: 'Промоутер',
      description: 'Поделись 2 треками',
      icon: <Share2 className="w-4 h-4" />,
      target: 2,
      current: activity?.shares || 0,
      reward: { credits: 6, xp: 20 },
      actionPath: '/library',
      actionLabel: 'Библиотека',
      claimed: activity?.claimedIds?.has('share'),
    },
    {
      id: 'like',
      title: 'Ценитель',
      description: 'Лайкни 5 публичных треков',
      icon: <Heart className="w-4 h-4" />,
      target: 5,
      current: activity?.likes || 0,
      reward: { credits: 5, xp: 15 },
      actionPath: '/',
      actionLabel: 'Обзор',
      claimed: activity?.claimedIds?.has('like'),
    },
  ];

  const handleAction = (path?: string) => {
    if (path) {
      triggerHapticFeedback('light');
      navigate(path);
    }
  };

  const handleClaimReward = (mission: Mission) => {
    if (mission.current >= mission.target && !mission.claimed) {
      claimMission.mutate(mission);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedCount = missions.filter(m => m.claimed).length;
  const allCompleted = completedCount === missions.length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4" />
            Ежедневные миссии
          </CardTitle>
          <Badge variant={allCompleted ? "default" : "secondary"} className="text-xs">
            {completedCount}/{missions.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        {missions.map((mission, index) => {
          const isCompleted = mission.current >= mission.target;
          const canClaim = isCompleted && !mission.claimed;
          const isClaiming = claimMission.isPending && claimMission.variables?.id === mission.id;
          const progress = Math.min((mission.current / mission.target) * 100, 100);
          
          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-3 rounded-lg border transition-all",
                mission.claimed
                  ? "bg-green-500/10 border-green-500/30"
                  : canClaim
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : "bg-muted/50 border-border"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  mission.claimed 
                    ? "bg-green-500 text-white" 
                    : canClaim
                      ? "bg-yellow-500 text-white"
                      : "bg-primary/10 text-primary"
                )}>
                  {mission.claimed ? <Check className="w-4 h-4" /> : mission.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={cn(
                      "font-medium text-sm",
                      mission.claimed && "line-through text-muted-foreground"
                    )}>
                      {mission.title}
                    </span>
                    <div className="flex items-center gap-1 text-xs">
                      <Gift className="w-3 h-3 text-yellow-500" />
                      <span className="text-yellow-600 dark:text-yellow-400">
                        +{mission.reward.credits}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {mission.description}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground min-w-[40px] text-right">
                      {mission.current}/{mission.target}
                    </span>
                  </div>
                </div>
                
                {canClaim ? (
                  <Button
                    size="sm"
                    variant="default"
                    className="h-8 px-3 text-xs flex-shrink-0 bg-yellow-500 hover:bg-yellow-600"
                    onClick={() => handleClaimReward(mission)}
                    disabled={isClaiming}
                  >
                    {isClaiming ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Gift className="w-3 h-3 mr-1" />
                        Забрать
                      </>
                    )}
                  </Button>
                ) : !isCompleted && mission.actionPath ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs flex-shrink-0"
                    onClick={() => handleAction(mission.actionPath)}
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    {mission.actionLabel}
                  </Button>
                ) : null}
              </div>
            </motion.div>
          );
        })}
        
        {allCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-400">
              <Zap className="w-4 h-4" />
              Все миссии выполнены! 🎉
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Возвращайся завтра за новыми заданиями
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}