# Lyric Generation

> 522 nodes · cohesion 0.01

## Key Concepts

- [getItem()](file:///D:/.MUSICVERSE/aimusicverse/src/lib/cloudStorage.ts#L83) (59 connections)
- [setItem()](file:///D:/.MUSICVERSE/aimusicverse/src/lib/cloudStorage.ts#L39) (58 connections)
- [.parse()](file:///D:/.MUSICVERSE/aimusicverse/src/lib/lyrics/LyricsParser.ts#L97) (56 connections)
- [UnifiedLyricsView.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/lyrics/UnifiedLyricsView.tsx#L1) (44 connections)
- [rateLimiting.test.ts](file:///D:/.MUSICVERSE/aimusicverse/tests/integration/rateLimiting.test.ts#L1) (29 connections)
- [PromptHistory.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/generate-form/PromptHistory.tsx#L1) (27 connections)
- [deeplink-tracker.ts](file:///D:/.MUSICVERSE/aimusicverse/src/lib/analytics/deeplink-tracker.ts#L1) (24 connections)
- [MainLayout.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/MainLayout.tsx#L1) (23 connections)
- [LyricsParser](file:///D:/.MUSICVERSE/aimusicverse/src/lib/lyrics/LyricsParser.ts#L93) (23 connections)
- [removeItem()](file:///D:/.MUSICVERSE/aimusicverse/src/lib/cloudStorage.ts#L182) (19 connections)
- [GamificationOnboarding.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/gamification/GamificationOnboarding.tsx#L1) (18 connections)
- [QueueSheet.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/player/QueueSheet.tsx#L1) (15 connections)
- [index.ts](file:///D:/.MUSICVERSE/aimusicverse/src/lib/ab-testing/index.ts#L1) (15 connections)
- [PaymentFail.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/pages/payments/PaymentFail.tsx#L1) (15 connections)
- [Templates.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/pages/Templates.tsx#L1) (15 connections)
- [ContinueDraftCard.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/home/ContinueDraftCard.tsx#L1) (12 connections)
- [WorkflowEngine](file:///D:/.MUSICVERSE/aimusicverse/src/lib/workflow-engine.ts#L234) (12 connections)
- [cloudStorage.ts](file:///D:/.MUSICVERSE/aimusicverse/src/lib/cloudStorage.ts#L1) (11 connections)
- [session.service.ts](file:///D:/.MUSICVERSE/aimusicverse/src/services/analytics/session.service.ts#L1) (11 connections)
- [.getState()](file:///D:/.MUSICVERSE/aimusicverse/src/lib/workflow-engine.ts#L257) (11 connections)
- [HintRegistry.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/hints/HintRegistry.tsx#L1) (10 connections)
- [ProfileSetupOnboarding.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/onboarding/ProfileSetupOnboarding.tsx#L1) (10 connections)
- [ProactiveUpsellBanner.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/premium/ProactiveUpsellBanner.tsx#L1) (10 connections)
- [FeatureHighlight.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/onboarding/FeatureHighlight.tsx#L1) (9 connections)
- [AnnouncementContext.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/contexts/AnnouncementContext.tsx#L1) (9 connections)
- *... and 497 more nodes in this community*

## Class Diagram

```mermaid
classDiagram
    class LyricsParser {
        +LyricsParser.ts()
        +.parse()
        +.extractSections()
        +.detectSectionType()
        +.extractInlineTags()
        +.detectTagType()
        +.extractAllTags()
        +.validateTags()
        +.analyzeSyllables()
        +.countSyllables()
    }
    class WorkflowEngine {
        +workflow-engine.ts()
        +.startWorkflow()
        +.getState()
        +.saveState()
        +.completeStep()
        +.goToStep()
        +.skipWorkflow()
        +.clearState()
        +.getCurrentWorkflow()
        +.getCurrentStep()
    }
```

## Relationships

- No strong cross-community connections detected

## Source Files

- [D:\.MUSICVERSE\aimusicverse\scripts\track-bundle-size.js](file:///D:/.MUSICVERSE/aimusicverse/scripts/track-bundle-size.js)
- [D:\.MUSICVERSE\aimusicverse\src\components\ErrorBoundary.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/ErrorBoundary.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\MainLayout.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/MainLayout.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\TrackDetailSheet.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/TrackDetailSheet.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\announcements\SubscriptionFeatureAnnouncement.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/announcements/SubscriptionFeatureAnnouncement.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\gamification\GamificationOnboarding.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/gamification/GamificationOnboarding.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\generate-form\PromptHistory.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/generate-form/PromptHistory.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\generate-form\inspirationPrompts.ts](file:///D:/.MUSICVERSE/aimusicverse/src/components/generate-form/inspirationPrompts.ts)
- [D:\.MUSICVERSE\aimusicverse\src\components\hints\HintRegistry.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/hints/HintRegistry.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\home\ContinueDraftCard.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/home/ContinueDraftCard.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\layout\SystemAnnouncement.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/layout/SystemAnnouncement.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\lyrics\UnifiedLyricsView.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/lyrics/UnifiedLyricsView.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\music-graph\GraphOnboarding.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/music-graph/GraphOnboarding.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\navigation\RecentlyUsedSection.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/navigation/RecentlyUsedSection.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\onboarding\FeatureHighlight.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/onboarding/FeatureHighlight.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\onboarding\ProfileSetupOnboarding.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/onboarding/ProfileSetupOnboarding.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\player\QueueSheet.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/player/QueueSheet.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\premium\ProactiveUpsellBanner.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/premium/ProactiveUpsellBanner.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\prompt-dj\PromptDJOnboarding.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/prompt-dj/PromptDJOnboarding.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\contexts\AnnouncementContext.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/contexts/AnnouncementContext.tsx)

## Audit Trail

- EXTRACTED: 1128 (73%)
- INFERRED: 419 (27%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*