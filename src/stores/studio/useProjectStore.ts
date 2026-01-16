/**
 * Project Store
 *
 * Manages studio project CRUD operations.
 * Extracted from useUnifiedStudioStore for better maintainability.
 *
 * @module stores/studio/useProjectStore
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';
import type {
  StudioProject,
  CreateProjectParams,
  ProjectStatus,
  StemsMode,
  ViewSettings,
} from './types';
import { createDefaultViewSettings, generateId } from './types';

const projectLogger = logger.child({ module: 'ProjectStore' });

// ============ State Interface ============

interface ProjectState {
  // State
  project: StudioProject | null;
  projectId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  hasUnsavedChanges: boolean;

  // Actions
  createProject: (params: CreateProjectParams) => Promise<string | null>;
  loadProject: (projectId: string) => Promise<boolean>;
  loadProjectFromData: (data: StudioProject) => void;
  saveProject: () => Promise<boolean>;
  closeProject: () => void;
  deleteProject: (projectId: string) => Promise<boolean>;
  setProjectStatus: (status: ProjectStatus) => void;
  setMasterVolume: (volume: number) => void;
  setBpm: (bpm: number) => void;
  markAsDirty: () => void;
  markAsClean: () => void;
}

// ============ Store Implementation ============

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      // Initial state
      project: null,
      projectId: null,
      isLoading: false,
      isSaving: false,
      lastSavedAt: null,
      hasUnsavedChanges: false,

      /**
       * Create a new studio project
       */
      createProject: async (params: CreateProjectParams) => {
        const projectId = generateId();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          projectLogger.error('No authenticated user found');
          return null;
        }

        const tracks = params.tracks || [];

        const project: StudioProject = {
          id: projectId,
          userId: user.id,
          sourceTrackId: params.sourceTrackId,
          name: params.name,
          description: undefined,
          bpm: 120,
          keySignature: undefined,
          timeSignature: '4/4',
          durationSeconds: params.duration,
          masterVolume: 0.85,
          tracks: tracks.map(t => ({ ...t, id: generateId(), clips: [] })),
          status: 'draft',
          stemsMode: 'none',
          viewSettings: createDefaultViewSettings(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({
          project,
          projectId,
          hasUnsavedChanges: true,
        });

        // Save to database
        try {
          const { error } = await supabase.from('studio_projects').insert({
            id: projectId,
            user_id: user.id,
            source_track_id: params.sourceTrackId,
            name: params.name,
            bpm: 120,
            time_signature: '4/4',
            duration_seconds: params.duration,
            master_volume: 0.85,
            tracks: project.tracks as unknown as Json,
            status: 'draft',
            stems_mode: 'none',
            view_settings: createDefaultViewSettings() as unknown as Json,
          });

          if (error) throw error;

          set({ hasUnsavedChanges: false, lastSavedAt: new Date().toISOString() });

          projectLogger.info('Project created successfully', { projectId, name: params.name });
          return projectId;
        } catch (err) {
          projectLogger.error('Failed to save project to database', { error: err, projectId });
          // Import toast dynamically to avoid circular dependency
          import('sonner').then(({ toast }) => {
            toast.error('Не удалось создать проект', {
              description: 'Проверьте подключение к интернету'
            });
          });
          // Clear the in-memory project since it wasn't saved
          set({ project: null, projectId: null, hasUnsavedChanges: false });
          return null;
        }
      },

      /**
       * Load a project from the database
       */
      loadProject: async (projectId: string) => {
        set({ isLoading: true });

        try {
          const { data, error } = await supabase
            .from('studio_projects')
            .select('*')
            .eq('id', projectId)
            .single();

          if (error) throw error;
          if (!data) throw new Error('Project not found');

          const project: StudioProject = {
            id: data.id,
            userId: data.user_id,
            sourceTrackId: data.source_track_id || undefined,
            name: data.name,
            description: data.description || undefined,
            bpm: data.bpm || 120,
            keySignature: data.key_signature || undefined,
            timeSignature: data.time_signature || '4/4',
            durationSeconds: data.duration_seconds || undefined,
            masterVolume: Number(data.master_volume) || 0.85,
            tracks: (data.tracks as unknown as any[]) || [],
            status: (data.status as ProjectStatus) || 'draft',
            stemsMode: (data.stems_mode as StemsMode) || 'none',
            viewSettings: (data.view_settings as unknown as ViewSettings) || createDefaultViewSettings(),
            createdAt: data.created_at || new Date().toISOString(),
            updatedAt: data.updated_at || new Date().toISOString(),
            openedAt: data.opened_at || undefined,
          };

          set({
            project,
            projectId,
            isLoading: false,
            hasUnsavedChanges: false,
            lastSavedAt: data.updated_at,
          });

          // Update opened_at
          await supabase
            .from('studio_projects')
            .update({ opened_at: new Date().toISOString() })
            .eq('id', projectId);

          projectLogger.info('Project loaded successfully', { projectId, name: project.name });
          return true;
        } catch (err) {
          projectLogger.error('Failed to load project', { error: err, projectId });
          set({ isLoading: false });
          return false;
        }
      },

      /**
       * Load project from existing data (without database call)
       */
      loadProjectFromData: (data: StudioProject) => {
        set({
          project: data,
          projectId: data.id,
          hasUnsavedChanges: false,
        });
        projectLogger.debug('Project loaded from data', { projectId: data.id, name: data.name });
      },

      /**
       * Save current project to database
       */
      saveProject: async () => {
        const { project } = get();
        if (!project) return false;

        set({ isSaving: true });

        try {
          const { error } = await supabase
            .from('studio_projects')
            .update({
              name: project.name,
              description: project.description,
              bpm: project.bpm,
              key_signature: project.keySignature,
              time_signature: project.timeSignature,
              duration_seconds: project.durationSeconds,
              master_volume: project.masterVolume,
              tracks: project.tracks as unknown as Json,
              status: project.status,
              stems_mode: project.stemsMode,
              view_settings: project.viewSettings as unknown as Json,
              updated_at: new Date().toISOString(),
            })
            .eq('id', project.id);

          if (error) throw error;

          set({
            isSaving: false,
            hasUnsavedChanges: false,
            lastSavedAt: new Date().toISOString(),
          });

          projectLogger.info('Project saved successfully', { projectId: project.id });
          return true;
        } catch (err) {
          projectLogger.error('Failed to save project', { error: err, projectId: project?.id });
          set({ isSaving: false });
          return false;
        }
      },

      /**
       * Close current project
       */
      closeProject: () => {
        set({
          project: null,
          projectId: null,
          hasUnsavedChanges: false,
          lastSavedAt: null,
        });
        projectLogger.debug('Project closed');
      },

      /**
       * Delete a project from database
       */
      deleteProject: async (projectId: string) => {
        try {
          const { error } = await supabase
            .from('studio_projects')
            .delete()
            .eq('id', projectId);

          if (error) throw error;

          // If deleting current project, close it
          const { project } = get();
          if (project?.id === projectId) {
            get().closeProject();
          }

          projectLogger.info('Project deleted successfully', { projectId });
          return true;
        } catch (err) {
          projectLogger.error('Failed to delete project', { error: err, projectId });
          return false;
        }
      },

      /**
       * Update project status
       */
      setProjectStatus: (status: ProjectStatus) => {
        const { project } = get();
        if (!project) return;

        set({
          project: { ...project, status, updatedAt: new Date().toISOString() },
          hasUnsavedChanges: true,
        });
      },

      /**
       * Update master volume
       */
      setMasterVolume: (volume: number) => {
        const { project } = get();
        if (!project) return;

        set({
          project: { ...project, masterVolume: volume, updatedAt: new Date().toISOString() },
          hasUnsavedChanges: true,
        });
      },

      /**
       * Update BPM
       */
      setBpm: (bpm: number) => {
        const { project } = get();
        if (!project) return;

        set({
          project: { ...project, bpm, updatedAt: new Date().toISOString() },
          hasUnsavedChanges: true,
        });
      },

      /**
       * Mark project as having unsaved changes
       */
      markAsDirty: () => {
        set({ hasUnsavedChanges: true });
      },

      /**
       * Mark project as clean (saved)
       */
      markAsClean: () => {
        set({ hasUnsavedChanges: false });
      },
    }),
    {
      name: 'musicverse-studio-project-storage',
      partialize: (state) => ({
        project: state.project,
        projectId: state.projectId,
        lastSavedAt: state.lastSavedAt,
      }),
    }
  )
);
