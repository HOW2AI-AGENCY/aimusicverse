import { useState, lazy, Suspense, memo, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Plus, Library, FolderOpen, User } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useTelegram } from "@/contexts/TelegramContext";
import { useAuth } from "@/hooks/useAuth";
import { useActiveGenerations } from "@/hooks/generation/useActiveGenerations";
import { Badge } from "@/components/ui/badge";
import { preloadRoute } from "@/lib/route-preloader";
import { typographyClass } from "@/lib/design-tokens";
import { GenerationProgressBadge } from "@/components/loading/GenerationProgressBadge";

// Lazy load heavy sheet component
const GenerateSheet = lazy(() => import("./GenerateSheet").then((m) => ({ default: m.GenerateSheet })));

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
  { path: "/", icon: Home, label: "Главная", isCenter: false },
  { path: "/library", icon: Library, label: "Библиотека", isCenter: false },
  { path: "__generate__", icon: Plus, label: "Создать", isCenter: true },
  { path: "/projects", icon: FolderOpen, label: "Проекты", isCenter: false },
  { path: "/profile", icon: User, label: "Профиль", isCenter: false },
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

  const handleNavigate = useCallback(
    (path: string) => {
      hapticFeedback("light");
      if (path === "/profile" && user?.id) {
        navigate(`/profile/${user.id}`);
      } else {
        navigate(path);
      }
    },
    [hapticFeedback, navigate, user?.id],
  );

  const [showCreateHint, setShowCreateHint] = useState(false);

  useEffect(() => {
    const hasSeenHint = localStorage.getItem("musicverse_seen_create_hint");
    if (!hasSeenHint) {
      const timer = setTimeout(() => {
        setShowCreateHint(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissHint = useCallback(() => {
    localStorage.setItem("musicverse_seen_create_hint", "true");
    setShowCreateHint(false);
  }, []);

  const handleGenerateClick = useCallback(() => {
    hapticFeedback("medium");
    setGenerateOpen(true);
    dismissHint();
  }, [hapticFeedback, dismissHint]);

  const handlePreload = useCallback((path: string) => {
    if (path.startsWith("__")) return;
    preloadRoute(path);
  }, []);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <>
      {activeGenCount > 0 && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center z-navigation pointer-events-none">
          <GenerationProgressBadge active count={activeGenCount} />
        </div>
      )}
      <nav
        className={cn("island-nav z-navigation nav-slide-up", isVisible && "nav-visible")}
        role="navigation"
        aria-label="Главная навигация"
      >
        <div className="flex items-center justify-between h-14 px-1">
          {navItems.map((item, index) => {
            if (item.isCenter) {
              return (
                <div key={item.path} className="relative flex-1 flex items-center justify-center overflow-visible">
                  {showCreateHint && (
                    <div className="absolute bottom-16 bg-popover/95 border border-primary/20 backdrop-blur px-3 py-1.5 rounded-lg shadow-lg text-[11px] font-medium text-foreground whitespace-nowrap z-50 animate-bounce flex items-center gap-1.5">
                      <span>Создайте первый трек здесь! ✨</span>
                      <button
                        onClick={dismissHint}
                        className="ml-1 p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground font-bold"
                        aria-label="Закрыть"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleGenerateClick}
                    className={cn(
                      "relative flex items-center justify-center w-12 h-12 rounded-2xl",
                      "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
                      "aurora-glow",
                      "active:scale-92 hover:scale-105 transition-all duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      activeGenCount > 0 && "sheen ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
                    )}
                    style={{ animationDelay: `${50 + index * 30}ms` }}
                    aria-label={item.label}
                    title={item.label}
                  >
                    {activeGenCount > 0 && <span className="absolute inset-0 rounded-2xl bg-primary/30 fab-pulse" />}
                    <Plus className="w-5 h-5 relative z-10" strokeWidth={2.4} />
                  </button>

                  {activeGenCount > 0 && (
                    <div className="absolute -top-1 -right-0.5 z-20 badge-pop">
                      <Badge className="h-4 min-w-4 px-1 text-[9px] leading-none bg-destructive text-destructive-foreground border-2 border-background shadow-sm">
                        {activeGenCount > 9 ? "9+" : activeGenCount}
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
                  "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl",
                  "transition-colors duration-200 select-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  active ? "text-foreground" : "text-muted-foreground/80 hover:text-foreground",
                )}
                style={{ animationDelay: `${50 + index * 30}ms` }}
                onMouseEnter={() => handlePreload(item.path)}
                onTouchStart={() => handlePreload(item.path)}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                title={item.label}
              >
                {/* Subtle pill indicator behind icon when active */}
                <span
                  className={cn(
                    "absolute top-1 h-7 w-10 rounded-full bg-primary/12 ring-1 ring-primary/25 transition-all duration-200",
                    active ? "opacity-100 scale-100" : "opacity-0 scale-75",
                  )}
                  aria-hidden
                />
                <item.icon
                  className={cn("relative w-5 h-5 transition-transform duration-200", active && "text-primary")}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span
                  className={cn(
                    "relative text-[11px] leading-none tracking-tight transition-all duration-200",
                    typographyClass.caption,
                    active ? "font-semibold text-foreground" : "font-medium",
                  )}
                >
                  {item.label}
                </span>
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
