import { motion } from 'framer-motion';
import { useAchievements, useUserAchievements } from '@/hooks/useGamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Check, Coins, Sparkles } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  streak: 'Серии',
  creation: 'Создание',
  social: 'Социальные',
  milestone: 'Вехи',
  special: 'Особые',
};

interface AchievementsListProps {
  showAll?: boolean;
}

export function AchievementsList({ showAll = false }: AchievementsListProps) {
  const { data: achievements, isLoading: loadingAchievements } = useAchievements();
  const { data: userAchievements, isLoading: loadingUserAchievements } = useUserAchievements();

  const isLoading = loadingAchievements || loadingUserAchievements;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
  
  const groupedAchievements = achievements?.reduce((acc, achievement) => {
    const category = achievement.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, typeof achievements>);

  const displayAchievements = showAll 
    ? achievements 
    : userAchievements?.map(ua => ua.achievement).filter(Boolean);

  if (!showAll && (!displayAchievements || displayAchievements.length === 0)) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Lock className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Пока нет достижений</p>
        <p className="text-sm">Выполняйте действия, чтобы получить награды!</p>
      </div>
    );
  }

  if (showAll && groupedAchievements) {
    return (
      <div className="space-y-6">
        {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
          <div key={category}>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {CATEGORY_LABELS[category] || category}
            </h3>
            <div className="grid gap-2">
              {categoryAchievements?.map((achievement, index) => {
                const isUnlocked = unlockedIds.has(achievement.id);
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`transition-all ${isUnlocked ? 'border-primary/30 bg-primary/5' : 'opacity-60'}`}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl
                            ${isUnlocked ? 'bg-primary/20' : 'bg-muted'}`}>
                            {achievement.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{achievement.name}</span>
                              {isUnlocked && (
                                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {achievement.description}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            {achievement.credits_reward > 0 && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Coins className="w-3 h-3" />
                                +{achievement.credits_reward}
                              </Badge>
                            )}
                            {achievement.experience_reward > 0 && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Sparkles className="w-3 h-3" />
                                +{achievement.experience_reward} XP
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {displayAchievements?.map((achievement, index) => (
        <motion.div
          key={achievement?.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl">
                  {achievement?.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{achievement?.name}</span>
                  <p className="text-xs text-muted-foreground">
                    {achievement?.description}
                  </p>
                </div>
                <Check className="w-5 h-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
