/**
 * Lazy-loaded components for bundle optimization
 * These components are loaded on-demand to reduce initial bundle size
 * 
 * Sprint 025 - Bundle Optimization Phase 1
 */

import { lazy } from 'react';

// ============================================
// Heavy dialogs and sheets
// ============================================

export const LazyUploadAudioDialog = lazy(() => 
  import('@/components/UploadAudioDialog').then(m => ({ default: m.UploadAudioDialog }))
);

export const LazyGenerateSheet = lazy(() => 
  import('@/components/GenerateSheet').then(m => ({ default: m.GenerateSheet }))
);

export const LazyLyricsChatAssistant = lazy(() => 
  import('@/components/generate-form/LyricsChatAssistant').then(m => ({ default: m.LyricsChatAssistant }))
);

export const LazyTrackDetailSheet = lazy(() => 
  import('@/components/TrackDetailSheet').then(m => ({ default: m.TrackDetailSheet }))
);

export const LazyAudioCoverDialog = lazy(() => 
  import('@/components/AudioCoverDialog').then(m => ({ default: m.AudioCoverDialog }))
);

export const LazyAudioExtendDialog = lazy(() => 
  import('@/components/AudioExtendDialog').then(m => ({ default: m.AudioExtendDialog }))
);

// ============================================
// Studio components (heavy, load on demand)
// ============================================

export const LazyStudioActionsPanel = lazy(() => 
  import('@/components/studio/panels/StudioActionsPanel').then(m => ({ default: m.StudioActionsPanel }))
);

export const LazyVersionTree = lazy(() => 
  import('@/components/studio/shared/VersionTree').then(m => ({ default: m.VersionTree }))
);

export const LazyMobileStudioLayout = lazy(() => 
  import('@/components/studio/mobile/MobileStudioLayout').then(m => ({ default: m.MobileStudioLayout }))
);

// ============================================
// Heavy visualizations
// ============================================

export const LazyAudioVisualizer = lazy(() => 
  import('@/components/player/AudioVisualizer').then(m => ({ default: m.AudioVisualizer }))
);

export const LazyMusicGraph = lazy(() => 
  import('@/components/music-graph/ForceGraph').then(m => ({ default: m.ForceGraph }))
);

export const LazyInteractiveChordWheel = lazy(() => 
  import('@/components/guitar/InteractiveChordWheel').then(m => ({ default: m.InteractiveChordWheel }))
);

export const LazyNoteFlowVisualization = lazy(() => 
  import('@/components/guitar/NoteFlowVisualization').then(m => ({ default: m.NoteFlowVisualization }))
);

// ============================================
// Onboarding & analytics (load later)
// ============================================

export const LazyOnboardingSlider = lazy(() => 
  import('@/components/OnboardingSlider').then(m => ({ default: m.OnboardingSlider }))
);

export const LazyTrackAnalytics = lazy(() => 
  import('@/components/TrackAnalytics').then(m => ({ default: m.TrackAnalytics }))
);

export const LazyGamificationOnboarding = lazy(() => 
  import('@/components/gamification/GamificationOnboarding').then(m => ({ default: m.GamificationOnboarding }))
);

// ============================================
// Player components (load after initial render)
// ============================================

export const LazyFullscreenPlayer = lazy(() => 
  import('@/components/FullscreenPlayer').then(m => ({ default: m.FullscreenPlayer }))
);

export const LazyExpandedPlayer = lazy(() => 
  import('@/components/player/ExpandedPlayer').then(m => ({ default: m.ExpandedPlayer }))
);

export const LazyMobileFullscreenPlayer = lazy(() => 
  import('@/components/player/MobileFullscreenPlayer').then(m => ({ default: m.MobileFullscreenPlayer }))
);

// ============================================
// Preload utilities
// ============================================

/**
 * Preload a lazy component before it's needed
 * Call this on hover or when you anticipate navigation
 */
export function preloadComponent(component: React.LazyExoticComponent<any>) {
  // Trigger the lazy load
  const promise = (component as any)._payload?._result;
  if (typeof promise === 'function') {
    promise();
  }
}

/**
 * Preload critical components for a specific route
 */
export const preloadRouteComponents = {
  studio: () => {
    preloadComponent(LazyStudioActionsPanel);
    preloadComponent(LazyVersionTree);
  },
  generate: () => {
    preloadComponent(LazyGenerateSheet);
    preloadComponent(LazyLyricsChatAssistant);
  },
  player: () => {
    preloadComponent(LazyFullscreenPlayer);
    preloadComponent(LazyExpandedPlayer);
  },
};
