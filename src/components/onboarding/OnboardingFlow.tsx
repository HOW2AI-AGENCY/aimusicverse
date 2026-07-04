import { useReducer, useCallback, useEffect, lazy, Suspense } from "react";
import { useUserJourneyState } from "@/hooks/useUserJourneyState";
import { useOnboarding } from "@/hooks/useOnboarding";
import { type OnboardingStage, type OnboardingEvent, transitionOnboarding } from "./OnboardingStateMachine";

const QuickStartOverlay = lazy(() => import("./QuickStartOverlay").then((m) => ({ default: m.QuickStartOverlay })));

const TelegramOnboarding = lazy(() => import("./TelegramOnboarding").then((m) => ({ default: m.TelegramOnboarding })));

interface OnboardingFlowProps {
  onGenerateSheetOpen: () => void;
  onNavigateHome: () => void;
}

export function OnboardingFlow({ onGenerateSheetOpen, onNavigateHome }: OnboardingFlowProps) {
  const { shouldShowQuickStart } = useUserJourneyState();
  const { isActive, completeOnboarding } = useOnboarding();

  const [stage, dispatch] = useReducer((s: OnboardingStage, e: OnboardingEvent) => transitionOnboarding(s, e), "idle");

  useEffect(() => {
    if (shouldShowQuickStart && !isActive && stage === "idle") {
      const timer = setTimeout(() => dispatch({ type: "SHOW_QUICK_START" }), 800);
      return () => clearTimeout(timer);
    }
  }, [shouldShowQuickStart, isActive, stage]);

  const handleDismiss = useCallback(() => {
    completeOnboarding();
    dispatch({ type: "DISMISS" });
  }, [completeOnboarding]);

  const handleStartGeneration = useCallback(() => {
    completeOnboarding();
    dispatch({ type: "DISMISS" });
    onGenerateSheetOpen();
  }, [completeOnboarding, onGenerateSheetOpen]);

  const handleStartListening = useCallback(() => {
    completeOnboarding();
    dispatch({ type: "DISMISS" });
    onNavigateHome();
  }, [completeOnboarding, onNavigateHome]);

  const handleStartTour = useCallback(() => {
    dispatch({ type: "START_TOUR" });
  }, []);

  return (
    <Suspense fallback={null}>
      {/* TelegramOnboarding self-manages visibility via useOnboarding store */}
      <TelegramOnboarding />

      {stage === "quick-start" && (
        <QuickStartOverlay
          isOpen
          onClose={handleDismiss}
          onStartGeneration={handleStartGeneration}
          onStartListening={handleStartListening}
          onStartTour={handleStartTour}
        />
      )}
    </Suspense>
  );
}
