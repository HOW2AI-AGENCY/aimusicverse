/**
 * Lazy-loaded components for bundle optimization
 * These components are loaded on-demand to reduce initial bundle size
 */

import { lazy } from 'react';

// Heavy dialogs and sheets
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

// Heavy features
export const LazyAudioVisualizer = lazy(() => 
  import('@/components/player/AudioVisualizer').then(m => ({ default: m.AudioVisualizer }))
);

export const LazyMusicGraph = lazy(() => 
  import('@/components/music-graph/ForceGraph').then(m => ({ default: m.ForceGraph }))
);

// Onboarding
export const LazyOnboardingSlider = lazy(() => 
  import('@/components/OnboardingSlider').then(m => ({ default: m.OnboardingSlider }))
);

// Charts and analytics
export const LazyTrackAnalytics = lazy(() => 
  import('@/components/TrackAnalytics').then(m => ({ default: m.TrackAnalytics }))
);
