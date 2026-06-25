/**
 * HomeHeader - Unified header component for home page
 * Combines logo, welcome greeting, notifications, menu and avatar in a clean layout
 * Supports Telegram fullscreen safe area
 *
 * On desktop: Shows simplified greeting (no menu/avatar - handled by Sidebar)
 * On mobile: Full header with menu, avatar, notifications
 *
 * Feature: 032-professional-ui - Uses design system tokens
 */

import { useState, lazy, Suspense } from "react";
import { motion } from "@/lib/motion";
import { User, Sun, Moon, Sunrise, Sunset, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadCount } from "@/hooks/useNotifications";
import { useTelegram } from "@/contexts/TelegramContext";
import { AppLogo } from "@/components/branding/AppLogo";
import { TELEGRAM_SAFE_AREA } from "@/constants/safe-area";
import { AdminQuickAccess } from "./AdminQuickAccess";
import { useIsMobile } from "@/hooks/use-mobile";
import { glass } from "@/lib/glass";
import { Heading } from "@/components/ui/Heading";

// Use the same menu as bottom navigation "More" button
const MoreMenuSheet = lazy(() =>
  import("@/components/navigation/MoreMenuSheet").then((m) => ({ default: m.MoreMenuSheet })),
);

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
      text: "Доброе утро",
      icon: <Sunrise className="w-4 h-4" />,
      gradient: "from-amber-400 to-orange-400",
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      text: "Добрый день",
      icon: <Sun className="w-4 h-4" />,
      gradient: "from-yellow-400 to-amber-400",
    };
  } else if (hour >= 17 && hour < 22) {
    return {
      text: "Добрый вечер",
      icon: <Sunset className="w-4 h-4" />,
      gradient: "from-orange-400 to-rose-400",
    };
  } else {
    return {
      text: "Доброй ночи",
      icon: <Moon className="w-4 h-4" />,
      gradient: "from-blue-400 to-indigo-400",
    };
  }
}

export function HomeHeader({ userName, userPhotoUrl, onProfileClick, className }: HomeHeaderProps) {
  const { text, icon, gradient } = getGreeting();
  const [menuOpen, setMenuOpen] = useState(false);
  const unreadCount = useUnreadCount();
  const { hapticFeedback } = useTelegram();
  const isMobile = useIsMobile();

  const handleMenuClick = () => {
    hapticFeedback("light");
    setMenuOpen(true);
  };

  // Desktop: enhanced header with better visual hierarchy
  if (!isMobile) {
    return (
      <motion.header
        className={cn("mb-6 lg:mb-8", className)}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Greeting row with improved styling */}
        <div className="flex items-center gap-4 lg:gap-5">
          <motion.div
            className={cn(
              "flex-shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center",
              "bg-gradient-to-br shadow-lg shadow-primary/20",
              gradient,
            )}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ scale: 1.1 }}
          >
            <span className="text-white">{icon}</span>
          </motion.div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl lg:text-2xl xl:text-3xl font-bold leading-tight">
              {text}
              {userName && <span className="text-primary">, {userName}</span>}
              <motion.span
                className="inline-block ml-2"
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
              >
                👋
              </motion.span>
            </h2>
            <p className="text-sm lg:text-base text-muted-foreground mt-0.5 lg:mt-1">
              Добро пожаловать в MusicVerse AI — создавайте музыку с помощью AI
            </p>
          </div>

          {/* Admin Quick Access - only for admins */}
          <AdminQuickAccess />
        </div>
      </motion.header>
    );
  }

  return (
    <motion.header
      className={cn("sticky top-0 z-20 -mx-4 px-3 pb-2", glass.nav, "border-b border-border/50", className)}
      style={{
        paddingTop: TELEGRAM_SAFE_AREA.homeHeaderTop,
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Greeting row with logo, avatar and notifications */}
      <motion.div
        className="flex items-center justify-between gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {/* Greeting with time icon */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <motion.div
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br shadow-sm",
              gradient,
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
              {userName && <span className="text-primary">, {userName}</span>}
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

        {/* Actions: Admin + Menu + Avatar */}
        <div className="flex items-center gap-2">
          {/* Admin Quick Access - only for admins */}
          <AdminQuickAccess />

          {/* Menu Button with notification badge - 44px touch target */}
          <div className="relative overflow-visible">
            <motion.button
              onClick={handleMenuClick}
              className={cn(
                "relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center",
                "bg-muted/60 hover:bg-muted transition-all duration-200 touch-manipulation",
                "hover:shadow-md",
              )}
              whileHover={{ scale: 1.08, rotate: 3 }}
              whileTap={{ scale: 0.92 }}
              aria-label="Меню"
            >
              <Menu className="w-5 h-5" />
            </motion.button>
            {unreadCount > 0 && (
              <motion.span
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground shadow-lg z-10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </div>

          {/* Avatar with glow effect - 44px touch target */}
          <motion.button
            onClick={onProfileClick}
            className={cn(
              "relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-full overflow-hidden",
              "border-2 border-primary/40 hover:border-primary/80",
              "transition-all duration-300 touch-manipulation",
              "hover:shadow-lg hover:shadow-primary/25",
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Профиль"
          >
            {/* Animated ring */}
            <motion.div
              className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary via-generate to-primary opacity-0 group-hover:opacity-100"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            {userPhotoUrl ? (
              <img src={userPhotoUrl} alt="Avatar" className="w-full h-full object-cover relative z-10" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center relative z-10">
                <User className="w-5 h-5 text-primary" />
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
