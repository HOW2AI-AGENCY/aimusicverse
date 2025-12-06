import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { useUserCredits, getLevelProgress } from '@/hooks/useGamification';
import { Star, TrendingUp } from 'lucide-react';

const LEVEL_TITLES: Record<number, string> = {
  1: 'Новичок',
  2: 'Слушатель',
  3: 'Любитель',
  4: 'Энтузиаст',
  5: 'Музыкант',
  6: 'Композитор',
  7: 'Продюсер',
  8: 'Мастер',
  9: 'Виртуоз',
  10: 'Легенда',
};

function getLevelTitle(level: number): string {
  if (level >= 10) return 'Легенда';
  return LEVEL_TITLES[level] || 'Новичок';
}

interface UserLevelProps {
  compact?: boolean;
}

export function UserLevel({ compact = false }: UserLevelProps) {
  const { data: credits, isLoading } = useUserCredits();

  if (isLoading || !credits) {
    return (
      <div className={`${compact ? 'h-8' : 'h-16'} bg-muted animate-pulse rounded-md`} />
    );
  }

  const level = credits.level;
  const { current, next, progress } = getLevelProgress(credits.experience);
  const title = getLevelTitle(level);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
          {level}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium truncate">{title}</span>
            <span className="text-muted-foreground">{credits.experience} XP</span>
          </div>
          <Progress value={progress} className="h-1 mt-1" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20"
    >
      <div className="flex items-center gap-4">
        <motion.div 
          className="relative"
          whileHover={{ scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg">
            {level}
          </div>
          <motion.div 
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center"
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Star className="w-3 h-3 text-yellow-900" fill="currentColor" />
          </motion.div>
        </motion.div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-lg">{title}</span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>{credits.experience} XP</span>
            <span>{next} XP</span>
          </div>
          
          <div className="relative">
            <Progress value={progress} className="h-3" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-medium text-primary-foreground mix-blend-difference">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
