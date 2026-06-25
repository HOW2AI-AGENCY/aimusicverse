# Lyric Generation

> 487 nodes · cohesion 0.01

## Key Concepts

- [setItem()](file:///D:/.MUSICVERSE/aimusicverse/src/lib/cloudStorage.ts#L39) (59 connections)
- [getItem()](file:///D:/.MUSICVERSE/aimusicverse/src/lib/cloudStorage.ts#L83) (56 connections)
- [.parse()](file:///D:/.MUSICVERSE/aimusicverse/src/lib/lyrics/LyricsParser.ts#L97) (51 connections)
- [MainLayout.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/MainLayout.tsx#L1) (44 connections)
- [PromptHistory.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/generate-form/PromptHistory.tsx#L1) (27 connections)
- [deeplink-tracker.ts](file:///D:/.MUSICVERSE/aimusicverse/src/lib/analytics/deeplink-tracker.ts#L1) (24 connections)
- [LyricsParser](file:///D:/.MUSICVERSE/aimusicverse/src/lib/lyrics/LyricsParser.ts#L93) (23 connections)
- [removeItem()](file:///D:/.MUSICVERSE/aimusicverse/src/lib/cloudStorage.ts#L182) (18 connections)
- [index.ts](file:///D:/.MUSICVERSE/aimusicverse/src/lib/ab-testing/index.ts#L1) (15 connections)
- [PaymentFail.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/pages/payments/PaymentFail.tsx#L1) (15 connections)
- [Templates.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/pages/Templates.tsx#L1) (15 connections)
- [EnhancedContextTips.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/studio/shared/EnhancedContextTips.tsx#L1) (14 connections)
- [StudioOnboarding.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/studio/shared/StudioOnboarding.tsx#L1) (14 connections)
- [ContinueDraftCard.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/home/ContinueDraftCard.tsx#L1) (12 connections)
- [VolumeControl.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/player/VolumeControl.tsx#L1) (12 connections)
- [WorkflowGuide.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/workflows/WorkflowGuide.tsx#L1) (12 connections)
- [cleanupStaleData.ts](file:///D:/.MUSICVERSE/aimusicverse/src/lib/cleanupStaleData.ts#L1) (12 connections)
- [WorkflowEngine](file:///D:/.MUSICVERSE/aimusicverse/src/lib/workflow-engine.ts#L234) (12 connections)
- [cloudStorage.ts](file:///D:/.MUSICVERSE/aimusicverse/src/lib/cloudStorage.ts#L1) (11 connections)
- [session.service.ts](file:///D:/.MUSICVERSE/aimusicverse/src/services/analytics/session.service.ts#L1) (11 connections)
- [.getState()](file:///D:/.MUSICVERSE/aimusicverse/src/lib/workflow-engine.ts#L257) (11 connections)
- [HintRegistry.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/hints/HintRegistry.tsx#L1) (10 connections)
- [cleanPlaybackPositions()](file:///D:/.MUSICVERSE/aimusicverse/src/lib/cleanupStaleData.ts#L77) (9 connections)
- [FeatureHighlight.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/onboarding/FeatureHighlight.tsx#L1) (9 connections)
- [ProfileSetupOnboarding.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/onboarding/ProfileSetupOnboarding.tsx#L1) (9 connections)
- *... and 462 more nodes in this community*

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

- [D:\.MUSICVERSE\aimusicverse\src\components\ErrorBoundary.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/ErrorBoundary.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\MainLayout.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/MainLayout.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\TrackDetailSheet.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/TrackDetailSheet.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\announcements\SubscriptionFeatureAnnouncement.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/announcements/SubscriptionFeatureAnnouncement.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\generate-form\PromptHistory.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/generate-form/PromptHistory.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\generate-form\inspirationPrompts.ts](file:///D:/.MUSICVERSE/aimusicverse/src/components/generate-form/inspirationPrompts.ts)
- [D:\.MUSICVERSE\aimusicverse\src\components\hints\HintRegistry.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/hints/HintRegistry.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\home\ContinueDraftCard.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/home/ContinueDraftCard.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\layout\SystemAnnouncement.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/layout/SystemAnnouncement.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\library\EarlyListeningAnnouncement.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/library/EarlyListeningAnnouncement.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\music-graph\GraphOnboarding.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/music-graph/GraphOnboarding.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\onboarding\FeatureHighlight.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/onboarding/FeatureHighlight.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\onboarding\ProfileSetupOnboarding.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/onboarding/ProfileSetupOnboarding.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\player\VolumeControl.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/player/VolumeControl.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\premium\PaywallProvider.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/premium/PaywallProvider.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\premium\ProactiveUpsellBanner.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/premium/ProactiveUpsellBanner.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\stem-studio\MixPresetsMenu.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/stem-studio/MixPresetsMenu.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\studio\shared\EnhancedContextTips.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/studio/shared/EnhancedContextTips.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\studio\shared\StudioOnboarding.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/studio/shared/StudioOnboarding.tsx)
- [D:\.MUSICVERSE\aimusicverse\src\components\track-detail\RemixButton.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/track-detail/RemixButton.tsx)

## Audit Trail

- EXTRACTED: 1058 (71%)
- INFERRED: 423 (29%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*