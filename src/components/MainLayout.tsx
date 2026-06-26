import { useState, useEffect, useMemo, lazy, Suspense, useCallback } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { BottomNavigation } from "./BottomNavigation";
import { Sidebar } from "./Sidebar";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ResizablePlayer } from "./ResizablePlayer";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { usePlaybackTracking } from "@/hooks/usePlaybackTracking";
import { SkipToContent } from "./ui/skip-to-content";
import { GuestModeBanner } from "./GuestModeBanner";
import { ScreenshotNavigator } from "./screenshot/ScreenshotNavigator";
import { ScreenshotModeBanner } from "./screenshot/ScreenshotModeBanner";
import { OfflineBanner } from "./offline/OfflineBanner";
import { useGuestMode } from "@/contexts/GuestModeContext";
import { cn } from "@/lib/utils";
import { setSubscriptionDialogCallback } from "@/hooks/useTrackActions";
import { useTelegramSettingsButton } from "@/hooks/telegram";
import { SmartAlertProvider } from "./notifications/smart-alerts";
import { useUserJourneyState } from "@/hooks/useUserJourneyState";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useGenerationResult } from "@/hooks/generation";
import { useWelcomeBonusCheck } from "@/hooks/useCreditsLimits";
import { useAdminDailyStats } from "@/hooks/useAdminDailyStats";
import { TELEGRAM_SAFE_AREA } from "@/constants/safe-area";
import { KeyboardShortcutsProvider } from "./navigation/KeyboardShortcutsProvider";
import { SafeAreaContainer } from "./layout/SafeAreaContainer";

// Lazy load heavy dialogs - not needed on initial render
const TelegramOnboarding = lazy(() =>
  import("./onboarding/TelegramOnboarding").then((m) => ({ default: m.TelegramOnboarding })),
);
const QuickStartOverlay = lazy(() =>
  import("./onboarding/QuickStartOverlay").then((m) => ({ default: m.QuickStartOverlay })),
);
const SubscriptionRequiredDialog = lazy(() =>
  import("./dialogs/SubscriptionRequiredDialog").then((m) => ({ default: m.SubscriptionRequiredDialog })),
);
const GamificationOnboarding = lazy(() =>
  import("./gamification/GamificationOnboarding").then((m) => ({ default: m.GamificationOnboarding })),
);
const GenerateSheet = lazy(() => import("./GenerateSheet").then((m) => ({ default: m.GenerateSheet })));
const GenerationResultSheet = lazy(() =>
  import("./generate-form/GenerationResultSheet").then((m) => ({ default: m.GenerationResultSheet })),
);
const WelcomeBonusPopup = lazy(() =>
  import("./popups/WelcomeBonusPopup").then((m) => ({ default: m.WelcomeBonusPopup })),
);
const SafeAreaDebugOverlay = lazy(() =>
  import("./dev/SafeAreaDebugOverlay").then((m) => ({ default: m.SafeAreaDebugOverlay })),
);

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

