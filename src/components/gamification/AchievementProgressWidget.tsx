// AchievementProgressWidget - Shows achievements close to being unlocked
import { useMemo, memo } from 'react';
import { Trophy, Star, Heart, Music, Share2, Zap, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAchievements, useUserAchievements, useUserCredits } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';

const ACHIEVEMENT_ICONS: Record<string, React.ElementType> = {
  generation: Music,
  likes: Heart,
  social: Share2,
  streak: Zap,
  experience: Star,
  default: Trophy,
};

interface AchievementWithProgress {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  credits_reward: number;
  experience_reward: number;
  requirement_type: string;
  requirement_value: number;
  currentProgress: number;
  progressPercent: number;
  remaining: number;
}

export const AchievementProgressWidget = memo(function AchievementProgressWidget() {
  const { user } = useAuth();
  const { data: achievements } = useAchievements();
  const { data: userAchievements } = useUserAchievements();
  const { data: userCredits } = useUserCredits();

  // Calculate progress for each achievement
  const nearAchievements = useMemo(() => {
    if (!achievements || !userCredits) return [];

    const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
    
    // Get user stats for progress calculation
    const stats = {
      total_tracks: 0, // Would need to fetch from tracks
      total_likes_given: 0,
      total_shares: 0,
      current_streak: userCredits.current_streak || 0,
      experience: userCredits.experience || 0,
      level: userCredits.level || 1,
    };

    const achievementsWithProgress: AchievementWithProgress[] = achievements
      .filter(a => !unlockedIds.has(a.id) && !a.is_hidden)
      .map(achievement => {
        let currentProgress = 0;
        
        // Estimate progress based on requirement type
        switch (achievement.requirement_type) {
          case 'tracks_created':
            currentProgress = stats.total_tracks;
            break;
          case 'likes_given':
            currentProgress = stats.total_likes_given;
            break;
          case 'shares':
            currentProgress = stats.total_shares;
            break;
          case 'streak_days':
            currentProgress = stats.current_streak;
            break;
          case 'experience':
            currentProgress = stats.experience;
            break;
          case 'level':
            currentProgress = stats.level;
            break;
          default:
            currentProgress = 0;
        }

        const progressPercent = Math.min(100, (currentProgress / achievement.requirement_value) * 100);
        const remaining = Math.max(0, achievement.requirement_value - currentProgress);

        return {
          ...achievement,
          currentProgress,
          progressPercent,
          remaining,
        };
      })
      // Sort by progress (closest to completion first)
      .sort((a, b) => b.progressPercent - a.progressPercent)
      // Take top 3 that have some progress
      .filter(a => a.progressPercent > 0 && a.progressPercent < 100)
      .slice(0, 3);

    return achievementsWithProgress;
  }, [achievements, userAchievements, userCredits]);

  if (!user || nearAchievements.length === 0) return null;

  return (
    <Card className="p-3 bg-gradient-to-br from-card/90 to-card/50 border-primary/10">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Близко к получению</h3>
      </div>

      <div className="space-y-3">
        {nearAchievements.map((achievement, index) => {
          const IconComponent = ACHIEVEMENT_ICONS[achievement.category] || ACHIEVEMENT_ICONS.default;
          
          return (
            <motion.div
              key={achievement.id}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                "bg-gradient-to-br from-primary/20 to-primary/5"
              )}>
                <IconComponent className="w-4 h-4 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium truncate">{achievement.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {Math.round(achievement.progressPercent)}%
                  </span>
                </div>
                <Progress 
                  value={achievement.progressPercent} 
                  className="h-1.5"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Осталось: {achievement.remaining}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-primary font-medium">
                  +{achievement.credits_reward}💎
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {nearAchievements.length > 0 && (
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Продолжайте — награда близко! 🎯
        </p>
      )}
    </Card>
  );
});
