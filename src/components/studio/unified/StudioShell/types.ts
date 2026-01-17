/**
 * StudioShell Types
 */

import type { StemEffects } from '@/hooks/studio/types';
import type { StudioTrack } from '@/stores/useUnifiedStudioStore';

export interface StudioShellProps {
  className?: string;
}

export interface TrackEffectsState {
  [trackId: string]: StemEffects;
}

export interface StudioDialogState {
  showAddTrackDialog: boolean;
  showImportDialog: boolean;
  showMixerSheet: boolean;
  showExportDialog: boolean;
  showEffectsDrawer: boolean;
  showAddVocalsDrawer: boolean;
  showExtendDialog: boolean;
  showSectionEditor: boolean;
  showGenerateSheet: boolean;
  showDownloadPanel: boolean;
  showSaveVersionDialog: boolean;
  showNotationPanel: boolean;
  showTranscriptionPanel: boolean;
  showArrangementDialog: boolean;
  showInstrumentalResult: boolean;
  showActionsSheet: boolean;
  showStemSeparationDialog: boolean;
}

export interface SelectedTrackState {
  selectedEffectsTrack: StudioTrack | null;
  selectedVocalsTrack: StudioTrack | null;
  selectedExtendTrack: StudioTrack | null;
  selectedSectionTrack: StudioTrack | null;
  selectedNotationTrack: StudioTrack | null;
  selectedTranscriptionTrack: StudioTrack | null;
  selectedArrangementTrack: StudioTrack | null;
}

export interface InstrumentalResultData {
  newTrackId: string;
  existingInstrumentalId?: string;
  versions: Array<{
    label: string;
    audioUrl: string;
    duration: number;
  }>;
  trackName: string;
}
