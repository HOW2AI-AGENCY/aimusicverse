import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Plus, Library, Menu, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';
import { GenerateSheet } from './GenerateSheet';
import { NavigationMenuSheet } from './NavigationMenuSheet';
import { motion, AnimatePresence } from '@/lib/motion';
import { useUnreadCount } from '@/hooks/useNotifications';

const navItems = [
  { path: '/', icon: Home, label: 'Главная', isCenter: false },
  { path: '/projects', icon: FolderOpen, label: 'Проекты', isCenter: false },
  { path: '__generate__', icon: Plus, label: 'Создать', isCenter: true },
  { path: '/library', icon: Library, label: 'Библиотека', isCenter: false },
  { path: '__menu__', icon: Menu, label: 'Меню', isCenter: false },
];

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hapticFeedback } = useTelegram();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const unreadCount = useUnreadCount();

  const handleNavigate = (path: string) => {
    hapticFeedback('light');
    navigate(path);
  };

  const handleGenerateClick = () => {
    hapticFeedback('medium');
    setGenerateOpen(true);
  };

  const handleMenuClick = () => {
    hapticFeedback('light');
    setMenuOpen(true);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <motion.nav
        className="island-nav z-50"
        initial={{ y: 100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25,
          opacity: { duration: 0.3 }
        }}
        role="navigation"
        aria-label="Главная навигация"
      >
        <div className="flex items-center justify-around gap-0.5">
          {navItems.map((item, index) => {
            if (item.isCenter) {
              return (
                <motion.button
                  key={item.path}
                  onClick={handleGenerateClick}
                  className="relative flex items-center justify-center w-12 h-12 -my-1.5 rounded-full bg-gradient-to-br from-primary to-generate shadow-md shadow-primary/25 fab touch-scale-md touch-manipulation group"
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.05 }}
                  aria-label={item.label}
                  title={item.label}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Plus className="w-5 h-5 text-primary-foreground relative z-10" />
                </motion.button>
              );
            }

              const handleClick = item.path === '__menu__'
                ? handleMenuClick
                : () => handleNavigate(item.path);

              const active = item.path === '__menu__'
                ? menuOpen
                : isActive(item.path);

              // Show notification badge for Menu item
              const showNotificationBadge = item.path === '__menu__';

              return (
                <motion.button
                  key={item.path}
                  onClick={handleClick}
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-h-[44px] min-w-[44px] touch-scale-sm touch-manipulation group",
                    active
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.05 }}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                  title={item.label}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <motion.div
                    initial={false}
                    animate={active ? { scale: 1.1, y: -1 } : { scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="relative"
                  >
                    <item.icon className="w-5 h-5" />
                    {/* Notification Badge for Menu */}
                    {showNotificationBadge && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </motion.div>
                  <motion.span
                    className="text-[10px] font-medium"
                    initial={false}
                    animate={active ? { fontWeight: 600 } : { fontWeight: 500 }}
                  >
                    {item.label}
                  </motion.span>

                  {/* Active indicator - Modern pill */}
                  <AnimatePresence>
                    {active && (
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-primary/5 border border-primary/20"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
      </motion.nav>

      <GenerateSheet open={generateOpen} onOpenChange={setGenerateOpen} />
      <NavigationMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
};
