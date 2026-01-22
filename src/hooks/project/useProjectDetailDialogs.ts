/**
 * useProjectDetailDialogs - Dialog state management for ProjectDetail
 */

import { useState, useCallback } from 'react';
import type { ProjectTrack } from '@/hooks/useProjectTracks';

export interface ProjectDialogState {
  aiDialogOpen: boolean;
  settingsOpen: boolean;
  addTrackOpen: boolean;
  lyricsSheetOpen: boolean;
  lyricsWizardOpen: boolean;
  mediaGeneratorOpen: boolean;
  publishDialogOpen: boolean;
  selectedTrackForLyrics: ProjectTrack | null;
  selectedTrackForMedia: ProjectTrack | null;
  descriptionExpanded: boolean;
  projectInfoExpanded: boolean;
}

export function useProjectDetailDialogs() {
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addTrackOpen, setAddTrackOpen] = useState(false);
  const [lyricsSheetOpen, setLyricsSheetOpen] = useState(false);
  const [lyricsWizardOpen, setLyricsWizardOpen] = useState(false);
  const [mediaGeneratorOpen, setMediaGeneratorOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedTrackForLyrics, setSelectedTrackForLyrics] = useState<ProjectTrack | null>(null);
  const [selectedTrackForMedia, setSelectedTrackForMedia] = useState<ProjectTrack | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [projectInfoExpanded, setProjectInfoExpanded] = useState(false);

  // Check if any dialog is open (for MainButton visibility)
  const isAnyDialogOpen = 
    aiDialogOpen || 
    settingsOpen || 
    addTrackOpen || 
    lyricsSheetOpen || 
    lyricsWizardOpen || 
    mediaGeneratorOpen || 
    publishDialogOpen;

  // Dialog openers with context
  const openLyricsWizard = useCallback((track: ProjectTrack) => {
    setSelectedTrackForLyrics(track);
    setLyricsWizardOpen(true);
  }, []);

  const openMediaGenerator = useCallback((track?: ProjectTrack | null) => {
    setSelectedTrackForMedia(track || null);
    setMediaGeneratorOpen(true);
  }, []);

  const openLyricsSheet = useCallback((track: ProjectTrack) => {
    setSelectedTrackForLyrics(track);
    setLyricsSheetOpen(true);
  }, []);

  const closeLyricsSheetAndOpenWizard = useCallback(() => {
    setLyricsSheetOpen(false);
    setLyricsWizardOpen(true);
  }, []);

  return {
    // Dialog states
    aiDialogOpen,
    setAiDialogOpen,
    settingsOpen,
    setSettingsOpen,
    addTrackOpen,
    setAddTrackOpen,
    lyricsSheetOpen,
    setLyricsSheetOpen,
    lyricsWizardOpen,
    setLyricsWizardOpen,
    mediaGeneratorOpen,
    setMediaGeneratorOpen,
    publishDialogOpen,
    setPublishDialogOpen,
    
    // Selected items
    selectedTrackForLyrics,
    setSelectedTrackForLyrics,
    selectedTrackForMedia,
    setSelectedTrackForMedia,
    
    // Expand states
    descriptionExpanded,
    setDescriptionExpanded,
    projectInfoExpanded,
    setProjectInfoExpanded,
    
    // Computed
    isAnyDialogOpen,
    
    // Convenience methods
    openLyricsWizard,
    openMediaGenerator,
    openLyricsSheet,
    closeLyricsSheetAndOpenWizard,
  };
}
