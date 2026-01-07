/**
 * HomeHeader - Unified header component for home page
 * Combines logo, welcome greeting, notifications, menu and avatar in a clean layout
 * Supports Telegram fullscreen safe area
 */

import { useState, lazy, Suspense } from 'react';
import { motion } from '@/lib/motion';
import { User, Sun, Moon, Sunrise, Sunset, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useTelegram } from '@/contexts/TelegramContext';
import logo from '@/assets/logo.png';
import { TELEGRAM_SAFE_AREA } from '@/constants/safe-area';

// Use the same menu as bottom navigation "More" button
const MoreMenuSheet = lazy(() => import('@/components/navigation/MoreMenuSheet').then(m => ({ default: m.MoreMenuSheet })));

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
  const [menuOpen, setMenuOpen] = useState(false);
  const unreadCount = useUnreadCount();
  const { hapticFeedback } = useTelegram();

  const handleMenuClick = () => {
    hapticFeedback('light');
    setMenuOpen(true);
  };

  return (
    <motion.header 
      className={cn(
        "sticky top-0 z-20 -mx-4 px-3 pb-2",
        "backdrop-blur-xl bg-background/90 border-b border-border/50",
        className
      )}
      style={{
        paddingTop: TELEGRAM_SAFE_AREA.homeHeaderTop,
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Centered Logo - compact version for mobile */}
      <motion.div 
        className="flex justify-center mb-2"
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
                '0 0 15px hsl(207 90% 54% / 0.2)',
                '0 0 25px hsl(207 90% 54% / 0.3)',
                '0 0 15px hsl(207 90% 54% / 0.2)'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img 
              src={logo} 
              alt="MusicVerse AI" 
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl shadow-md" 
            />
          </motion.div>
          <h1 className="text-[10px] sm:text-xs font-bold text-gradient leading-tight mt-1">
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

        {/* Actions: Menu + Avatar (notifications moved to menu) */}
        <div className="flex items-center gap-1.5">
          {/* Menu Button with notification badge */}
          <motion.button
            onClick={handleMenuClick}
            className={cn(
              "relative w-9 h-9 rounded-xl flex items-center justify-center",
              "bg-muted/60 hover:bg-muted transition-all duration-200 touch-manipulation",
              "hover:shadow-md"
            )}
            whileHover={{ scale: 1.08, rotate: 3 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Меню"
          >
            <Menu className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <motion.span 
                className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </motion.button>
          
          {/* Avatar with glow effect */}
          <motion.button
            onClick={onProfileClick}
            className={cn(
              "relative w-9 h-9 rounded-full overflow-hidden",
              "border-2 border-primary/40 hover:border-primary/80",
              "transition-all duration-300 touch-manipulation",
              "hover:shadow-lg hover:shadow-primary/25"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
          >
            {/* Animated ring */}
            <motion.div
              className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary via-generate to-primary opacity-0 group-hover:opacity-100"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            {userPhotoUrl ? (
              <img
                src={userPhotoUrl}
                alt="Avatar"
                className="w-full h-full object-cover relative z-10"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center relative z-10">
                <User className="w-4 h-4 text-primary" />
              </div>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Menu Sheet - unified with bottom navigation "More" button */}
      {menuOpen && (
        <Suspense fallback={null}>
          <MoreMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
        </Suspense>
      )}
    </motion.header>
  );
}
