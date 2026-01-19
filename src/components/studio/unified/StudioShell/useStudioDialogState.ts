/**
 * Studio Dialog State Hook
 * Manages all dialog/drawer/sheet open states and selected items
 * Extracted from StudioShell to reduce complexity
 * 
 * @module components/studio/unified/StudioShell/useStudioDialogState
 */

import { useState, useCallback, useRef } from 'react';
import type { StudioTrack } from '@/stores/useUnifiedStudioStore';
import type { StemEffects } from '@/hooks/studio/types';
import type { InstrumentalResultData } from '../InstrumentalResultHandler';
import { defaultStemEffects } from '@/hooks/studio/stemEffectsConfig';

export interface TrackEffectsState {
  [trackId: string]: StemEffects;
}

export function useStudioDialogState() {
  // Import Dialog
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  // Export Dialog
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  // Effects Drawer
  const [showEffectsDrawer, setShowEffectsDrawer] = useState(false);
  const [selectedEffectsTrack, setSelectedEffectsTrack] = useState<StudioTrack | null>(null);
  const [trackEffects, setTrackEffects] = useState<TrackEffectsState>({});
  
  // Add Vocals Drawer
  const [showAddVocalsDrawer, setShowAddVocalsDrawer] = useState(false);
  const [selectedVocalsTrack, setSelectedVocalsTrack] = useState<StudioTrack | null>(null);
  
  // Extend Dialog
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [selectedExtendTrack, setSelectedExtendTrack] = useState<StudioTrack | null>(null);
  
  // Section Editor
  const [showSectionEditor, setShowSectionEditor] = useState(false);
  const [selectedSectionTrack, setSelectedSectionTrack] = useState<StudioTrack | null>(null);
  
  // Generate Sheet
  const [showGenerateSheet, setShowGenerateSheet] = useState(false);
  
  // Download Panel
  const [showDownloadPanel, setShowDownloadPanel] = useState(false);
  
  // Save Version Dialog
  const [showSaveVersionDialog, setShowSaveVersionDialog] = useState(false);
  
  // Notation Panel
  const [showNotationPanel, setShowNotationPanel] = useState(false);
  const [selectedNotationTrack, setSelectedNotationTrack] = useState<StudioTrack | null>(null);
  
  // Transcription Panel
  const [showTranscriptionPanel, setShowTranscriptionPanel] = useState(false);
  const [selectedTranscriptionTrack, setSelectedTranscriptionTrack] = useState<StudioTrack | null>(null);
  
  // Arrangement Dialog
  const [showArrangementDialog, setShowArrangementDialog] = useState(false);
  const [selectedArrangementTrack, setSelectedArrangementTrack] = useState<StudioTrack | null>(null);
  
  // Instrumental Result Handler
  const [showInstrumentalResult, setShowInstrumentalResult] = useState(false);
  const [instrumentalResultData, setInstrumentalResultData] = useState<InstrumentalResultData | null>(null);
  
  // Actions Sheet (mobile)
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  
  // Stem Separation
  const [showStemSeparationDialog, setShowStemSeparationDialog] = useState(false);
  
  // Add Track Dialog
  const [showAddTrackDialog, setShowAddTrackDialog] = useState(false);
  
  // Mixer Sheet
  const [showMixerSheet, setShowMixerSheet] = useState(false);
  
  // Generation context ref
  const pendingGenerationContextRef = useRef<Map<string, { type: 'replace_instrumental'; existingId?: string }>>(new Map());

  // Effects handlers
  const handleEffectsChange = useCallback((trackId: string, effects: StemEffects) => {
    setTrackEffects(prev => ({
      ...prev,
      [trackId]: effects,
    }));
  }, []);

  const handleEffectsReset = useCallback((trackId: string) => {
    setTrackEffects(prev => ({
      ...prev,
      [trackId]: { ...defaultStemEffects },
    }));
  }, []);

  // Open effects drawer for a track
  const openEffectsDrawer = useCallback((track: StudioTrack) => {
    setSelectedEffectsTrack(track);
    // Initialize effects if not present
    setTrackEffects(prev => {
      if (!prev[track.id]) {
        return {
          ...prev,
          [track.id]: { ...defaultStemEffects },
        };
      }
      return prev;
    });
    setShowEffectsDrawer(true);
  }, []);

  // Open add vocals drawer for a track
  const openAddVocalsDrawer = useCallback((track: StudioTrack) => {
    setSelectedVocalsTrack(track);
    setShowAddVocalsDrawer(true);
  }, []);

  // Open extend dialog for a track
  const openExtendDialog = useCallback((track: StudioTrack) => {
    setSelectedExtendTrack(track);
    setShowExtendDialog(true);
  }, []);

  // Open section editor for a track
  const openSectionEditor = useCallback((track: StudioTrack) => {
    setSelectedSectionTrack(track);
    setShowSectionEditor(true);
  }, []);

  // Open notation panel for a track
  const openNotationPanel = useCallback((track: StudioTrack) => {
    setSelectedNotationTrack(track);
    setShowNotationPanel(true);
  }, []);

  // Open transcription panel for a track
  const openTranscriptionPanel = useCallback((track: StudioTrack) => {
    setSelectedTranscriptionTrack(track);
    setShowTranscriptionPanel(true);
  }, []);

  // Open arrangement dialog for a track
  const openArrangementDialog = useCallback((track: StudioTrack) => {
    setSelectedArrangementTrack(track);
    setShowArrangementDialog(true);
  }, []);

  return {
    // Import Dialog
    showImportDialog,
    setShowImportDialog,
    
    // Export Dialog
    showExportDialog,
    setShowExportDialog,
    
    // Effects Drawer
    showEffectsDrawer,
    setShowEffectsDrawer,
    selectedEffectsTrack,
    setSelectedEffectsTrack,
    trackEffects,
    handleEffectsChange,
    handleEffectsReset,
    openEffectsDrawer,
    
    // Add Vocals Drawer
    showAddVocalsDrawer,
    setShowAddVocalsDrawer,
    selectedVocalsTrack,
    setSelectedVocalsTrack,
    openAddVocalsDrawer,
    
    // Extend Dialog
    showExtendDialog,
    setShowExtendDialog,
    selectedExtendTrack,
    setSelectedExtendTrack,
    openExtendDialog,
    
    // Section Editor
    showSectionEditor,
    setShowSectionEditor,
    selectedSectionTrack,
    setSelectedSectionTrack,
    openSectionEditor,
    
    // Generate Sheet
    showGenerateSheet,
    setShowGenerateSheet,
    
    // Download Panel
    showDownloadPanel,
    setShowDownloadPanel,
    
    // Save Version Dialog
    showSaveVersionDialog,
    setShowSaveVersionDialog,
    
    // Notation Panel
    showNotationPanel,
    setShowNotationPanel,
    selectedNotationTrack,
    setSelectedNotationTrack,
    openNotationPanel,
    
    // Transcription Panel
    showTranscriptionPanel,
    setShowTranscriptionPanel,
    selectedTranscriptionTrack,
    setSelectedTranscriptionTrack,
    openTranscriptionPanel,
    
    // Arrangement Dialog
    showArrangementDialog,
    setShowArrangementDialog,
    selectedArrangementTrack,
    setSelectedArrangementTrack,
    openArrangementDialog,
    
    // Instrumental Result Handler
    showInstrumentalResult,
    setShowInstrumentalResult,
    instrumentalResultData,
    setInstrumentalResultData,
    
    // Actions Sheet
    showActionsSheet,
    setShowActionsSheet,
    
    // Stem Separation
    showStemSeparationDialog,
    setShowStemSeparationDialog,
    
    // Add Track Dialog
    showAddTrackDialog,
    setShowAddTrackDialog,
    
    // Mixer Sheet
    showMixerSheet,
    setShowMixerSheet,
    
    // Generation context
    pendingGenerationContextRef,
  };
}
