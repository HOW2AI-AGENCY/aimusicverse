import { useState, memo, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Home, Plus, Library, FolderOpen, User } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useTelegram } from "@/contexts/TelegramContext";
import { useAuth } from "@/hooks/useAuth";
import { useActiveGenerations } from "@/hooks/generation/useActiveGenerations";
import { useKeyboardAware } from "@/hooks/useKeyboardAware";
import { Badge } from "@/components/ui/badge";
import { preloadRoute } from "@/lib/route-preloader";
import { typographyClass } from "@/lib/design-tokens";
import { GenerationProgressBadge } from "@/components/loading/GenerationProgressBadge";
import { dispatchOpenGenerateSheet } from "@/lib/events";

/**
 * Bottom navigation — 5 items with center FAB.
 * OPTIMIZED: CSS animations instead of framer-motion.
 *
 * - Home: Main page
 * - Library: Tracks & projects
 * - Create (+): Generation FAB (center)
 * - Projects: Music projects and lyrics
 * - Profile: User profile & settings
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
  const [isVisible, setIsVisible] = useState(false);
  const { data: activeGenerations = [] } = useActiveGenerations();
  const activeGenCount = activeGenerations.length;

  // Sprint 055-B4: keyboard-aware badge positioning
  const { keyboardHeight, isKeyboardOpen } = useKeyboardAware();

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
    dispatchOpenGenerateSheet();
    dismissHint();
  }, [hapticFeedback, dismissHint]);

  const handlePreload = useCallback((path: string) => {
    if (path.startsWith("__")) return;
    preloadRoute(path);
  }, []);

  // Sprint 045 Phase B-3: previously used `path + "/"` prefix match for all
  // entries, which meant Home (`/`) stayed active on every nested route because
  // every pathname starts with `/`. Use exact match for root and prefix match
  // for nested sections so only the matching tab is highlighted.
  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <>
      {activeGenCount > 0 && (
        <div
          className="fixed left-0 right-0 flex justify-center z-navigation pointer-events-none"
          style={{
            bottom: isKeyboardOpen
              ? `${keyboardHeight + 80}px`
              : "max(5rem, calc(var(--tg-viewport-stable-height, 100vh) - var(--tg-viewport-height, 100vh) + 5rem))",
          }}
        >
          <GenerationProgressBadge active count={activeGenCount} />
        </div>
      )}
      <nav
        className={cn("island-nav z-navigation nav-slide-up", isVisible && "nav-visible")}
        role="navigation"
        aria-label="Нижняя навигация"
      >
        <div className="flex items-center justify-between h-14 px-1">
          {navItems.map((item, index) => {
            if (item.isCenter) {
              return (
                <div key={item.path} className="relative flex-1 flex items-center justify-center overflow-visible">
                  {showCreateHint && (
                    <div
                      className={cn(
                        "absolute -top-12 -translate-y-full bg-popover/95 border border-primary/20 backdrop-blur px-3 py-1.5 rounded-lg shadow-lg font-medium text-foreground whitespace-nowrap z-50 animate-bob-subtle flex items-center gap-1.5",
                        typographyClass.caption,
                      )}
                    >
                      <span>Создайте первый трек здесь!</span>
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
                      "aurora-glow glow-primary motion-reduce:animate-none",
                      "active:scale-90 hover:scale-105 transition-transform duration-300",
                      "[transition-timing-function:cubic-bezier(0.25,0.1,0.25,1)]",
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
                      <Badge className="h-4 min-w-4 px-1 text-[0.5625rem] leading-none bg-destructive text-destructive-foreground border-2 border-background shadow-sm">
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
                {/* Subtle pill indicator behind icon when active — bounce-eased pop */}
                <span
                  className={cn(
                    "absolute top-1 h-7 w-10 rounded-full bg-primary/12 ring-1 ring-primary/25",
                    "transition-all duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
                    "motion-reduce:transition-none",
                    active ? "opacity-100 scale-100" : "opacity-0 scale-75",
                  )}
                  aria-hidden
                />
                <item.icon
                  className={cn(
                    "relative w-5 h-5 transition-transform duration-300",
                    "[transition-timing-function:cubic-bezier(0.25,0.1,0.25,1)]",
                    "motion-reduce:transition-none",
                    active && "text-primary scale-110 -translate-y-0.5",
                  )}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span
                  className={cn(
                    "relative transition-all duration-300",
                    "[transition-timing-function:cubic-bezier(0.25,0.1,0.25,1)]",
                    "motion-reduce:transition-none",
                    typographyClass.caption,
                    active ? "font-semibold text-foreground -translate-y-0.5" : "font-medium",
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
});
