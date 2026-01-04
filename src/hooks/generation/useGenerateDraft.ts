import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

const DRAFT_KEY = 'generate_form_draft';
const DRAFT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export interface GenerateDraft {
  mode: 'simple' | 'custom';
  description: string;
  title: string;
  lyrics: string;
  style: string;
  hasVocals: boolean;
  model: string;
  negativeTags: string;
  vocalGender: '' | 'm' | 'f';
  savedAt: number;
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
};

export function useGenerateDraft() {
  const [draft, setDraft] = useState<GenerateDraft | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  // Load draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed: GenerateDraft = JSON.parse(saved);
        // Check if draft is still valid (not expired)
        if (Date.now() - parsed.savedAt < DRAFT_EXPIRY_MS) {
          // Check if there's actual content
          const hasContent = parsed.description || parsed.title || parsed.lyrics || parsed.style;
          if (hasContent) {
            setDraft(parsed);
            setHasDraft(true);
          } else {
            localStorage.removeItem(DRAFT_KEY);
          }
        } else {
          // Draft expired, remove it
          localStorage.removeItem(DRAFT_KEY);
        }
      }
    } catch (e) {
      logger.error('Failed to load draft', e);
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  // Save draft
  const saveDraft = useCallback((data: Partial<GenerateDraft>) => {
    const newDraft: GenerateDraft = {
      ...defaultDraft,
      ...data,
      savedAt: Date.now(),
    };
    
    // Only save if there's actual content
    const hasContent = newDraft.description || newDraft.title || newDraft.lyrics || newDraft.style;
    if (hasContent) {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(newDraft));
        setDraft(newDraft);
        setHasDraft(true);
      } catch (e) {
        logger.error('Failed to save draft', e);
      }
    }
  }, []);

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setDraft(null);
    setHasDraft(false);
  }, []);

  return {
    draft,
    hasDraft,
    saveDraft,
    clearDraft,
  };
}
