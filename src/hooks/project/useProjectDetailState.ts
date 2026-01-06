/**
 * useProjectDetailState - State management hook for ProjectDetail page
 * 
 * Extracts all dialog states and handlers from the ProjectDetail component
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectTrack {
  id: string;
  position: number;
  title: string;
  style_prompt?: string | null;
  lyrics?: string | null;
  lyrics_status?: string | null;
  notes?: string | null;
  recommended_tags?: string[] | null;
  recommended_structure?: string | null;
  linked_track?: {
    lyrics?: string | null;
  } | null;
}

export interface ProjectDetailDialogState {
  settingsOpen: boolean;
  addTrackOpen: boolean;
  lyricsSheetOpen: boolean;
  lyricsWizardOpen: boolean;
  aiDialogOpen: boolean;
  mediaGeneratorOpen: boolean;
  publishDialogOpen: boolean;
  selectedTrackForLyrics: ProjectTrack | null;
  selectedTrackForMedia: ProjectTrack | null;
}

export interface UseProjectDetailStateReturn extends ProjectDetailDialogState {
  // Dialog setters
  setSettingsOpen: (open: boolean) => void;
  setAddTrackOpen: (open: boolean) => void;
  setLyricsSheetOpen: (open: boolean) => void;
  setLyricsWizardOpen: (open: boolean) => void;
  setAiDialogOpen: (open: boolean) => void;
  setMediaGeneratorOpen: (open: boolean) => void;
  setPublishDialogOpen: (open: boolean) => void;
  setSelectedTrackForLyrics: (track: ProjectTrack | null) => void;
  setSelectedTrackForMedia: (track: ProjectTrack | null) => void;
  
  // Handlers
  handleOpenLyrics: (track: ProjectTrack) => void;
  handleOpenLyricsWizard: (track: ProjectTrack) => void;
  handleSaveLyrics: (lyrics: string) => Promise<void>;
  handleSaveNotes: (notes: string) => Promise<void>;
  handleLyricsGenerated: (lyrics: string, title?: string) => void;
  handleApplyUpdates: () => void;
}

export function useProjectDetailState(): UseProjectDetailStateReturn {
  const queryClient = useQueryClient();
  
  // Dialog states
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addTrackOpen, setAddTrackOpen] = useState(false);
  const [lyricsSheetOpen, setLyricsSheetOpen] = useState(false);
  const [lyricsWizardOpen, setLyricsWizardOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [mediaGeneratorOpen, setMediaGeneratorOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  
  // Selected track states
  const [selectedTrackForLyrics, setSelectedTrackForLyrics] = useState<ProjectTrack | null>(null);
  const [selectedTrackForMedia, setSelectedTrackForMedia] = useState<ProjectTrack | null>(null);

  // Open lyrics preview
  const handleOpenLyrics = useCallback((track: ProjectTrack) => {
    setSelectedTrackForLyrics(track);
    setLyricsSheetOpen(true);
  }, []);

  // Open lyrics wizard
  const handleOpenLyricsWizard = useCallback((track: ProjectTrack) => {
    setSelectedTrackForLyrics(track);
    setLyricsWizardOpen(true);
  }, []);

  // Save lyrics to track
  const handleSaveLyrics = useCallback(async (lyrics: string) => {
    if (!selectedTrackForLyrics) return;
    
    try {
      const { error } = await supabase
        .from('project_tracks')
        .update({ 
          lyrics,
          lyrics_status: 'draft',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedTrackForLyrics.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['project-tracks'] });
      toast.success('Текст сохранён');
    } catch (error) {
      console.error('Error saving lyrics:', error);
      toast.error('Ошибка сохранения текста');
    }
  }, [selectedTrackForLyrics, queryClient]);

  // Save notes to track
  const handleSaveNotes = useCallback(async (notes: string) => {
    if (!selectedTrackForLyrics) return;
    
    try {
      const { error } = await supabase
        .from('project_tracks')
        .update({ 
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedTrackForLyrics.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['project-tracks'] });
      toast.success('Заметки сохранены');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Ошибка сохранения заметок');
    }
  }, [selectedTrackForLyrics, queryClient]);

  // Handle lyrics generated from wizard
  const handleLyricsGenerated = useCallback((lyrics: string, title?: string) => {
    if (selectedTrackForLyrics) {
      handleSaveLyrics(lyrics);
    }
    setLyricsWizardOpen(false);
    toast.success('Текст сгенерирован');
  }, [selectedTrackForLyrics, handleSaveLyrics]);

  // Handle apply updates from AI dialog
  const handleApplyUpdates = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['project-tracks'] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    setAiDialogOpen(false);
    toast.success('Изменения применены');
  }, [queryClient]);

  return {
    // States
    settingsOpen,
    addTrackOpen,
    lyricsSheetOpen,
    lyricsWizardOpen,
    aiDialogOpen,
    mediaGeneratorOpen,
    publishDialogOpen,
    selectedTrackForLyrics,
    selectedTrackForMedia,
    
    // Setters
    setSettingsOpen,
    setAddTrackOpen,
    setLyricsSheetOpen,
    setLyricsWizardOpen,
    setAiDialogOpen,
    setMediaGeneratorOpen,
    setPublishDialogOpen,
    setSelectedTrackForLyrics,
    setSelectedTrackForMedia,
    
    // Handlers
    handleOpenLyrics,
    handleOpenLyricsWizard,
    handleSaveLyrics,
    handleSaveNotes,
    handleLyricsGenerated,
    handleApplyUpdates,
  };
}
