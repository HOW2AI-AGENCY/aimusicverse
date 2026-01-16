/**
 * Lyrics Store
 *
 * Manages lyrics and section notes for the studio.
 * Extracted from useUnifiedStudioStore for better maintainability.
 *
 * @module stores/studio/useLyricsStore
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '@/lib/logger';
import type { NoteType } from '@/types/studio-entities';
import type { StudioLyricVersion, StudioSectionNote } from './types';
import { generateId } from './types';

const lyricsLogger = logger.child({ module: 'LyricsStore' });

// ============ State Interface ============

interface LyricsState {
  // State
  currentLyrics: string | null;
  lyricsVersions: StudioLyricVersion[];
  currentVersionId: string | null;
  isLyricsDirty: boolean;
  sectionNotes: StudioSectionNote[];
  activeNoteId: string | null;

  // Actions
  setCurrentLyrics: (content: string) => void;
  setCurrentVersionId: (versionId: string | null) => void;
  markLyricsDirty: () => void;
  markLyricsClean: () => void;
  addSectionNote: (note: Omit<StudioSectionNote, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateSectionNote: (noteId: string, updates: Partial<Omit<StudioSectionNote, 'id' | 'sectionId' | 'createdAt'>>) => void;
  deleteSectionNote: (noteId: string) => void;
  setActiveNoteId: (noteId: string | null) => void;
  createVersion: (content: string, changeSummary?: string) => StudioLyricVersion;
  loadVersions: (versions: StudioLyricVersion[]) => void;
  clear: () => void;
}

// ============ Store Implementation ============

export const useLyricsStore = create<LyricsState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentLyrics: null,
      lyricsVersions: [],
      currentVersionId: null,
      isLyricsDirty: false,
      sectionNotes: [],
      activeNoteId: null,

      /**
       * Set the current lyrics content
       * Updates the working lyrics and marks as dirty if different from current
       *
       * @param content - The new lyrics content
       *
       * @example
       * setCurrentLyrics('Verse 1\nLyrics here...');
       */
      setCurrentLyrics: (content: string) => {
        set(state => {
          // Only mark as dirty if content actually changed
          const isDirty = state.currentLyrics !== content;
          return {
            currentLyrics: content,
            isLyricsDirty: isDirty ? true : state.isLyricsDirty,
          };
        });

        lyricsLogger.debug('Current lyrics updated', { length: content.length, isDirty: get().isLyricsDirty });
      },

      /**
       * Set the current active lyrics version ID
       * Updates which version is currently selected/active
       *
       * @param versionId - The version ID to set as active, or null to clear
       *
       * @example
       * setCurrentVersionId('version-uuid');
       * setCurrentVersionId(null); // Clear active version
       */
      setCurrentVersionId: (versionId: string | null) => {
        set({ currentVersionId: versionId });

        lyricsLogger.debug('Active version changed', { versionId });
      },

      /**
       * Mark lyrics as dirty (unsaved changes)
       * Use this to indicate that lyrics have been modified but not saved
       *
       * @example
       * markLyricsDirty();
       */
      markLyricsDirty: () => {
        set({ isLyricsDirty: true });

        lyricsLogger.debug('Lyrics marked as dirty');
      },

      /**
       * Mark lyrics as clean (no unsaved changes)
       * Use this after successfully saving lyrics to clear dirty state
       *
       * @example
       * markLyricsClean();
       */
      markLyricsClean: () => {
        set({ isLyricsDirty: false });

        lyricsLogger.debug('Lyrics marked as clean');
      },

      /**
       * Add a new section note
       * Creates a note with a generated ID and timestamps
       *
       * @param note - The note data without id, createdAt, updatedAt
       * @returns The generated note ID
       *
       * @example
       * const noteId = addSectionNote({
       *   sectionId: 'section-uuid',
       *   content: 'Add more emotion here',
       *   noteType: NoteType.PRODUCTION,
       *   isResolved: false
       * });
       */
      addSectionNote: (note: Omit<StudioSectionNote, 'id' | 'createdAt' | 'updatedAt'>) => {
        const noteId = generateId();
        const now = new Date();
        const newNote: StudioSectionNote = {
          id: noteId,
          ...note,
          createdAt: now,
          updatedAt: now,
        };

        set(state => ({
          sectionNotes: [...state.sectionNotes, newNote],
        }));

        lyricsLogger.info('Section note added', { noteId, sectionId: note.sectionId, noteType: note.noteType });
        return noteId;
      },

      /**
       * Update an existing section note
       * Modifies note content, type, or resolved status
       *
       * @param noteId - The ID of the note to update
       * @param updates - Partial updates to apply to the note
       *
       * @example
       * updateSectionNote('note-uuid', {
       *   content: 'Updated note content',
       *   isResolved: true
       * });
       */
      updateSectionNote: (noteId: string, updates: Partial<Omit<StudioSectionNote, 'id' | 'sectionId' | 'createdAt'>>) => {
        set(state => ({
          sectionNotes: state.sectionNotes.map(note =>
            note.id === noteId
              ? { ...note, ...updates, updatedAt: new Date() }
              : note
          ),
        }));

        lyricsLogger.debug('Section note updated', { noteId, updates });
      },

      /**
       * Delete a section note
       * Removes the note from the section notes array
       *
       * @param noteId - The ID of the note to delete
       *
       * @example
       * deleteSectionNote('note-uuid');
       */
      deleteSectionNote: (noteId: string) => {
        set(state => ({
          sectionNotes: state.sectionNotes.filter(note => note.id !== noteId),
          activeNoteId: state.activeNoteId === noteId ? null : state.activeNoteId,
        }));

        lyricsLogger.info('Section note deleted', { noteId });
      },

      /**
       * Set the active note ID (currently editing)
       * Tracks which note is currently being edited in the UI
       *
       * @param noteId - The note ID to set as active, or null to clear
       *
       * @example
       * setActiveNoteId('note-uuid'); // Start editing
       * setActiveNoteId(null); // Finish editing
       */
      setActiveNoteId: (noteId: string | null) => {
        set({ activeNoteId: noteId });

        lyricsLogger.debug('Active note changed', { noteId });
      },

      /**
       * Create a new lyrics version from current content
       * Automatically increments version number
       *
       * @param content - The lyrics content for the new version
       * @param changeSummary - Optional summary of changes
       * @returns The newly created version
       *
       * @example
       * const version = createVersion('New lyrics content', 'Fixed verse 2');
       */
      createVersion: (content: string, changeSummary?: string) => {
        const { lyricsVersions } = get();
        const versionNumber = lyricsVersions.length > 0
          ? Math.max(...lyricsVersions.map(v => v.versionNumber)) + 1
          : 1;

        const newVersion: StudioLyricVersion = {
          id: generateId(),
          versionNumber,
          content,
          isCurrent: true,
          changeSummary,
          createdAt: new Date(),
        };

        // Mark all other versions as not current
        const updatedVersions = lyricsVersions.map(v => ({
          ...v,
          isCurrent: false,
        }));

        set({
          lyricsVersions: [...updatedVersions, newVersion],
          currentVersionId: newVersion.id,
          currentLyrics: content,
          isLyricsDirty: false,
        });

        lyricsLogger.info('Lyrics version created', { versionId: newVersion.id, versionNumber, changeSummary });
        return newVersion;
      },

      /**
       * Load existing lyrics versions
       * Replaces the current versions array
       *
       * @param versions - Array of lyric versions to load
       *
       * @example
       * loadVersions([version1, version2, version3]);
       */
      loadVersions: (versions: StudioLyricVersion[]) => {
        set({
          lyricsVersions: versions,
          currentVersionId: versions.find(v => v.isCurrent)?.id || null,
        });

        lyricsLogger.debug('Lyrics versions loaded', { count: versions.length });
      },

      /**
       * Clear all lyrics data
       * Resets the store to initial state
       *
       * @example
       * clear();
       */
      clear: () => {
        set({
          currentLyrics: null,
          lyricsVersions: [],
          currentVersionId: null,
          isLyricsDirty: false,
          sectionNotes: [],
          activeNoteId: null,
        });

        lyricsLogger.debug('Lyrics store cleared');
      },
    }),
    {
      name: 'musicverse-studio-lyrics-storage',
      partialize: (state) => ({
        lyricsVersions: state.lyricsVersions,
        sectionNotes: state.sectionNotes,
      }),
    }
  )
);
