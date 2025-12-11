import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Plus, Library, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';
import { GenerateSheet } from './GenerateSheet';
import { NavigationMenuSheet } from './NavigationMenuSheet';
import { motion, AnimatePresence } from '@/lib/motion';

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
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/30 bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom,0px)]"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="max-w-7xl mx-auto px-2 py-2">
          <div className="flex items-center justify-around gap-1">
            {navItems.map((item) => {
              if (item.isCenter) {
                return (
                  <motion.button
                    key={item.path}
                    onClick={handleGenerateClick}
                    className="relative flex items-center justify-center w-14 h-14 -mt-5 rounded-full bg-primary shadow-lg active:scale-95 transition-transform touch-manipulation"
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="w-6 h-6 text-primary-foreground relative z-10" />
                  </motion.button>
                );
              }

              const handleClick = item.path === '__menu__' 
                ? handleMenuClick 
                : () => handleNavigate(item.path);
              
              const active = item.path === '__menu__' 
                ? menuOpen 
                : isActive(item.path);

              return (
                <motion.button
                  key={item.path}
                  onClick={handleClick}
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg transition-colors min-h-[44px] min-w-[44px] touch-manipulation",
                    active
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                  whileTap={{ scale: 0.92 }}
                >
                  <motion.div
                    initial={false}
                    animate={active ? { scale: 1.05 } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <item.icon className="w-5 h-5" />
                  </motion.div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                  
                  {/* Active indicator */}
                  <AnimatePresence>
                    {active && (
                      <motion.div
                        className="absolute bottom-0 left-1/2 w-1 h-1 rounded-full bg-primary"
                        initial={{ scale: 0, x: '-50%' }}
                        animate={{ scale: 1, x: '-50%' }}
                        exit={{ scale: 0, x: '-50%' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.nav>

      <GenerateSheet open={generateOpen} onOpenChange={setGenerateOpen} />
      <NavigationMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
};
