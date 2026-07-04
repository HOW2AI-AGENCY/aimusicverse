import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Sidebar } from "@/components/Sidebar";
import { BottomNavigation } from "@/components/BottomNavigation";
import { cn } from "@/lib/utils";

/**
 * NavigationShell — single orchestration point for app navigation.
 *
 * Breakpoint behaviour:
 *   < 1024px (portrait)  → BottomNavigation (mobile dock)
 *   < 1024px (landscape) → edge-rail Sidebar (icon-only, no bottom nav)
 *   1024–1279px          → collapsible icon-only Sidebar
 *   ≥ 1280px             → full Sidebar (user-controlled collapse)
 *
 * Publishes --nav-h, --bottom-nav-h, --player-h CSS vars for descendants.
 * Children receive layout state via render props so they don't need their
 * own media-query hooks for navigation-driven layout.
 */

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

/** Pages that have their own bottom nav — suppress the global dock */
function useHasOwnBottomNav() {
  const { pathname } = useLocation();
  return (
    pathname.startsWith("/studio") ||
    pathname.startsWith("/stem-studio") ||
    (pathname.startsWith("/project/") && pathname.includes("/studio"))
  );
}

export interface NavigationShellRenderProps {
  /** CSS margin-left class to apply to the main content area */
  mainMarginClass: string;
  isDesktop: boolean;
  isMobileLandscape: boolean;
}

interface NavigationShellProps {
  hasActiveTrack: boolean;
  children: (props: NavigationShellRenderProps) => React.ReactNode;
}

export function NavigationShell({ hasActiveTrack, children }: NavigationShellProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isCompactDesktop = useMediaQuery("(min-width: 1024px) and (max-width: 1279px)");
  const isMobileLandscape = useMediaQuery("(max-width: 1023px) and (orientation: landscape) and (max-height: 500px)");
  const hasOwnBottomNav = useHasOwnBottomNav();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored !== null) return stored === "true";
      return window.matchMedia("(max-width: 1279px)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (isCompactDesktop && localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === null) {
      setSidebarCollapsed(true);
    }
  }, [isCompactDesktop]);

  // Publish layout heights as CSS vars for all descendants
  useEffect(() => {
    const root = document.documentElement;
    const showBottomNav = !isDesktop && !isMobileLandscape && !hasOwnBottomNav;
    const navH = showBottomNav ? 84 : 0;
    const playerH = hasActiveTrack ? (isDesktop ? 96 : 72) : 0;
    root.style.setProperty("--nav-h", `${navH}px`);
    root.style.setProperty("--bottom-nav-h", `${navH}px`);
    root.style.setProperty("--player-h", `${playerH}px`);
    return () => {
      root.style.removeProperty("--nav-h");
      root.style.removeProperty("--bottom-nav-h");
      root.style.removeProperty("--player-h");
    };
  }, [hasActiveTrack, isDesktop, isMobileLandscape, hasOwnBottomNav]);

  const handleSidebarCollapsedChange = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, []);

  const sidebarWidth = sidebarCollapsed ? "w-16" : "w-64";
  const mainMarginClass = isDesktop ? (sidebarCollapsed ? "ml-16" : "ml-64") : isMobileLandscape ? "ml-14" : "";

  return (
    <>
      {/* Desktop fixed sidebar */}
      {isDesktop && (
        <div className={cn("fixed inset-y-0 z-navigation transition-all duration-300", sidebarWidth)}>
          <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={handleSidebarCollapsedChange} />
        </div>
      )}

      {/* Mobile landscape edge-rail (icon-only, no bottom nav) */}
      {!isDesktop && isMobileLandscape && (
        <div
          data-testid="edge-rail"
          className="fixed inset-y-0 left-0 z-navigation w-14"
          style={{
            paddingLeft: "max(env(safe-area-inset-left, 0px), var(--tg-safe-area-inset-left, 0px))",
          }}
        >
          <Sidebar collapsed onCollapsedChange={() => {}} />
        </div>
      )}

      {children({ mainMarginClass, isDesktop, isMobileLandscape })}

      {/* Mobile bottom nav */}
      {!isDesktop && !isMobileLandscape && !hasOwnBottomNav && <BottomNavigation />}
    </>
  );
}
