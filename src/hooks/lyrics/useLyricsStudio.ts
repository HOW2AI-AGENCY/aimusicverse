/**
 * useLyricsStudio - Comprehensive hook for Lyrics Studio V2
 * 
 * Provides CRUD operations, AI assistance, version history, and section notes
 * for the integrated lyrics studio experience in StudioShell.
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface LyricsSection {
  id: string;
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'hook' | 'prechorus' | 'breakdown';
  label: string;
  content: string;
  startLine: number;
  endLine: number;
  notes?: string;
  tags?: string[];
}

export interface LyricsVersion {
  id: string;
  versionNumber: number;
  lyrics: string;
  changeType: string;
  changeDescription?: string | null;
  createdAt: string;
  isCurrent: boolean;
}

export interface SectionNote {
  id: string;
  sectionId: string;
  sectionType?: string | null;
  notes: string;
  tags?: string[];
  referenceAudioUrl?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface LyricsStats {
  wordCount: number;
  lineCount: number;
  characterCount: number;
  sectionCount: number;
  versionsCount: number;
  notesCount: number;
}

export interface AITool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'create' | 'analyze' | 'optimize';
}

export const AI_TOOLS: AITool[] = [
  { id: 'write', name: 'Написать', description: 'Генерация текста с нуля', icon: 'PenTool', category: 'create' },
  { id: 'continue', name: 'Продолжить', description: 'Продолжить незавершённый текст', icon: 'ArrowRight', category: 'create' },
  { id: 'rhyme', name: 'Рифмы', description: 'Найти рифмы для слов', icon: 'Repeat', category: 'create' },
  { id: 'analyze', name: 'Анализ', description: 'Ритм, структура, качество', icon: 'BarChart2', category: 'analyze' },
  { id: 'producer', name: 'Продюсер', description: 'Vocal map и аранжировка', icon: 'Mic2', category: 'analyze' },
  { id: 'structure', name: 'Структура', description: 'Организация секций', icon: 'Layers', category: 'analyze' },
  { id: 'optimize', name: 'Оптимизация', description: 'Suno теги и валидация', icon: 'Zap', category: 'optimize' },
  { id: 'style', name: 'Стиль', description: 'Конвертация стиля', icon: 'Palette', category: 'optimize' },
  { id: 'translate', name: 'Перевод', description: 'Перевод на другой язык', icon: 'Languages', category: 'optimize' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseSections(lyrics: string): LyricsSection[] {
  if (!lyrics?.trim()) return [];

  const lines = lyrics.split('\n');
  const sections: LyricsSection[] = [];
  let currentSection: Partial<LyricsSection> | null = null;
  let lineIndex = 0;

  const sectionPatterns: Array<{ pattern: RegExp; type: LyricsSection['type']; label: string }> = [
    { pattern: /^\[?(verse|куплет)/i, type: 'verse', label: 'Куплет' },
    { pattern: /^\[?(chorus|припев)/i, type: 'chorus', label: 'Припев' },
    { pattern: /^\[?(bridge|бридж)/i, type: 'bridge', label: 'Бридж' },
    { pattern: /^\[?(intro|вступление)/i, type: 'intro', label: 'Вступление' },
    { pattern: /^\[?(outro|концовка)/i, type: 'outro', label: 'Концовка' },
    { pattern: /^\[?(hook|хук)/i, type: 'hook', label: 'Хук' },
    { pattern: /^\[?(pre-?chorus|пре-?припев)/i, type: 'prechorus', label: 'Пре-припев' },
    { pattern: /^\[?(breakdown|брейкдаун)/i, type: 'breakdown', label: 'Брейкдаун' },
  ];

  for (const line of lines) {
    const trimmedLine = line.trim();
    let matched = false;

    for (const { pattern, type, label } of sectionPatterns) {
      if (pattern.test(trimmedLine)) {
        // Save previous section
        if (currentSection && currentSection.content) {
          sections.push({
            ...currentSection,
            id: `section-${sections.length}`,
            endLine: lineIndex - 1,
            content: currentSection.content.trim(),
          } as LyricsSection);
        }

        // Start new section
        const sectionNum = sections.filter(s => s.type === type).length + 1;
        currentSection = {
          type,
          label: `${label} ${sectionNum}`,
          content: '',
          startLine: lineIndex,
        };
        matched = true;
        break;
      }
    }

    if (!matched && currentSection) {
      currentSection.content = (currentSection.content || '') + line + '\n';
    } else if (!matched && trimmedLine) {
      // Content before any section marker - create implicit verse
      if (!currentSection) {
        currentSection = {
          type: 'verse',
          label: 'Куплет 1',
          content: line + '\n',
          startLine: lineIndex,
        };
      }
    }

    lineIndex++;
  }

  // Add last section
  if (currentSection && currentSection.content) {
    sections.push({
      ...currentSection,
      id: `section-${sections.length}`,
      endLine: lineIndex - 1,
      content: currentSection.content.trim(),
    } as LyricsSection);
  }

  return sections;
}

function calculateStats(lyrics: string, versions: LyricsVersion[], notes: SectionNote[]): LyricsStats {
  const sections = parseSections(lyrics);
  const words = lyrics.trim().split(/\s+/).filter(Boolean);
  const lines = lyrics.split('\n').filter(line => line.trim());

  return {
    wordCount: words.length,
    lineCount: lines.length,
    characterCount: lyrics.length,
    sectionCount: sections.length,
    versionsCount: versions.length,
    notesCount: notes.length,
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

interface UseLyricsStudioOptions {
  trackId?: string;
  projectTrackId?: string;
  lyricsTemplateId?: string;
  initialLyrics?: string;
  onSave?: (lyrics: string) => void;
}

export function useLyricsStudio({
  trackId,
  projectTrackId,
  lyricsTemplateId,
  initialLyrics = '',
  onSave,
}: UseLyricsStudioOptions) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Local state
  const [lyrics, setLyrics] = useState(initialLyrics);
  const [isDirty, setIsDirty] = useState(false);
  const [activeAITool, setActiveAITool] = useState<string | null>(null);

  // Query keys
  const versionsKey = ['lyrics-versions', trackId || projectTrackId || lyricsTemplateId];
  const notesKey = ['section-notes', trackId || projectTrackId || lyricsTemplateId];

  // Fetch versions
  const { data: versions = [], isLoading: versionsLoading } = useQuery({
    queryKey: versionsKey,
    queryFn: async () => {
      if (!lyricsTemplateId && !projectTrackId) return [];

      const query = supabase
        .from('lyrics_versions')
        .select('*')
        .order('version_number', { ascending: false });

      if (lyricsTemplateId) {
        query.eq('lyrics_template_id', lyricsTemplateId);
      } else if (projectTrackId) {
        query.eq('project_track_id', projectTrackId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(v => ({
        id: v.id,
        versionNumber: v.version_number,
        lyrics: v.lyrics,
        changeType: v.change_type,
        changeDescription: v.change_description,
        createdAt: v.created_at,
        isCurrent: v.is_current || false,
      }));
    },
    enabled: !!(lyricsTemplateId || projectTrackId),
  });

  // Fetch section notes
  const { data: sectionNotes = [], isLoading: notesLoading } = useQuery({
    queryKey: notesKey,
    queryFn: async () => {
      if (!lyricsTemplateId) return [];

      const { data, error } = await supabase
        .from('lyrics_section_notes')
        .select('*')
        .eq('lyrics_template_id', lyricsTemplateId)
        .order('position', { ascending: true });

      if (error) throw error;

      return (data || []).map(n => ({
        id: n.id,
        sectionId: n.section_id,
        sectionType: n.section_type,
        notes: n.notes || '',
        tags: n.tags || [],
        referenceAudioUrl: n.reference_audio_url,
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      }));
    },
    enabled: !!lyricsTemplateId,
  });

  // Parsed sections
  const sections = useMemo(() => parseSections(lyrics), [lyrics]);

  // Statistics
  const stats = useMemo(
    () => calculateStats(lyrics, versions, sectionNotes),
    [lyrics, versions, sectionNotes]
  );

  // Create version mutation
  const createVersionMutation = useMutation({
    mutationFn: async ({
      content,
      changeType,
      changeDescription,
    }: {
      content: string;
      changeType: string;
      changeDescription?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const nextVersionNumber = (versions[0]?.versionNumber || 0) + 1;

      const insertData: Record<string, unknown> = {
        user_id: user.id,
        lyrics: content,
        version_number: nextVersionNumber,
        change_type: changeType,
        change_description: changeDescription,
        is_current: true,
      };

      if (lyricsTemplateId) {
        insertData.lyrics_template_id = lyricsTemplateId;
      } else if (projectTrackId) {
        insertData.project_track_id = projectTrackId;
      }

      // Mark previous versions as not current
      if (lyricsTemplateId) {
        await supabase
          .from('lyrics_versions')
          .update({ is_current: false })
          .eq('lyrics_template_id', lyricsTemplateId);
      } else if (projectTrackId) {
        await supabase
          .from('lyrics_versions')
          .update({ is_current: false })
          .eq('project_track_id', projectTrackId);
      }

      const { data, error } = await supabase
        .from('lyrics_versions')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: versionsKey });
      setIsDirty(false);
    },
  });

  // Restore version mutation
  const restoreVersionMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const version = versions.find(v => v.id === versionId);
      if (!version) throw new Error('Version not found');
      return version;
    },
    onSuccess: (version) => {
      setLyrics(version.lyrics);
      setIsDirty(true);
    },
  });

  // Add section note mutation
  const addNoteMutation = useMutation({
    mutationFn: async ({
      sectionId,
      sectionType,
      notes,
      tags,
    }: {
      sectionId: string;
      sectionType?: string;
      notes: string;
      tags?: string[];
    }) => {
      if (!user?.id || !lyricsTemplateId) throw new Error('Not authenticated or no template');

      const { data, error } = await supabase
        .from('lyrics_section_notes')
        .insert({
          user_id: user.id,
          lyrics_template_id: lyricsTemplateId,
          section_id: sectionId,
          section_type: sectionType,
          notes,
          tags,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKey });
      toast.success('Заметка добавлена');
    },
  });

  // Update section note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({
      noteId,
      notes,
      tags,
    }: {
      noteId: string;
      notes: string;
      tags?: string[];
    }) => {
      const { data, error } = await supabase
        .from('lyrics_section_notes')
        .update({ notes, tags, updated_at: new Date().toISOString() })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKey });
    },
  });

  // Delete section note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('lyrics_section_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKey });
      toast.success('Заметка удалена');
    },
  });

  // Actions
  const handleLyricsChange = useCallback((newLyrics: string) => {
    setLyrics(newLyrics);
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await createVersionMutation.mutateAsync({
        content: lyrics,
        changeType: 'manual_edit',
        changeDescription: 'Редактирование в студии',
      });
      onSave?.(lyrics);
      toast.success('Текст сохранён');
    } catch (error) {
      logger.error('Failed to save lyrics', error);
      toast.error('Ошибка сохранения');
    }
  }, [lyrics, createVersionMutation, onSave]);

  const handleRestoreVersion = useCallback(async (versionId: string) => {
    try {
      await restoreVersionMutation.mutateAsync(versionId);
      toast.success('Версия восстановлена');
    } catch (error) {
      logger.error('Failed to restore version', error);
      toast.error('Ошибка восстановления');
    }
  }, [restoreVersionMutation]);

  const handleAIToolSelect = useCallback((toolId: string) => {
    setActiveAITool(toolId);
    logger.info('AI tool selected', { toolId });
  }, []);

  const handleAIToolClose = useCallback(() => {
    setActiveAITool(null);
  }, []);

  return {
    // State
    lyrics,
    sections,
    versions,
    sectionNotes,
    stats,
    isDirty,
    activeAITool,

    // Loading states
    isLoading: versionsLoading || notesLoading,
    isSaving: createVersionMutation.isPending,
    isRestoring: restoreVersionMutation.isPending,

    // Actions
    setLyrics: handleLyricsChange,
    save: handleSave,
    restoreVersion: handleRestoreVersion,
    selectAITool: handleAIToolSelect,
    closeAITool: handleAIToolClose,

    // Section notes actions
    addNote: addNoteMutation.mutateAsync,
    updateNote: updateNoteMutation.mutateAsync,
    deleteNote: deleteNoteMutation.mutateAsync,

    // Constants
    aiTools: AI_TOOLS,
  };
}

export type UseLyricsStudioReturn = ReturnType<typeof useLyricsStudio>;
