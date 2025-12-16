import { motion } from '@/lib/motion';
import { Sparkles, Sun, Moon, Sunrise, Sunset, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WelcomeSectionProps {
  userName?: string;
  className?: string;
}

function getGreeting(): { text: string; icon: React.ReactNode; gradient: string } {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return { 
      text: 'Доброе утро', 
      icon: <Sunrise className="w-4 h-4" />,
      gradient: 'from-amber-400 to-orange-400'
    };
  } else if (hour >= 12 && hour < 17) {
    return { 
      text: 'Добрый день', 
      icon: <Sun className="w-4 h-4" />,
      gradient: 'from-yellow-400 to-amber-400'
    };
  } else if (hour >= 17 && hour < 22) {
    return { 
      text: 'Добрый вечер', 
      icon: <Sunset className="w-4 h-4" />,
      gradient: 'from-orange-400 to-rose-400'
    };
  } else {
    return { 
      text: 'Доброй ночи', 
      icon: <Moon className="w-4 h-4" />,
      gradient: 'from-blue-400 to-indigo-400'
    };
  }
}

export function WelcomeSection({ userName, className }: WelcomeSectionProps) {
  const { text, icon, gradient } = getGreeting();
  
  return (
    <motion.div 
      className={cn("py-1.5", className)}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.25 }}
    >
      <div className="flex items-center gap-2.5">
        {/* Animated icon container - Compact */}
        <motion.div 
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
            "bg-gradient-to-br",
            gradient
          )}
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-white">{icon}</span>
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold truncate">
            {text}
            {userName && (
              <span className="text-primary">, {userName}</span>
            )}
            <span className="inline-block ml-1">👋</span>
          </h2>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <span>Готовы создать?</span>
            <Wand2 className="w-3 h-3 text-primary" />
          </p>
        </div>
      </div>
    </motion.div>
  );
}
