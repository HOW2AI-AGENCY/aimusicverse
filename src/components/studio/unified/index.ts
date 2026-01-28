/**
 * Unified Studio Components
 * 
 * Components for the integrated studio experience combining
 * section replacement and stem mixing in one interface.
 */

export { UnifiedStudioContent } from './UnifiedStudioContent';
export { IntegratedStemTracks } from './IntegratedStemTracks';
export { SectionVariantOverlay } from './SectionVariantOverlay';
export { StudioActivityLog } from './StudioActivityLog';
export { EnhancedVersionTimeline } from './EnhancedVersionTimeline';
export { StemMidiDrawer } from './StemMidiDrawer';
export { StemEffectsDrawer } from './StemEffectsDrawer';
export { AddTrackDrawer } from './AddTrackDrawer';
export { StudioShell } from './StudioShell';
export { SortableTrackList } from './SortableTrackList';
export { AutoSaveIndicator } from './AutoSaveIndicator';
export { 
  StudioLoadingSkeleton, 
  TrackRowSkeleton, 
  TimelineRulerSkeleton,
  SectionsSkeleton,
  TransportSkeleton,
  WaveformSkeleton,
  MixerPanelSkeleton,
} from '@/components/ui/skeleton-components';

// Unified Mobile Components (new unified DAW interface - NO tabs)
export { UnifiedStudioMobile } from './UnifiedStudioMobile';
export { UnifiedDAWLayout } from './UnifiedDAWLayout';
export { MobileStudioPlayerBar } from './MobileStudioPlayerBar';
export { StudioActionsSheet } from './StudioActionsSheet';
export { StudioWaveformTimeline } from './StudioWaveformTimeline';
export { StudioSectionOverlay } from './StudioSectionOverlay';
export { StudioDownloadPanel } from './StudioDownloadPanel';
export { StudioTranscriptionPanel } from './StudioTranscriptionPanel';
export { StudioNotationPanel } from './StudioNotationPanel';
export { SaveVersionDialog } from './SaveVersionDialog';
export { PianoRoll } from './PianoRoll';
export type { MidiNote } from './PianoRoll';
export { RecordTrackDrawer } from './RecordTrackDrawer';
export type { RecordingType } from './RecordTrackDrawer';
export { MusicLabPanel } from './MusicLabPanel';
export { NotationDrawer } from './NotationDrawer';
export type { NotationDrawerProps } from './NotationDrawer';
export { ChordOverlay } from './ChordOverlay';
export type { ChordData, ChordOverlayProps } from './ChordOverlay';
export { ChordSheet } from './ChordSheet';
export type { ChordSheetProps } from './ChordSheet';
export { AddInstrumentalDrawer } from './AddInstrumentalDrawer';
export type { AddInstrumentalDrawerProps } from './AddInstrumentalDrawer';
export { AudioUpscaleButton } from '../AudioUpscaleButton';
export { UnifiedSectionEditor } from './UnifiedSectionEditor';
export { StudioLyricsSheet } from './StudioLyricsSheet';

// DAW Canvas Components (ADR-011 - unified interface)
export { AIActionsFAB } from './AIActionsFAB';
export { MobileDAWTimeline } from './MobileDAWTimeline';

// Mixer Components
export { MobileMixerContent } from './MobileMixerContent';
export { MixerChannel } from './MixerChannel';
export { UnifiedMixerChannel, type ChannelVariant, type UnifiedMixerChannelProps } from './UnifiedMixerChannel';
export { AudioMeter, StereoMeter, SimpleMeter } from './AudioMeter';
export { StemActionSheet } from './StemActionSheet';

// Optimized Components
export { OptimizedMixerChannel } from './OptimizedMixerChannel';
export { OptimizedTrackRow } from './OptimizedTrackRow';
export { OptimizedWaveform } from './OptimizedWaveform';
export { OptimizedVolumeSlider } from './OptimizedVolumeSlider';
export { OptimizedMixerPanel } from './OptimizedMixerPanel';
export { OptimizedTransport } from './OptimizedTransport';
export { OptimizedStemTrack } from './OptimizedStemTrack';

// Re-export hooks for convenience
export { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
export { useStudioPerformance, useThrottledCallback, useCustomDeferredValue } from '@/hooks/useStudioPerformance';
export { useUnifiedStudio } from '@/hooks/studio/useUnifiedStudio';
export { useStudioMixer } from '@/hooks/studio/useStudioMixer';
export { useLyricsSync } from '@/hooks/lyrics/useLyricsSync';

// Re-export configs
export { getActionsForStemType, getGroupedActions, CATEGORY_LABELS, normalizeTrackType } from '@/hooks/studio/stemActionsConfig';
export { MIX_PRESETS, getMixPreset } from '@/hooks/studio/mixPresetsConfig';

// Re-export stores for convenience
export { 
  useStemMixerStore, 
  useStemState, 
  useStemActions, 
  useMasterControls,
} from '@/stores/useStemMixerStore';
export { 
  usePlaybackStore, 
  usePlaybackStatus, 
  usePlaybackControls,
} from '@/stores/usePlaybackStore';

// Re-export optimized lyrics
export { OptimizedLyricsPanel } from '@/components/lyrics/OptimizedLyricsPanel';
export { OptimizedLyricsLine } from '@/components/lyrics/OptimizedLyricsLine';

// Type exports
export type { UnifiedStudioMobileProps } from './UnifiedStudioMobile';
export type { StemAction, StemType } from '@/hooks/studio/stemActionsConfig';
export type { MixPreset, StemMixSettings } from '@/hooks/studio/mixPresetsConfig';
export type { MixerTrack, UseStudioMixerReturn } from '@/hooks/studio/useStudioMixer';
