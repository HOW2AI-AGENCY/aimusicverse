/**
 * Audio Reference Loader Hook
 * 
 * Extracted from useGenerateForm to eliminate duplicate pattern (IMP001)
 * Now also checks unified ReferenceManager for active references
 * 
 * NOTE: This is a LEGACY hook. Prefer using useAudioReference from @/hooks/useAudioReference
 * for new code. This loader maintains backward compatibility during migration.
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { TITLE_MAX_LENGTH } from '@/constants/generationConstants';
import { ReferenceManager } from '@/services/audio-reference';

export interface AudioReferenceData {
  url: string;
  name: string;
  lyrics?: string;
  style?: string;
  tags?: string;
  prompt?: string;
  originalTitle?: string;
  timestamp: number;
  action?: string;
  stemType?: string;
  trackId?: string;
}

export interface CloudAudioReference {
  id: string;
  fileUrl: string;
  fileName: string;
  mode: 'cover' | 'extend';
  genre?: string;
  mood?: string;
  vocalStyle?: string;
  styleDescription?: string;
  transcription?: string;
  bpm?: number;
  tempo?: string;
  energy?: string;
  instruments?: string[];
  durationSeconds?: number;
}

export interface AudioReferenceResult {
  file: File | null;
  duration: number | null;
  lyrics: string;
  style: string;
  title: string;
  action: string | null;
  stemType: string | null;
  isLoading: boolean;
  cloudMode: 'cover' | 'extend' | null;
}

const REFERENCE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to load audio reference from localStorage/sessionStorage
 * @param enabled - Whether to attempt loading the reference
 */
export function useAudioReferenceLoader(enabled: boolean): AudioReferenceResult {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState('');
  const [title, setTitle] = useState('');
  const [action, setAction] = useState<string | null>(null);
  const [stemType, setStemType] = useState<string | null>(null);
  const [cloudMode, setCloudMode] = useState<'cover' | 'extend' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to calculate audio duration from a blob
  const calculateDuration = (blob: Blob): Promise<number> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio();
      audio.src = url;
      audio.onloadedmetadata = () => {
        const dur = audio.duration;
        URL.revokeObjectURL(url);
        // Handle NaN/Infinity cases
        if (isNaN(dur) || !isFinite(dur)) {
          resolve(0);
        } else {
          resolve(dur);
        }
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(0);
      };
    });
  };

  useEffect(() => {
    if (!enabled) return;

    // FIRST: Check unified ReferenceManager for active reference
    const unifiedRef = ReferenceManager.getActive();
    if (unifiedRef) {
      setIsLoading(true);
      
      // Set mode
      setCloudMode(unifiedRef.intendedMode || null);
      
      // Set analysis data
      if (unifiedRef.analysis?.styleDescription) {
        setStyle(unifiedRef.analysis.styleDescription);
      } else if (unifiedRef.analysis) {
        const styleParts: string[] = [];
        if (unifiedRef.analysis.genre) styleParts.push(unifiedRef.analysis.genre);
        if (unifiedRef.analysis.mood) styleParts.push(unifiedRef.analysis.mood);
        if (unifiedRef.analysis.vocalStyle) styleParts.push(unifiedRef.analysis.vocalStyle);
        if (unifiedRef.analysis.bpm) styleParts.push(`${unifiedRef.analysis.bpm} BPM`);
        if (styleParts.length > 0) setStyle(styleParts.join(', '));
      }
      
      if (unifiedRef.durationSeconds) {
        setDuration(unifiedRef.durationSeconds);
      }
      
      if (unifiedRef.analysis?.transcription) {
        setLyrics(unifiedRef.analysis.transcription);
      }
      
      if (unifiedRef.context?.action) {
        setAction(unifiedRef.context.action);
      }
      
      if (unifiedRef.context?.stemType) {
        setStemType(unifiedRef.context.stemType);
      }
      
      if (unifiedRef.context?.originalTitle) {
        const remixTitle = `${unifiedRef.context.originalTitle} (ремикс)`;
        setTitle(remixTitle.slice(0, TITLE_MAX_LENGTH));
      }
      
      // Load audio file from URL
      fetch(unifiedRef.audioUrl)
        .then(response => response.blob())
        .then(async (blob) => {
          const audioDuration = await calculateDuration(blob);
          setDuration(audioDuration);
          
          const ext = unifiedRef.fileName.split('.').pop() || 'mp3';
          const audioFile = new File(
            [blob],
            unifiedRef.fileName,
            { type: `audio/${ext === 'wav' ? 'wav' : 'mpeg'}` }
          );
          setFile(audioFile);
          
          const modeLabel = unifiedRef.intendedMode === 'cover' ? 'Кавер' : 
                           unifiedRef.intendedMode === 'extend' ? 'Расширение' : 'Референс';
          toast.success(`Аудио загружено: ${modeLabel}`, {
            description: `${unifiedRef.fileName} (${Math.round(audioDuration)}с)`,
          });
          
          // Clear after loading (one-time use)
          ReferenceManager.clearActive();
        })
        .catch(err => {
          logger.error('Failed to load unified reference', { error: err });
          toast.error('Не удалось загрузить аудио');
          ReferenceManager.clearActive();
        })
        .finally(() => {
          setIsLoading(false);
        });
      
      return; // Don't check legacy sources
    }

    // NOTE: All legacy storage keys (cloudAudioReference, stem_audio_reference, 
    // audioReferenceFromDrums, etc.) are now handled by ReferenceManager.
    // Legacy keys are automatically cleaned up by ReferenceManager.cleanupExpired()
  }, [enabled]);

  return {
    file,
    duration,
    lyrics,
    style,
    title,
    action,
    stemType,
    isLoading,
    cloudMode,
  };
}
