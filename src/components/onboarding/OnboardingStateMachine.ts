export type OnboardingStage = "idle" | "quick-start" | "feature-tour" | "done";

export type OnboardingEvent = { type: "SHOW_QUICK_START" } | { type: "START_TOUR" } | { type: "DISMISS" };

export function transitionOnboarding(stage: OnboardingStage, event: OnboardingEvent): OnboardingStage {
  switch (stage) {
    case "idle":
      return event.type === "SHOW_QUICK_START" ? "quick-start" : stage;
    case "quick-start":
      if (event.type === "START_TOUR") return "feature-tour";
      if (event.type === "DISMISS") return "done";
      return stage;
    case "feature-tour":
      return event.type === "DISMISS" ? "done" : stage;
    case "done":
      return stage;
  }
}
