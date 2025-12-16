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
      icon: <Sunrise className="w-5 h-5" />,
      gradient: 'from-amber-400 to-orange-400'
    };
  } else if (hour >= 12 && hour < 17) {
    return { 
      text: 'Добрый день', 
      icon: <Sun className="w-5 h-5" />,
      gradient: 'from-yellow-400 to-amber-400'
    };
  } else if (hour >= 17 && hour < 22) {
    return { 
      text: 'Добрый вечер', 
      icon: <Sunset className="w-5 h-5" />,
      gradient: 'from-orange-400 to-rose-400'
    };
  } else {
    return { 
      text: 'Доброй ночи', 
      icon: <Moon className="w-5 h-5" />,
      gradient: 'from-blue-400 to-indigo-400'
    };
  }
}

export function WelcomeSection({ userName, className }: WelcomeSectionProps) {
  const { text, icon, gradient } = getGreeting();
  
  return (
    <motion.div 
      className={cn("py-2 sm:py-3", className)}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        {/* Animated icon container */}
        <motion.div 
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
            "bg-gradient-to-br",
            gradient,
            "shadow-lg"
          )}
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.02, 1]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <span className="text-white">{icon}</span>
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold truncate">
            {text}
            {userName && (
              <span className="text-primary">, {userName}</span>
            )}
            <motion.span 
              className="inline-block ml-1"
              animate={{ rotate: [0, 15, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            >
              👋
            </motion.span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
            <span>Готовы создать что-то новое?</span>
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Wand2 className="w-3.5 h-3.5 text-primary" />
            </motion.div>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
