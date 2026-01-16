import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

const DRAFT_KEY = 'generate_form_draft';
const DRAFT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
const DRAFT_VERSION = 1; // Version number for migration compatibility
const AUTO_SAVE_DELAY_MS = 2000; // 2 seconds after user stops typing

export type GenerationModeType = 'simple' | 'custom' | 'wizard';

export interface GenerateDraft {
  mode: GenerationModeType;
  description: string;
  title: string;
  lyrics: string;
  style: string;
  hasVocals: boolean;
  model: string;
  negativeTags: string;
  vocalGender: '' | 'm' | 'f';
  savedAt: number;
  version: number;
}

const defaultDraft: GenerateDraft = {
  mode: 'simple',
  description: '',
  title: '',
  lyrics: '',
  style: '',
  hasVocals: true,
  model: 'V4_5ALL',
  negativeTags: '',
  vocalGender: '',
  savedAt: 0,
  version: DRAFT_VERSION,
};

export function useGenerateDraft() {
  const [draft, setDraft] = useState<GenerateDraft | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed: GenerateDraft = JSON.parse(saved);
        
        // Check version compatibility (in future we can migrate old drafts)
        if (parsed.version !== DRAFT_VERSION) {
          logger.info('Draft version mismatch, clearing', { 
            savedVersion: parsed.version, 
            currentVersion: DRAFT_VERSION 
          });
          localStorage.removeItem(DRAFT_KEY);
          return;
        }
        
        // Check if draft is still valid (not expired)
        if (Date.now() - parsed.savedAt < DRAFT_EXPIRY_MS) {
          // Check if there's actual content
          const hasContent = parsed.description || parsed.title || parsed.lyrics || parsed.style;
          if (hasContent) {
            setDraft(parsed);
            setHasDraft(true);
            logger.info('Draft loaded', { age: Date.now() - parsed.savedAt });
          } else {
            localStorage.removeItem(DRAFT_KEY);
          }
        } else {
          // Draft expired, remove it
          logger.info('Draft expired', { age: Date.now() - parsed.savedAt });
          localStorage.removeItem(DRAFT_KEY);
        }
      }
    } catch (e) {
      logger.error('Failed to load draft', e);
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Save draft immediately
  const saveDraft = useCallback((data: Partial<GenerateDraft>) => {
    const newDraft: GenerateDraft = {
      ...defaultDraft,
      ...data,
      savedAt: Date.now(),
      version: DRAFT_VERSION,
    };
    
    // Only save if there's actual content
    const hasContent = newDraft.description || newDraft.title || newDraft.lyrics || newDraft.style;
    if (hasContent) {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(newDraft));
        setDraft(newDraft);
        setHasDraft(true);
        logger.debug('Draft saved', { hasContent });
      } catch (e) {
        logger.error('Failed to save draft', e);
      }
    }
  }, []);

  // Auto-save with debounce (2 seconds after user stops typing)
  const autoSaveDraft = useCallback((data: Partial<GenerateDraft>) => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set auto-saving indicator
    setIsAutoSaving(true);

    // Start new timer
    autoSaveTimerRef.current = setTimeout(() => {
      const newDraft: GenerateDraft = {
        ...defaultDraft,
        ...data,
        savedAt: Date.now(),
        version: DRAFT_VERSION,
      };
      
      // Only save if there's actual content
      const hasContent = newDraft.description || newDraft.title || newDraft.lyrics || newDraft.style;
      if (hasContent) {
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(newDraft));
          setDraft(newDraft);
          setHasDraft(true);
          setIsAutoSaving(false);
          logger.debug('Draft auto-saved', { delay: AUTO_SAVE_DELAY_MS });
        } catch (e) {
          logger.error('Failed to auto-save draft', e);
          setIsAutoSaving(false);
        }
      } else {
        setIsAutoSaving(false);
      }
    }, AUTO_SAVE_DELAY_MS);
  }, []);

  // Clear draft
  const clearDraft = useCallback(() => {
    // Clear any pending auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    
    localStorage.removeItem(DRAFT_KEY);
    setDraft(null);
    setHasDraft(false);
    setIsAutoSaving(false);
    logger.info('Draft cleared');
  }, []);

  return {
    draft,
    hasDraft,
    isAutoSaving,
    saveDraft,
    autoSaveDraft,
    clearDraft,
  };
}
