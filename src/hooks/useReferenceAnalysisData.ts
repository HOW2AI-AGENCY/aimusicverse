/**
 * Hook to manage reference analysis data for form pre-filling
 * Provides a bridge between reference audio analysis and generation forms
 */

import { useCallback } from 'react';

export interface ReferenceAnalysisData {
  id: string;
  fileName: string;
  title?: string;
  style?: string;
  lyrics?: string;
  bpm?: number;
  genre?: string;
  mood?: string;
  energy?: string;
  instruments?: string[];
  vocalStyle?: string;
  hasVocals?: boolean;
  hasInstrumentals?: boolean;
  audioUrl?: string;
  // Stem URLs
  vocalStemUrl?: string;
  instrumentalStemUrl?: string;
  drumsStemUrl?: string;
  bassStemUrl?: string;
  otherStemUrl?: string;
}

const STORAGE_KEY = 'referenceAnalysisData';

export function useReferenceAnalysisData() {
  /**
   * Save reference analysis data to session storage
   */
  const saveAnalysisData = useCallback((data: ReferenceAnalysisData) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...data,
        savedAt: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to save reference analysis data:', error);
    }
  }, []);

  /**
   * Load reference analysis data from session storage
   */
  const loadAnalysisData = useCallback((): ReferenceAnalysisData | null => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored);
      
      // Check if data is expired (5 minutes)
      if (data.savedAt && Date.now() - data.savedAt > 5 * 60 * 1000) {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return data as ReferenceAnalysisData;
    } catch (error) {
      console.error('Failed to load reference analysis data:', error);
      return null;
    }
  }, []);

  /**
   * Clear reference analysis data from session storage
   */
  const clearAnalysisData = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  /**
   * Build a style description from analysis data
   */
  const buildStyleDescription = useCallback((data: ReferenceAnalysisData): string => {
    const parts: string[] = [];

    if (data.genre) parts.push(data.genre);
    if (data.mood) parts.push(data.mood);
    if (data.energy) parts.push(`${data.energy} energy`);
    if (data.vocalStyle) parts.push(`${data.vocalStyle} vocals`);
    if (data.bpm) parts.push(`${data.bpm} BPM`);
    if (data.instruments?.length) {
      parts.push(data.instruments.slice(0, 3).join(', '));
    }
    if (data.style) parts.push(data.style);

    return parts.join(', ');
  }, []);

  /**
   * Build title suggestion from file name
   */
  const buildTitleFromFileName = useCallback((fileName: string): string => {
    return fileName
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[-_]/g, ' ')    // Replace dashes/underscores with spaces
      .replace(/\s+/g, ' ')     // Normalize spaces
      .trim();
  }, []);

  return {
    saveAnalysisData,
    loadAnalysisData,
    clearAnalysisData,
    buildStyleDescription,
    buildTitleFromFileName,
  };
}
