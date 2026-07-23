import { useState, useEffect, useMemo, lazy, Suspense, useCallback } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
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
import { useGenerationResult } from "@/hooks/generation/useGenerationResult";
import { useWelcomeBonusCheck } from "@/hooks/useCreditsLimits";
import { useAdminDailyStats } from "@/hooks/useAdminDailyStats";
import { useActiveGenerations } from "@/hooks/generation/useActiveGenerations";
import { useTelegramEmojiStatus } from "@/hooks/telegram";
import { KeyboardShortcutsProvider } from "./navigation/KeyboardShortcutsProvider";
import { SafeAreaContainer } from "./layout/SafeAreaContainer";
import { OnboardingFlow } from "./onboarding/OnboardingFlow";
import { NavigationShell } from "./navigation/NavigationShell";
import { PlayerTransitionProvider } from "./player/PlayerTransitionProvider";
import { listenOpenGenerateSheet } from "@/lib/events";

// Lazy load heavy dialogs - not needed on initial render
const SubscriptionRequiredDialog = lazy(() =>
  import("./dialog/SubscriptionRequiredDialog").then((m) => ({ default: m.SubscriptionRequiredDialog })),
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

export const MainLayout = () => {
  const { isGuestMode } = useGuestMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [gamificationOnboardingOpen, setGamificationOnboardingOpen] = useState(false);
  const [generateSheetOpen, setGenerateSheetOpen] = useState(false);
  const [welcomeBonusOpen, setWelcomeBonusOpen] = useState(false);
  const hasActiveTrack = usePlayerStore((s) => Boolean(s.activeTrack));

  // Welcome bonus check
  const { shouldShowWelcomeBonus, markWelcomeBonusShown } = useWelcomeBonusCheck();

  // Generation result sheet for post-generation A/B selection
  const { resultOpen, resultTrackId, resultTrackTitle, setResultOpen } = useGenerationResult();

  // Track play counts when tracks are played
  usePlaybackTracking();

  // Emoji status sync — shows 🎵 during generation, 🎧 during playback
  const { setStatus: setEmoji, clearStatus: clearEmoji } = useTelegramEmojiStatus();
  const { data: activeGenerations = [] } = useActiveGenerations();
  const hasActiveGenerations = activeGenerations.length > 0;

  useEffect(() => {
    if (hasActiveGenerations) {
      setEmoji("generating");
    } else if (hasActiveTrack) {
      setEmoji("listening");
    } else {
      clearEmoji();
    }
  }, [hasActiveGenerations, hasActiveTrack, setEmoji, clearEmoji]);

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

  // Check if gamification onboarding should show (after first checkin)
  useEffect(() => {
    const hasSeenGamificationOnboarding = localStorage.getItem("gamification-onboarding-completed");
    const hasCompletedFirstCheckin = localStorage.getItem("first-checkin-completed");

    if (hasCompletedFirstCheckin && !hasSeenGamificationOnboarding) {
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

  // Single source of truth for GenerateSheet — listen for custom event
  // so BottomNavigation, Index, and other children can trigger it
  useEffect(() => {
    return listenOpenGenerateSheet(() => setGenerateSheetOpen(true));
  }, []);

  const handleWelcomeBonusClose = useCallback(() => {
    setWelcomeBonusOpen(false);
    markWelcomeBonusShown();
  }, [markWelcomeBonusShown]);

  const handleGamificationOnboardingComplete = () => {
    localStorage.setItem("gamification-onboarding-completed", "true");
    setGamificationOnboardingOpen(false);
  };

  return (
    <SmartAlertProvider>
      <PlayerTransitionProvider>
        <KeyboardShortcutsProvider onOpenGenerateSheet={() => setGenerateSheetOpen(true)}>
          <div className="flex flex-col h-screen bg-background noise-overlay">
            <div className="flex flex-1 min-h-0 overflow-hidden">
              <SkipToContent />
              {isGuestMode && <GuestModeBanner />}
              <ScreenshotModeBanner />
              <ScreenshotNavigator />
              <OfflineBanner />

              {/* Onboarding flow: QuickStart → optional TelegramOnboarding tour */}
              <OnboardingFlow
                onGenerateSheetOpen={() => setGenerateSheetOpen(true)}
                onNavigateHome={() => navigate("/")}
              />

              {/* Subscription Required Dialog */}
              {subscriptionDialogOpen && (
                <Suspense fallback={null}>
                  <SubscriptionRequiredDialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen} />
                </Suspense>
              )}

              {/* Gamification Onboarding */}
              {gamificationOnboardingOpen && (
                <Suspense fallback={null}>
                  <GamificationOnboarding
                    open={gamificationOnboardingOpen}
                    onComplete={handleGamificationOnboardingComplete}
                  />
                </Suspense>
              )}

              {/* Welcome Bonus Popup */}
              {welcomeBonusOpen && (
                <Suspense fallback={null}>
                  <WelcomeBonusPopup open={welcomeBonusOpen} onClose={handleWelcomeBonusClose} />
                </Suspense>
              )}

              {/* NavigationShell: owns sidebar/bottom-nav orchestration + CSS var publishing */}
              <NavigationShell hasActiveTrack={hasActiveTrack}>
                {({ mainMarginClass, isDesktop, isMobileLandscape }) => (
                  <>
                    <main
                      id="main-content"
                      aria-label="Основное содержимое"
                      tabIndex={-1}
                      className={cn(
                        "flex-1 flex flex-col overflow-y-auto relative transition-all duration-300",
                        mainMarginClass,
                        isGuestMode && "pt-9",
                      )}
                      style={{
                        minHeight: "var(--tg-viewport-stable-height, 100vh)",
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
                      `contain: layout style` which creates a containing block for
                      position:fixed descendants, breaking the bottom dock on mobile. */}
                    <ResizablePlayer />
                  </>
                )}
              </NavigationShell>

              {/* Generate Sheet - triggered from Quick Start / keyboard */}
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
      </PlayerTransitionProvider>
    </SmartAlertProvider>
  );
};
