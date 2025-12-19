/**
 * HomeHeader - Unified header component for home page
 * Combines logo, welcome greeting, notifications and avatar in a clean layout
 * Supports Telegram fullscreen safe area
 */

import { motion } from '@/lib/motion';
import { User, Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBadge } from '@/components/NotificationBadge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import logo from '@/assets/logo.png';

interface HomeHeaderProps {
  userName?: string;
  userPhotoUrl?: string | null;
  onProfileClick: () => void;
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

export function HomeHeader({ userName, userPhotoUrl, onProfileClick, className }: HomeHeaderProps) {
  const { text, icon, gradient } = getGreeting();

  return (
    <motion.header 
      className={cn(
        "sticky top-0 z-20 -mx-4 px-4",
        "pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-3",
        "backdrop-blur-xl bg-background/90 border-b border-border/50",
        className
      )}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Centered Logo */}
      <motion.div 
        className="flex justify-center mb-3"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <motion.div
          className="flex flex-col items-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="relative"
            animate={{ 
              boxShadow: [
                '0 0 20px hsl(207 90% 54% / 0.2)',
                '0 0 30px hsl(207 90% 54% / 0.3)',
                '0 0 20px hsl(207 90% 54% / 0.2)'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img 
              src={logo} 
              alt="MusicVerse AI" 
              className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl shadow-lg" 
            />
          </motion.div>
          <h1 className="text-sm sm:text-base font-bold text-gradient leading-tight mt-1.5">
            MusicVerse AI
          </h1>
        </motion.div>
      </motion.div>

      {/* Greeting row with avatar and notifications */}
      <motion.div 
        className="flex items-center justify-between gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        {/* Greeting with time icon */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <motion.div 
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br shadow-sm",
              gradient
            )}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-white">{icon}</span>
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <motion.h2 
              className="text-sm sm:text-base font-semibold truncate"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {text}
              {userName && (
                <span className="text-primary">, {userName}</span>
              )}
              <motion.span 
                className="inline-block ml-1"
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
              >
                👋
              </motion.span>
            </motion.h2>
          </div>
        </div>

        {/* Actions: Theme Toggle + Notifications + Avatar */}
        <div className="flex items-center gap-1.5">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ThemeToggle variant="dropdown" />
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <NotificationBadge />
          </motion.div>
          
          <motion.button
            onClick={onProfileClick}
            className={cn(
              "w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden",
              "border-2 border-primary/30 hover:border-primary/60",
              "transition-all duration-200 touch-manipulation",
              "ring-0 hover:ring-2 hover:ring-primary/20"
            )}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            {userPhotoUrl ? (
              <img
                src={userPhotoUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.header>
  );
}
