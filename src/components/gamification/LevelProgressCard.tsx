/**
 * LevelProgressCard - Shows user level with XP progress bar
 * Sprint 012 - Gamification visibility
 */
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Star, Zap, TrendingUp } from 'lucide-react';
import { motion } from '@/lib/motion';
import { getLevelProgress, getExperienceForLevel } from '@/services/credits.service';
import { cn } from '@/lib/utils';
import { getTierInfo } from '@/lib/design-colors';

interface LevelProgressCardProps {
  experience: number;
  className?: string;
  variant?: 'default' | 'compact';
}

export function LevelProgressCard({ 
  experience, 
  className,
  variant = 'default' 
}: LevelProgressCardProps) {
  const { level, current, next, progress } = getLevelProgress(experience);
  const xpToNext = next - experience;
  
  // Use design tokens for tier info
  const tierInfo = getTierInfo(level);

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm',
          `bg-gradient-to-br ${tierInfo.gradient} text-white font-bold`
        )}>
          {level}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs mb-0.5">
            <span className="text-muted-foreground">{tierInfo.icon} {tierInfo.name}</span>
            <span className="text-muted-foreground">{experience} XP</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(tierInfo.bg, tierInfo.border, 'border', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Level badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              'w-14 h-14 rounded-xl flex flex-col items-center justify-center',
              `bg-gradient-to-br ${tierInfo.gradient} text-white shadow-lg`
            )}
          >
            <span className="text-lg font-bold">{level}</span>
            <span className="text-[10px] opacity-80">LVL</span>
          </motion.div>
          
          {/* Progress info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{tierInfo.icon} {tierInfo.name}</span>
                {level < 20 && (
                  <Badge variant="outline" className="text-[10px] h-4">
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                    +{xpToNext} до {level + 1} lvl
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-1">
              <Progress 
                value={progress} 
                className="h-2"
              />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {experience} XP
                </span>
                <span>{next} XP</span>
              </div>
            </div>

            {/* Next level preview */}
            {level < 20 && (
              <p className="text-[10px] text-muted-foreground mt-2">
                {level + 1 === 5 && '🎵 Следующий уровень: Опытный'}
                {level + 1 === 10 && '⭐ Следующий уровень: Профи'}
                {level + 1 === 15 && '💎 Следующий уровень: Мастер'}
                {level + 1 === 20 && '👑 Следующий уровень: Легенда'}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
