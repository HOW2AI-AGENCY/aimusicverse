/**
 * Studio Shell State Hook
 * Manages all dialog and selected track states for StudioShell
 */

import { useState, useMemo, useRef, useCallback } from 'react';
import type { StudioTrack } from '@/stores/useUnifiedStudioStore';
import type { TrackEffectsState, InstrumentalResultData } from './types';
import { defaultStemEffects } from '@/hooks/studio/stemEffectsConfig';

export function useStudioShellState() {
  // Dialog states
  const [showAddTrackDialog, setShowAddTrackDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showMixerSheet, setShowMixerSheet] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showEffectsDrawer, setShowEffectsDrawer] = useState(false);
  const [showAddVocalsDrawer, setShowAddVocalsDrawer] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showSectionEditor, setShowSectionEditor] = useState(false);
  const [showGenerateSheet, setShowGenerateSheet] = useState(false);
  const [showDownloadPanel, setShowDownloadPanel] = useState(false);
  const [showSaveVersionDialog, setShowSaveVersionDialog] = useState(false);
  const [showNotationPanel, setShowNotationPanel] = useState(false);
  const [showTranscriptionPanel, setShowTranscriptionPanel] = useState(false);
  const [showArrangementDialog, setShowArrangementDialog] = useState(false);
  const [showInstrumentalResult, setShowInstrumentalResult] = useState(false);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [showStemSeparationDialog, setShowStemSeparationDialog] = useState(false);

  // Selected track states
  const [selectedEffectsTrack, setSelectedEffectsTrack] = useState<StudioTrack | null>(null);
  const [selectedVocalsTrack, setSelectedVocalsTrack] = useState<StudioTrack | null>(null);
  const [selectedExtendTrack, setSelectedExtendTrack] = useState<StudioTrack | null>(null);
  const [selectedSectionTrack, setSelectedSectionTrack] = useState<StudioTrack | null>(null);
  const [selectedNotationTrack, setSelectedNotationTrack] = useState<StudioTrack | null>(null);
  const [selectedTranscriptionTrack, setSelectedTranscriptionTrack] = useState<StudioTrack | null>(null);
  const [selectedArrangementTrack, setSelectedArrangementTrack] = useState<StudioTrack | null>(null);

  // Track effects state
  const [trackEffects, setTrackEffects] = useState<TrackEffectsState>({});

  // Instrumental result state
  const [instrumentalResultData, setInstrumentalResultData] = useState<InstrumentalResultData | null>(null);

  // Mobile tab state
  const [mobileTab, setMobileTab] = useState<'tracks' | 'lyrics'>('tracks');

  // Pending generation context
  const pendingGenerationContextRef = useRef<Map<string, { type: 'replace_instrumental'; existingId?: string }>>(new Map());

  // Track effects update helpers
  const updateTrackEQ = useCallback((trackId: string, settings: Partial<typeof defaultStemEffects.eq>) => {
    setTrackEffects(prev => ({
      ...prev,
      [trackId]: {
        ...(prev[trackId] || defaultStemEffects),
        eq: { ...(prev[trackId]?.eq || defaultStemEffects.eq), ...settings }
      }
    }));
  }, []);

  const updateTrackCompressor = useCallback((trackId: string, settings: Partial<typeof defaultStemEffects.compressor>) => {
    setTrackEffects(prev => ({
      ...prev,
      [trackId]: {
        ...(prev[trackId] || defaultStemEffects),
        compressor: { ...(prev[trackId]?.compressor || defaultStemEffects.compressor), ...settings }
      }
    }));
  }, []);

  const updateTrackReverb = useCallback((trackId: string, settings: Partial<typeof defaultStemEffects.reverb>) => {
    setTrackEffects(prev => ({
      ...prev,
      [trackId]: {
        ...(prev[trackId] || defaultStemEffects),
        reverb: { ...(prev[trackId]?.reverb || defaultStemEffects.reverb), ...settings }
      }
    }));
  }, []);

  const getTrackEffects = useCallback((trackId: string) => {
    return trackEffects[trackId] || defaultStemEffects;
  }, [trackEffects]);

  return {
    // Dialog states
    showAddTrackDialog, setShowAddTrackDialog,
    showImportDialog, setShowImportDialog,
    showMixerSheet, setShowMixerSheet,
    showExportDialog, setShowExportDialog,
    showEffectsDrawer, setShowEffectsDrawer,
    showAddVocalsDrawer, setShowAddVocalsDrawer,
    showExtendDialog, setShowExtendDialog,
    showSectionEditor, setShowSectionEditor,
    showGenerateSheet, setShowGenerateSheet,
    showDownloadPanel, setShowDownloadPanel,
    showSaveVersionDialog, setShowSaveVersionDialog,
    showNotationPanel, setShowNotationPanel,
    showTranscriptionPanel, setShowTranscriptionPanel,
    showArrangementDialog, setShowArrangementDialog,
    showInstrumentalResult, setShowInstrumentalResult,
    showActionsSheet, setShowActionsSheet,
    showStemSeparationDialog, setShowStemSeparationDialog,

    // Selected track states
    selectedEffectsTrack, setSelectedEffectsTrack,
    selectedVocalsTrack, setSelectedVocalsTrack,
    selectedExtendTrack, setSelectedExtendTrack,
    selectedSectionTrack, setSelectedSectionTrack,
    selectedNotationTrack, setSelectedNotationTrack,
    selectedTranscriptionTrack, setSelectedTranscriptionTrack,
    selectedArrangementTrack, setSelectedArrangementTrack,

    // Track effects
    trackEffects,
    updateTrackEQ,
    updateTrackCompressor,
    updateTrackReverb,
    getTrackEffects,

    // Instrumental result
    instrumentalResultData, setInstrumentalResultData,

    // Mobile tab
    mobileTab, setMobileTab,

    // Generation context
    pendingGenerationContextRef,
  };
}
