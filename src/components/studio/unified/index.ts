/**
 * Unified Studio Components
 *
 * Components for the integrated studio experience combining
 * section replacement and stem mixing in one interface.
 *
 * ponytail: deliberately avoids re-exporting hooks/stores/lyrics.
 * Those are imported directly by consumers — barrel re-exports
 * create false chunk dependency edges that prevent Rollup from
 * splitting this module out of the feature-admin-studio mega-chunk.
 * If a consumer needs useSwipeNavigation, import from
 * @/hooks/useSwipeNavigation directly.
 */

export { IntegratedStemTracks } from "./IntegratedStemTracks";
export { SectionVariantOverlay } from "./SectionVariantOverlay";
export { StudioActivityLog } from "./StudioActivityLog";
export { EnhancedVersionTimeline } from "./EnhancedVersionTimeline";
export { StemMidiDrawer } from "./StemMidiDrawer";
export { StemEffectsDrawer } from "./StemEffectsDrawer";
export { AddTrackDrawer } from "./AddTrackDrawer";
export { StudioShell } from "./StudioShell";
export { SortableTrackList } from "./SortableTrackList";
export { AutoSaveIndicator } from "./AutoSaveIndicator";
export {
  StudioLoadingSkeleton,
  TrackRowSkeleton,
  TimelineRulerSkeleton,
  SectionsSkeleton,
  TransportSkeleton,
  WaveformSkeleton,
  MixerPanelSkeleton,
} from "@/components/ui/skeleton-components";

// Unified Mobile Components (new unified DAW interface - NO tabs)
export { UnifiedStudioMobile } from "./UnifiedStudioMobile";
export { UnifiedDAWLayout } from "./UnifiedDAWLayout";
export { MobileStudioPlayerBar } from "./MobileStudioPlayerBar";
export { StudioActionsSheet } from "./StudioActionsSheet";
export { StudioWaveformTimeline } from "./StudioWaveformTimeline";
export { StudioSectionOverlay } from "./StudioSectionOverlay";
export { StudioDownloadPanel } from "./StudioDownloadPanel";
export { StudioTranscriptionPanel } from "./StudioTranscriptionPanel";
export { StudioNotationPanel } from "./StudioNotationPanel";
export { SaveVersionDialog } from "./SaveVersionDialog";
export { PianoRoll } from "./PianoRoll";
export type { MidiNote } from "./PianoRoll";
export { RecordTrackDrawer } from "./RecordTrackDrawer";
export type { RecordingType } from "./RecordTrackDrawer";
export { MusicLabPanel } from "./MusicLabPanel";
export { StudioMusicLabSheet } from "./StudioMusicLabSheet";
export { PresetManager } from "./PresetManager";
export { StudioPresetsSheet } from "./StudioPresetsSheet";
export { StudioDashboardSheet } from "./StudioDashboardSheet";
export { NotationDrawer } from "./NotationDrawer";
export type { NotationDrawerProps } from "./NotationDrawer";
export { ChordOverlay } from "./ChordOverlay";
export type { ChordData, ChordOverlayProps } from "./ChordOverlay";
export { ChordSheet } from "./ChordSheet";
export type { ChordSheetProps } from "./ChordSheet";
export { AddInstrumentalDrawer } from "./AddInstrumentalDrawer";
export type { AddInstrumentalDrawerProps } from "./AddInstrumentalDrawer";
export { AudioUpscaleButton } from "../AudioUpscaleButton";
export { UnifiedSectionEditor } from "./UnifiedSectionEditor";
export { StudioLyricsSheet } from "./StudioLyricsSheet";

// DAW Canvas Components (ADR-011 - unified interface)
export { AIActionsFAB } from "./AIActionsFAB";
export { MobileDAWTimeline } from "./MobileDAWTimeline";

// Mixer Components
export { MobileMixerContent } from "./MobileMixerContent";
export { MixerChannel } from "./MixerChannel";
export { UnifiedMixerChannel, type ChannelVariant, type UnifiedMixerChannelProps } from "./UnifiedMixerChannel";
export { AudioMeter, StereoMeter, SimpleMeter } from "./AudioMeter";
export { StemActionSheet } from "./StemActionSheet";

// Optimized Components
export { OptimizedMixerChannel } from "./OptimizedMixerChannel";
export { OptimizedTrackRow } from "./OptimizedTrackRow";
export { OptimizedWaveform } from "./OptimizedWaveform";
export { OptimizedVolumeSlider } from "./OptimizedVolumeSlider";
export { OptimizedMixerPanel } from "./OptimizedMixerPanel";
export { OptimizedTransport } from "./OptimizedTransport";
export { OptimizedStemTrack } from "./OptimizedStemTrack";

// Type exports — type-only imports do not create chunk eval edges
export type { UnifiedStudioMobileProps } from "./UnifiedStudioMobile";
export type { StemAction, StemType } from "@/hooks/studio/stemActionsConfig";
export type { MixPreset, StemMixSettings } from "@/hooks/studio/mixPresetsConfig";
export type { MixerTrack, UseStudioMixerReturn } from "@/hooks/studio/useStudioMixer";
