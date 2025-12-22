/**
 * Lyrics Versioning Hook
 * Manages lyrics versions in the database
 * Supports saving, loading, and restoring versions
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LyricsSection } from '@/components/lyrics-workspace/LyricsWorkspace';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export type ChangeType = 
  | 'manual_edit' 
  | 'ai_generated' 
  | 'ai_improved' 
  | 'section_add' 
  | 'section_delete' 
  | 'section_reorder' 
  | 'restore' 
  | 'autosave';

export interface LyricsVersion {
  id: string;
  lyrics: string;
  sections_data: LyricsSection[] | null;
  tags: string[] | null;
  version_number: number;
  version_name: string | null;
  change_type: string;
  change_description: string | null;
  ai_prompt_used: string | null;
  ai_model_used: string | null;
  created_at: string;
  is_current: boolean;
}

interface SaveVersionParams {
  lyrics: string;
  sectionsData?: LyricsSection[];
  tags?: string[];
  versionName?: string;
  changeType: ChangeType;
  changeDescription?: string;
  aiPromptUsed?: string;
  aiModelUsed?: string;
  markAsCurrent?: boolean;
}

interface UseLyricsVersioningOptions {
  projectTrackId?: string | null;
  lyricsTemplateId?: string | null;
}

export function useLyricsVersioning(options: UseLyricsVersioningOptions) {
  const { projectTrackId, lyricsTemplateId } = options;
  const { user } = useAuth();
  
  const [versions, setVersions] = useState<LyricsVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<LyricsVersion | null>(null);

  // Helper to parse sections_data from Json
  const parseVersion = (data: {
    id: string;
    lyrics: string;
    sections_data: Json;
    tags: string[] | null;
    version_number: number;
    version_name: string | null;
    change_type: string;
    change_description: string | null;
    ai_prompt_used: string | null;
    ai_model_used: string | null;
    created_at: string;
    is_current: boolean | null;
  }): LyricsVersion => ({
    ...data,
    sections_data: data.sections_data as LyricsSection[] | null,
    is_current: data.is_current ?? false,
  });

  // Load versions from database
  const loadVersions = useCallback(async () => {
    if (!user || (!projectTrackId && !lyricsTemplateId)) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('lyrics_versions')
        .select('*')
        .order('version_number', { ascending: false });
      
      if (projectTrackId) {
        query = query.eq('project_track_id', projectTrackId);
      } else if (lyricsTemplateId) {
        query = query.eq('lyrics_template_id', lyricsTemplateId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const parsedVersions = (data || []).map(parseVersion);
      setVersions(parsedVersions);
      
      // Find current version
      const current = parsedVersions.find(v => v.is_current);
      setCurrentVersion(current || null);
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, projectTrackId, lyricsTemplateId]);

  // Save a new version
  const saveVersion = useCallback(async (params: SaveVersionParams): Promise<LyricsVersion | null> => {
    if (!user || (!projectTrackId && !lyricsTemplateId)) {
      toast.error('Нужна авторизация');
      return null;
    }
    
    setIsSaving(true);
    try {
      const insertData: {
        user_id: string;
        project_track_id?: string;
        lyrics_template_id?: string;
        lyrics: string;
        sections_data: Json;
        tags: string[];
        version_name: string | null;
        change_type: ChangeType;
        change_description: string | null;
        ai_prompt_used: string | null;
        ai_model_used: string | null;
        is_current: boolean;
      } = {
        user_id: user.id,
        lyrics: params.lyrics,
        sections_data: (params.sectionsData || []) as unknown as Json,
        tags: params.tags || [],
        version_name: params.versionName || null,
        change_type: params.changeType,
        change_description: params.changeDescription || null,
        ai_prompt_used: params.aiPromptUsed || null,
        ai_model_used: params.aiModelUsed || null,
        is_current: params.markAsCurrent ?? false,
      };
      
      if (projectTrackId) {
        insertData.project_track_id = projectTrackId;
      } else if (lyricsTemplateId) {
        insertData.lyrics_template_id = lyricsTemplateId;
      }
      
      const { data, error } = await supabase
        .from('lyrics_versions')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      
      const newVersion = parseVersion(data);
      
      // Update local state
      setVersions(prev => [newVersion, ...prev]);
      if (newVersion.is_current) {
        setCurrentVersion(newVersion);
      }
      
      return newVersion;
    } catch (error) {
      console.error('Error saving version:', error);
      toast.error('Ошибка сохранения версии');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [user, projectTrackId, lyricsTemplateId]);

  // Restore a specific version
  const restoreVersion = useCallback(async (versionId: string): Promise<LyricsVersion | null> => {
    const versionToRestore = versions.find(v => v.id === versionId);
    if (!versionToRestore) return null;
    
    // Create a new version marked as restore
    const restoredVersion = await saveVersion({
      lyrics: versionToRestore.lyrics,
      sectionsData: versionToRestore.sections_data || undefined,
      tags: versionToRestore.tags || undefined,
      versionName: `Восстановлено из v${versionToRestore.version_number}`,
      changeType: 'restore',
      changeDescription: `Восстановлено из версии ${versionToRestore.version_number}`,
      markAsCurrent: true,
    });
    
    if (restoredVersion) {
      toast.success(`Версия ${versionToRestore.version_number} восстановлена`);
    }
    
    return restoredVersion;
  }, [versions, saveVersion]);

  // Delete a version
  const deleteVersion = useCallback(async (versionId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('lyrics_versions')
        .delete()
        .eq('id', versionId);
      
      if (error) throw error;
      
      setVersions(prev => prev.filter(v => v.id !== versionId));
      toast.success('Версия удалена');
      return true;
    } catch (error) {
      console.error('Error deleting version:', error);
      toast.error('Ошибка удаления версии');
      return false;
    }
  }, [user]);

  // Get version count
  const getVersionCount = useCallback(() => versions.length, [versions]);

  // Initial load
  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  return {
    versions,
    currentVersion,
    isLoading,
    isSaving,
    loadVersions,
    saveVersion,
    restoreVersion,
    deleteVersion,
    getVersionCount,
  };
}

// Change type labels for UI
export const changeTypeLabels: Record<ChangeType, string> = {
  manual_edit: 'Ручное редактирование',
  ai_generated: 'AI генерация',
  ai_improved: 'AI улучшение',
  section_add: 'Добавление секции',
  section_delete: 'Удаление секции',
  section_reorder: 'Перестановка секций',
  restore: 'Восстановление',
  autosave: 'Автосохранение',
};

// Change type icons
export const changeTypeIcons: Record<ChangeType, string> = {
  manual_edit: '✏️',
  ai_generated: '✨',
  ai_improved: '🔮',
  section_add: '➕',
  section_delete: '➖',
  section_reorder: '↕️',
  restore: '🔄',
  autosave: '💾',
};
