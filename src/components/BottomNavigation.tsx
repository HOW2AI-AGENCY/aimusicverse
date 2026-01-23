import { useState, lazy, Suspense, memo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Plus, Library, FolderOpen, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';
import { motion, AnimatePresence } from '@/lib/motion';
import { useAuth } from '@/hooks/useAuth';
import { useActiveGenerations } from '@/hooks/generation/useActiveGenerations';
import { Badge } from '@/components/ui/badge';
import { preloadRoute } from '@/lib/route-preloader';
import { typographyClass, touchTargetClass } from '@/lib/design-tokens';
// Lazy load heavy sheet component
const GenerateSheet = lazy(() => import('./GenerateSheet').then(m => ({ default: m.GenerateSheet })));

/**
 * Optimized navigation - 5 items with FAB in center
 * Phase 1 UX Improvement: Simplified navigation
 * - Home: Main page
 * - Library: Tracks & Projects (combined)
 * - Create (+): Generation FAB
 * - Projects: Music projects and lyrics
 * - Profile: User profile with settings
 */
const navItems = [
  { path: '/', icon: Home, label: 'Главная', isCenter: false },
  { path: '/library', icon: Library, label: 'Библиотека', isCenter: false },
  { path: '__generate__', icon: Plus, label: 'Создать', isCenter: true },
  { path: '/projects', icon: FolderOpen, label: 'Проекты', isCenter: false },
  { path: '/profile', icon: User, label: 'Профиль', isCenter: false },
];

export const BottomNavigation = memo(function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hapticFeedback } = useTelegram();
  const { user } = useAuth();
  const [generateOpen, setGenerateOpen] = useState(false);
  const { data: activeGenerations = [] } = useActiveGenerations();
  const activeGenCount = activeGenerations.length;

  const handleNavigate = useCallback((path: string) => {
    hapticFeedback('light');
    // Handle profile with user ID
    if (path === '/profile' && user?.id) {
      navigate(`/profile/${user.id}`);
    } else {
      navigate(path);
    }
  }, [hapticFeedback, navigate, user?.id]);

  const handleGenerateClick = useCallback(() => {
    hapticFeedback('medium');
    setGenerateOpen(true);
  }, [hapticFeedback]);

  // Preload route on hover/touch start for faster navigation
  const handlePreload = useCallback((path: string) => {
    if (path.startsWith('__')) return; // Skip special paths
    preloadRoute(path);
  }, []);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      <motion.nav
        className="island-nav z-navigation"
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
        <div className="flex items-center justify-around h-14">
          {navItems.map((item, index) => {
            if (item.isCenter) {
              return (
                <div key={item.path} className="relative overflow-visible">
                  <motion.button
                    onClick={handleGenerateClick}
                    className={cn(
                      "relative flex items-center justify-center w-14 h-14 -my-2 rounded-full bg-gradient-to-br from-primary to-generate shadow-md shadow-primary/25 fab touch-scale-md touch-manipulation group",
                      activeGenCount > 0 && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
                    )}
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.05 }}
                    aria-label={item.label}
                    title={item.label}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    {/* Pulsing ring when generations are active */}
                    <AnimatePresence>
                      {activeGenCount > 0 && (
                        <motion.div
                          className="absolute inset-0 rounded-full bg-primary/30"
                          initial={{ scale: 1, opacity: 0.5 }}
                          animate={{ 
                            scale: [1, 1.4, 1.4],
                            opacity: [0.5, 0, 0]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeOut'
                          }}
                        />
                      )}
                    </AnimatePresence>

                    <Plus className="w-4.5 h-4.5 text-primary-foreground relative z-10" />
                  </motion.button>
                  
                  {/* Active generations badge - positioned outside button */}
                  <AnimatePresence>
                    {activeGenCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1.5 -right-1.5 z-20"
                      >
                        <Badge 
                          className="h-5 min-w-5 px-1 text-[10px] bg-destructive text-destructive-foreground border-2 border-background shadow-sm"
                        >
                          {activeGenCount > 9 ? '9+' : activeGenCount}
                        </Badge>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            const handleClick = () => handleNavigate(item.path);
            const active = isActive(item.path);

            return (
              <motion.button
                key={item.path}
                onClick={handleClick}
              className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all min-h-touch min-w-touch touch-scale-sm touch-manipulation group",
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.05 }}
                onMouseEnter={() => handlePreload(item.path)}
                onTouchStart={() => handlePreload(item.path)}
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
                  <item.icon className="w-4.5 h-4.5" />
                </motion.div>
                <motion.span
                  className={cn("text-[9px] font-medium", typographyClass.caption)}
                  style={{ fontSize: '9px' }}
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

      {/* Lazy load GenerateSheet only when opened */}
      {generateOpen && (
        <Suspense fallback={null}>
          <GenerateSheet open={generateOpen} onOpenChange={setGenerateOpen} />
        </Suspense>
      )}
    </>
  );
});
