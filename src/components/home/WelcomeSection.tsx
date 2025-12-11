import { motion } from '@/lib/motion';
import { Sparkles, Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WelcomeSectionProps {
  userName?: string;
  className?: string;
}

function getGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return { text: 'Доброе утро', icon: <Sunrise className="w-5 h-5 text-amber-400" /> };
  } else if (hour >= 12 && hour < 17) {
    return { text: 'Добрый день', icon: <Sun className="w-5 h-5 text-yellow-400" /> };
  } else if (hour >= 17 && hour < 22) {
    return { text: 'Добрый вечер', icon: <Sunset className="w-5 h-5 text-orange-400" /> };
  } else {
    return { text: 'Доброй ночи', icon: <Moon className="w-5 h-5 text-blue-400" /> };
  }
}

export function WelcomeSection({ userName, className }: WelcomeSectionProps) {
  const { text, icon } = getGreeting();
  
  return (
    <motion.div 
      className={cn("py-1.5 sm:py-2", className)}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.3 }}
    >
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold truncate">
            {text}{userName && <span className="text-primary">, {userName}</span>}
          </h2>
          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
            Готовы создать что-то новое?
            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
          </p>
        </div>
      </div>
    </motion.div>
  );
}