export const MainLayout = () => {
  // Adaptive sidebar/bottom-nav switching (UI audit Stage 2):
  //   - mobile/tablet-portrait (<1024px) → BottomNavigation, no fixed Sidebar
  //   - tablet-landscape / small desktop (1024–1279px) → Sidebar collapsed to icon-only
  //   - desktop (≥1280px) → Sidebar full / user-controlled
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isCompactDesktop = useMediaQuery("(min-width: 1024px) and (max-width: 1279px)");
  // Mobile landscape edge-rail: short viewports in landscape orientation get a
  // narrow icon-only sidebar instead of BottomNavigation, so floating UI
  // (UnifiedNotesViewer, sheets) doesn't get overlapped by the bottom bar.
  const isMobileLandscape = useMediaQuery("(max-width: 1023px) and (orientation: landscape) and (max-height: 500px)");
  const { isGuestMode } = useGuestMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [gamificationOnboardingOpen, setGamificationOnboardingOpen] = useState(false);
  const [quickStartOpen, setQuickStartOpen] = useState(false);
  const [generateSheetOpen, setGenerateSheetOpen] = useState(false);
  const [welcomeBonusOpen, setWelcomeBonusOpen] = useState(false);
  const hasActiveTrack = usePlayerStore((s) => Boolean(s.activeTrack));

  // Pages that have their own bottom navigation/tabs - don't show global BottomNavigation
  const hasOwnBottomNav = useMemo(() => {
    const p = location.pathname;
    return (
      p.startsWith("/studio") || p.startsWith("/stem-studio") || (p.startsWith("/project/") && p.includes("/studio"))
    );
  }, [location.pathname]);

  // Expose player + bottom-nav heights as CSS variables so any section can
  // align without re-computing the math (Block 3 of redesign plan).
  useEffect(() => {
    const root = document.documentElement;
    const showBottomNav = !isDesktop && !isMobileLandscape && !hasOwnBottomNav;
    const navH = showBottomNav ? 84 : 0; // BottomNav dock ~64px + 0.5rem bottom margin + buffer
    const playerH = hasActiveTrack ? (isDesktop ? 96 : 72) : 0;
    // Publish BOTH legacy and canonical names so old call-sites + new
    // `--bottom-stack-h` math both resolve correctly.
    root.style.setProperty("--nav-h", `${navH}px`);
    root.style.setProperty("--bottom-nav-h", `${navH}px`);
    root.style.setProperty("--player-h", `${playerH}px`);
    return () => {
      root.style.removeProperty("--nav-h");
      root.style.removeProperty("--bottom-nav-h");
      root.style.removeProperty("--player-h");
    };
  }, [hasActiveTrack, isDesktop, isMobileLandscape, hasOwnBottomNav]);

  // Welcome bonus check
  const { shouldShowWelcomeBonus, markWelcomeBonusShown } = useWelcomeBonusCheck();

  // Generation result sheet for post-generation A/B selection
  const { resultOpen, resultTrackId, resultTrackTitle, setResultOpen } = useGenerationResult();

  // User journey tracking
  const { shouldShowQuickStart, isNewUser, completedOnboarding } = useUserJourneyState();
  const { isActive: isOldOnboardingActive, completeOnboarding: completeOldOnboarding } = useOnboarding();

  // Sidebar collapse state — auto-collapsed on compact desktop unless user
  // explicitly expanded it.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored !== null) return stored === "true";
      // default: collapsed on narrow desktop
      return window.matchMedia("(max-width: 1279px)").matches;
    }
    return false;
  });

  // Mobile drawer (S3.1): exposes full Sidebar nav on portrait mobile via Sheet.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);


  // When viewport shrinks to compact-desktop range, auto-collapse unless the
  // user has explicitly chosen the expanded state.
  useEffect(() => {
    if (isCompactDesktop && localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === null) {
      setSidebarCollapsed(true);
    }
  }, [isCompactDesktop]);

  // Track play counts when tracks are played
  usePlaybackTracking();

  // Show daily admin stats notification (only for admins)
  useAdminDailyStats();

  // Memoize pathname to prevent unnecessary re-renders
  const pathname = useMemo(() => location.pathname, [location.pathname]);

  // Show Telegram Settings Button on all pages except /settings
  const showSettingsButton = pathname !== "/settings";
  useTelegramSettingsButton({ visible: showSettingsButton });

  // Register subscription dialog callback
  useEffect(() => {
    setSubscriptionDialogCallback(setSubscriptionDialogOpen);
    return () => setSubscriptionDialogCallback(() => {});
  }, []);

  // Show Quick Start for new users (replacing old onboarding)
  useEffect(() => {
    if (shouldShowQuickStart && !isOldOnboardingActive) {
      const timer = setTimeout(() => {
        setQuickStartOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [shouldShowQuickStart, isOldOnboardingActive]);

  // Check if gamification onboarding should show (after first checkin)
  useEffect(() => {
    const hasSeenGamificationOnboarding = localStorage.getItem("gamification-onboarding-completed");
    const hasCompletedFirstCheckin = localStorage.getItem("first-checkin-completed");

    if (hasCompletedFirstCheckin && !hasSeenGamificationOnboarding) {
      // Delay to show after checkin celebration
      const timer = setTimeout(() => {
        setGamificationOnboardingOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Show welcome bonus popup for new users
  useEffect(() => {
    if (shouldShowWelcomeBonus && !welcomeBonusOpen) {
      const timer = setTimeout(() => {
        setWelcomeBonusOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldShowWelcomeBonus, welcomeBonusOpen]);

  const handleWelcomeBonusClose = useCallback(() => {
    setWelcomeBonusOpen(false);
    markWelcomeBonusShown();
  }, [markWelcomeBonusShown]);

  const handleGamificationOnboardingComplete = () => {
    localStorage.setItem("gamification-onboarding-completed", "true");
    setGamificationOnboardingOpen(false);
  };

  // Quick Start handlers
  const handleQuickStartClose = useCallback(() => {
    setQuickStartOpen(false);
    // Also complete old onboarding if it was pending
    completeOldOnboarding();
  }, [completeOldOnboarding]);

  const handleStartGeneration = useCallback(() => {
    setQuickStartOpen(false);
    setGenerateSheetOpen(true);
    completeOldOnboarding();
  }, [completeOldOnboarding]);

  const handleStartListening = useCallback(() => {
    setQuickStartOpen(false);
    completeOldOnboarding();
    // Scroll to popular tracks on homepage
    navigate("/");
  }, [navigate, completeOldOnboarding]);

  const handleStartTour = useCallback(() => {
    setQuickStartOpen(false);
    // Trigger old onboarding for full tour
  }, []);

  const handleSidebarCollapsedChange = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, []);

  // Calculate sidebar width based on collapsed state
  const sidebarWidth = sidebarCollapsed ? "w-16" : "w-64";
  const mainMargin = sidebarCollapsed ? "ml-16" : "ml-64";

  return (
    <SmartAlertProvider>
      <KeyboardShortcutsProvider onOpenGenerateSheet={() => setGenerateSheetOpen(true)}>
        <div className="flex flex-col h-screen bg-background">
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Skip to content for keyboard navigation */}
            <SkipToContent />

            {/* Guest mode banner - subtle and compact */}
            {isGuestMode && <GuestModeBanner />}

            {/* Screenshot mode components */}
            <ScreenshotModeBanner />
            <ScreenshotNavigator />

            {/* Offline Banner - shows when network is disconnected */}
            <OfflineBanner />

            {/* Quick Start Overlay for new users */}
            {quickStartOpen && (
              <Suspense fallback={null}>
                <QuickStartOverlay
                  isOpen={quickStartOpen}
                  onClose={handleQuickStartClose}
                  onStartGeneration={handleStartGeneration}
                  onStartListening={handleStartListening}
                  onStartTour={handleStartTour}
                />
              </Suspense>
            )}

            {/* Legacy Telegram Onboarding - for full tour */}
            <Suspense fallback={null}>
              <TelegramOnboarding />
            </Suspense>

            {/* Subscription Required Dialog - lazy loaded */}
            {subscriptionDialogOpen && (
              <Suspense fallback={null}>
                <SubscriptionRequiredDialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen} />
              </Suspense>
            )}

            {/* Gamification Onboarding - lazy loaded */}
            {gamificationOnboardingOpen && (
              <Suspense fallback={null}>
                <GamificationOnboarding
                  open={gamificationOnboardingOpen}
                  onComplete={handleGamificationOnboardingComplete}
                />
              </Suspense>
            )}

            {/* Welcome Bonus Popup - for new users */}
            {welcomeBonusOpen && (
              <Suspense fallback={null}>
                <WelcomeBonusPopup open={welcomeBonusOpen} onClose={handleWelcomeBonusClose} />
              </Suspense>
            )}

            {isDesktop && (
              <div className={cn("fixed inset-y-0 z-navigation transition-all duration-300", sidebarWidth)}>
                <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={handleSidebarCollapsedChange} />
              </div>
            )}
            {/* Mobile landscape edge-rail */}
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
            <main
              id="main-content"
              className={cn(
                "flex-1 flex flex-col overflow-y-auto relative transition-all duration-300",
                isDesktop && mainMargin,
                !isDesktop && isMobileLandscape && "ml-14",
                isGuestMode && "pt-9",
              )}
              style={{
                minHeight: "var(--tg-viewport-stable-height, 100vh)",
                // Use the same --nav-h / --player-h CSS vars set above so padding
                // always tracks real chrome heights (BottomNav + CompactPlayer +
                // safe-area). Prevents the bottom of the page being hidden under
                // the dock on mobile/tablet, and matches landscape/desktop too.
                paddingBottom:
                  "calc(var(--nav-h, 0px) + var(--player-h, 0px) + max(env(safe-area-inset-bottom, 0px), var(--tg-safe-area-inset-bottom, 0px)) + 0.75rem)",
              }}
            >
              <SafeAreaContainer
                sides={isDesktop ? [] : ["left", "right"]}
                minPaddingRem={1}
                className={cn("flex-1", isDesktop ? "p-6" : "py-3")}
              >
                <div className="mx-auto w-full max-w-screen-2xl">
                  <Outlet />
                </div>
              </SafeAreaContainer>
            </main>
            {/* ResizablePlayer is rendered OUTSIDE <main> because #main-content has
          `contain: layout style` which would create a containing block for
          position:fixed descendants and break the bottom dock on mobile/tablet. */}
            <ResizablePlayer />
            {!isDesktop && !isMobileLandscape && !hasOwnBottomNav && <BottomNavigation />}

            {/* Generate Sheet - triggered from Quick Start */}
            {generateSheetOpen && (
              <Suspense fallback={null}>
                <GenerateSheet open={generateSheetOpen} onOpenChange={setGenerateSheetOpen} />
              </Suspense>
            )}

            {/* Generation Result Sheet - shows A/B versions after track creation */}
            {resultOpen && resultTrackId && (
              <Suspense fallback={null}>
                <GenerationResultSheet
                  open={resultOpen}
                  onOpenChange={setResultOpen}
                  trackId={resultTrackId}
                  trackTitle={resultTrackTitle || undefined}
                />
              </Suspense>
            )}
            <Suspense fallback={null}>
              <SafeAreaDebugOverlay />
            </Suspense>
          </div>
        </div>
      </KeyboardShortcutsProvider>
    </SmartAlertProvider>
  );
};
