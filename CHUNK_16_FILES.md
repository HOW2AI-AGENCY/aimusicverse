# Chunk 16: Player & Audio Components - File List

**Chunk Focus**: Audio player, waveform visualization, and audio-related UI components

## Total Files: 49

## Player Components (24 files)
- `src/components/player/AudioVisualizer.tsx`
- `src/components/player/CompactPlayer.tsx`
- `src/components/player/DesktopFullscreenPlayer.tsx`
- `src/components/player/DoubleTapSeekFeedback.tsx`
- `src/components/player/EnhancedVersionSwitcher.tsx`
- `src/components/player/FullscreenPlayer.tsx`
- `src/components/player/KaraokeView.tsx`
- `src/components/player/LyricsPanel.tsx`
- `src/components/player/MobileFullscreenPlayer.tsx`
- `src/components/player/NetworkStatusIndicator.tsx`
- `src/components/player/PlaybackControls.tsx`
- `src/components/player/PlayerActionsBar.tsx`
- `src/components/player/PlayerErrorBoundary.tsx`
- `src/components/player/ProgressBar.tsx`
- `src/components/player/QueueItem.tsx`
- `src/components/player/QueuePanel.tsx`
- `src/components/player/QueueSheet.tsx`
- `src/components/player/QuickQueueActions.tsx`
- `src/components/player/UnifiedPlayerControls.tsx`
- `src/components/player/VersionBadge.tsx`
- `src/components/player/VersionComparison.tsx`
- `src/components/player/VersionSwitcher.tsx`
- `src/components/player/VolumeControl.tsx`
- `src/components/player/WaveformProgressBar.tsx`

## Waveform Components (4 files)
- `src/components/waveform/BeatGridOverlay.tsx`
- `src/components/waveform/UnifiedWaveform.tsx`
- `src/components/waveform/WaveformCanvas.tsx`
- `src/components/waveform/index.ts`

## Audio Components (2 files)
- `src/components/audio/AudioReferencePreview.tsx`
- `src/components/audio/index.ts`

## Audio Hub Components (5 files)
- `src/components/audio-hub/AudioHubHistory.tsx`
- `src/components/audio-hub/AudioHubQuickActions.tsx`
- `src/components/audio-hub/AudioHubRecorder.tsx`
- `src/components/audio-hub/AudioHubUploader.tsx`
- `src/components/audio-hub/index.ts`

## Audio Record Components (3 files)
- `src/components/audio-record/AudioRecordDialog.tsx`
- `src/components/audio-record/CloudAudioPicker.tsx`
- `src/components/audio-record/InstrumentalSettingsDialog.tsx`

## Audio Reference Components (14 files)
- `src/components/audio-reference/AddVocalsToReferenceDialog.tsx`
- `src/components/audio-reference/CloudAudioSelector.tsx`
- `src/components/audio-reference/ExtendRangeSelector.tsx`
- `src/components/audio-reference/ExtractLyricsButton.tsx`
- `src/components/audio-reference/InlineReferencePreview.tsx`
- `src/components/audio-reference/MiniWaveform.tsx`
- `src/components/audio-reference/ReferenceActionsPanel.tsx`
- `src/components/audio-reference/ReferenceAnalysisDisplay.tsx`
- `src/components/audio-reference/ReferenceAudioPlayer.tsx`
- `src/components/audio-reference/ReferenceDrawer.tsx`
- `src/components/audio-reference/ReferenceMidiSheet.tsx`
- `src/components/audio-reference/ReferenceModeSelector.tsx`
- `src/components/audio-reference/ReferenceStemPlayer.tsx`
- `src/components/audio-reference/index.ts`

## Key Features in This Chunk

### Audio Player System
- Compact, expanded, and fullscreen player modes
- Mobile fullscreen player with gesture support
- Queue management with drag-and-drop
- Version switching and comparison (A/B testing)
- Karaoke view with synchronized lyrics
- Network status awareness

### Waveform Visualization
- Unified waveform canvas with beat grid overlay
- Real-time audio visualization
- Waveform-based progress bar

### Audio Management
- Audio hub with recording, uploading, and history
- Audio reference management with stem separation
- Cloud audio picker for existing tracks
- MIDI sheet display for reference tracks

## Dependencies
- Tone.js for audio processing
- Wavesurfer.js for waveform rendering
- Zustand stores (playerStore)
- React Context for global audio state

## Related Files
- `src/contexts/GlobalAudioContext.tsx` - Global audio provider
- `src/hooks/audio/usePlayerState.ts` - Player state management
- `src/lib/audioContextManager.ts` - Web Audio API context
- `src/lib/audioElementPool.ts` - Audio element pooling
- `src/stores/playerStore.ts` - Player state store