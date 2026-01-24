import { useState, lazy, Suspense, memo, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Plus, Library, FolderOpen, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';
import { useAuth } from '@/hooks/useAuth';
import { useActiveGenerations } from '@/hooks/generation/useActiveGenerations';
import { Badge } from '@/components/ui/badge';
import { preloadRoute } from '@/lib/route-preloader';
import { typographyClass } from '@/lib/design-tokens';

// Lazy load heavy sheet component
const GenerateSheet = lazy(() => import('./GenerateSheet').then(m => ({ default: m.GenerateSheet })));

/**
 * Optimized navigation - 5 items with FAB in center
 * OPTIMIZED: Uses CSS animations instead of framer-motion for better performance
 * 
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
  const [isVisible, setIsVisible] = useState(false);
  const { data: activeGenerations = [] } = useActiveGenerations();
  const activeGenCount = activeGenerations.length;

  // Trigger CSS animation on mount - properly using useEffect
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleNavigate = useCallback((path: string) => {
    hapticFeedback('light');
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

  const handlePreload = useCallback((path: string) => {
    if (path.startsWith('__')) return;
    preloadRoute(path);
  }, []);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      <nav
        className={cn(
          "island-nav z-navigation nav-slide-up",
          isVisible && "nav-visible"
        )}
        role="navigation"
        aria-label="Главная навигация"
      >
        <div className="flex items-center justify-around h-14">
          {navItems.map((item, index) => {
            if (item.isCenter) {
              return (
                <div key={item.path} className="relative overflow-visible">
                  <button
                    onClick={handleGenerateClick}
                    className={cn(
                      "relative flex items-center justify-center w-14 h-14 -my-2 rounded-full",
                      "bg-gradient-to-br from-primary to-generate shadow-md shadow-primary/25",
                      "fab nav-item-enter active:scale-92 hover:scale-105 transition-transform duration-150",
                      activeGenCount > 0 && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
                    )}
                    style={{ animationDelay: `${50 + index * 30}ms` }}
                    aria-label={item.label}
                    title={item.label}
                  >
                    {/* Pulsing ring when generations are active - CSS animation */}
                    {activeGenCount > 0 && (
                      <span className="absolute inset-0 rounded-full bg-primary/30 fab-pulse" />
                    )}
                    <Plus className="w-4.5 h-4.5 text-primary-foreground relative z-10" />
                  </button>
                  
                  {/* Active generations badge */}
                  {activeGenCount > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 z-20 badge-pop">
                      <Badge 
                        className="h-5 min-w-5 px-1 text-[10px] bg-destructive text-destructive-foreground border-2 border-background shadow-sm"
                      >
                        {activeGenCount > 9 ? '9+' : activeGenCount}
                      </Badge>
                    </div>
                  )}
                </div>
              );
            }

            const handleClick = () => handleNavigate(item.path);
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={handleClick}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl",
                  "min-h-touch min-w-touch nav-item-enter active:scale-92 hover:scale-105 transition-transform duration-150",
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
                style={{ animationDelay: `${50 + index * 30}ms` }}
                onMouseEnter={() => handlePreload(item.path)}
                onTouchStart={() => handlePreload(item.path)}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                title={item.label}
              >
                <div className={cn(
                  "relative transition-transform duration-200",
                  active && "scale-110 -translate-y-0.5"
                )}>
                  <item.icon className="w-4.5 h-4.5" />
                </div>
                <span
                  className={cn(
                    "text-[9px] transition-all duration-200",
                    typographyClass.caption,
                    active ? "font-semibold" : "font-medium"
                  )}
                  style={{ fontSize: '9px' }}
                >
                  {item.label}
                </span>

                {/* Active indicator - CSS transition */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-xl bg-primary/5 border border-primary/20 transition-all duration-200",
                    active ? "opacity-100 scale-100" : "opacity-0 scale-90"
                  )}
                />
              </button>
            );
          })}
        </div>
      </nav>

      {/* Lazy load GenerateSheet only when opened */}
      {generateOpen && (
        <Suspense fallback={null}>
          <GenerateSheet open={generateOpen} onOpenChange={setGenerateOpen} />
        </Suspense>
      )}
    </>
  );
});
