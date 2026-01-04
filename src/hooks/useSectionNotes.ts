/**
 * Hook for managing lyrics section notes
 * Stores notes, tags, and audio references per section
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface SectionNote {
  id: string;
  lyrics_template_id: string | null;
  section_id: string;
  section_type: string | null;
  position: number | null;
  notes: string | null;
  tags: string[] | null;
  audio_note_url: string | null;
  reference_audio_url: string | null;
  reference_analysis: ReferenceAnalysis | null;
  created_at: string;
  updated_at: string;
}

export interface ReferenceAnalysis {
  bpm?: number;
  key?: string;
  genre?: string;
  mood?: string;
  energy?: string;
  instruments?: string[];
  chords?: string[];
  style_description?: string;
  vocal_style?: string;
  suggested_tags?: string[];
}

export interface SaveSectionNoteData {
  section_id: string;
  lyrics_template_id?: string;
  section_type?: string;
  position?: number;
  notes?: string;
  tags?: string[];
  audio_note_url?: string;
  reference_audio_url?: string;
  reference_analysis?: ReferenceAnalysis;
}

export function useSectionNotes(lyricsTemplateId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all notes for a lyrics template
  const { data: sectionNotes, isLoading } = useQuery({
    queryKey: ['section-notes', lyricsTemplateId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('lyrics_section_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (lyricsTemplateId) {
        query = query.eq('lyrics_template_id', lyricsTemplateId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as SectionNote[];
    },
    enabled: !!user,
  });

  // Save or update a section note
  const saveSectionNote = useMutation({
    mutationFn: async (noteData: SaveSectionNoteData) => {
      if (!user) throw new Error('Not authenticated');

      // Check if note exists for this section
      const { data: existing } = await supabase
        .from('lyrics_section_notes')
        .select('id')
        .eq('user_id', user.id)
        .eq('section_id', noteData.section_id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('lyrics_section_notes')
          .update({
            notes: noteData.notes,
            tags: noteData.tags,
            section_type: noteData.section_type,
            position: noteData.position,
            audio_note_url: noteData.audio_note_url,
            reference_audio_url: noteData.reference_audio_url,
            reference_analysis: noteData.reference_analysis as any,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('lyrics_section_notes')
          .insert({
            user_id: user.id,
            lyrics_template_id: noteData.lyrics_template_id,
            section_id: noteData.section_id,
            section_type: noteData.section_type,
            position: noteData.position,
            notes: noteData.notes,
            tags: noteData.tags,
            audio_note_url: noteData.audio_note_url,
            reference_audio_url: noteData.reference_audio_url,
            reference_analysis: noteData.reference_analysis as any,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['section-notes'] });
    },
    onError: (error) => {
      logger.error('Error saving section note', error);
      toast.error('Ошибка сохранения заметки');
    },
  });

  // Delete a section note
  const deleteSectionNote = useMutation({
    mutationFn: async (sectionId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('lyrics_section_notes')
        .delete()
        .eq('user_id', user.id)
        .eq('section_id', sectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['section-notes'] });
      toast.success('Заметка удалена');
    },
  });

  // Get note for a specific section
  const getNoteForSection = (sectionId: string): SectionNote | undefined => {
    return sectionNotes?.find(note => note.section_id === sectionId);
  };

  // Get all suggested tags from all section analyses
  const getAllSuggestedTags = (): string[] => {
    if (!sectionNotes) return [];
    
    const allTags = new Set<string>();
    
    sectionNotes.forEach(note => {
      // Add manual tags
      note.tags?.forEach(tag => allTags.add(tag));
      
      // Add suggested tags from analysis
      if (note.reference_analysis?.suggested_tags) {
        note.reference_analysis.suggested_tags.forEach(tag => allTags.add(tag));
      }
      
      // Add genre as tag
      if (note.reference_analysis?.genre) {
        allTags.add(note.reference_analysis.genre);
      }
      
      // Add mood as tag
      if (note.reference_analysis?.mood) {
        allTags.add(note.reference_analysis.mood);
      }
      
      // Add instruments as tags
      note.reference_analysis?.instruments?.forEach(inst => allTags.add(inst));
    });
    
    return Array.from(allTags);
  };

  return {
    sectionNotes,
    isLoading,
    saveSectionNote: saveSectionNote.mutateAsync,
    deleteSectionNote: deleteSectionNote.mutate,
    getNoteForSection,
    getAllSuggestedTags,
    isSaving: saveSectionNote.isPending,
  };
}
