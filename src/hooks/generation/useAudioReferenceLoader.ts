/**
 * Audio Reference Loader Hook
 * 
 * Extracted from useGenerateForm to eliminate duplicate pattern (IMP001)
 * Handles loading of audio references from localStorage (stem_audio_reference)
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { cleanupAudioReference } from '@/lib/errorHandling';
import { TITLE_MAX_LENGTH } from '@/constants/generationConstants';

export interface AudioReferenceData {
  url: string;
  name: string;
  lyrics?: string;
  style?: string;
  tags?: string;
  prompt?: string;
  originalTitle?: string;
  timestamp: number;
}

export interface AudioReferenceResult {
  file: File | null;
  lyrics: string;
  style: string;
  title: string;
  isLoading: boolean;
}

const REFERENCE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to load audio reference from localStorage
 * @param enabled - Whether to attempt loading the reference
 */
export function useAudioReferenceLoader(enabled: boolean): AudioReferenceResult {
  const [file, setFile] = useState<File | null>(null);
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const stemReferenceStr = localStorage.getItem('stem_audio_reference');
    if (!stemReferenceStr) return;

    setIsLoading(true);

    try {
      const stemReference: AudioReferenceData = JSON.parse(stemReferenceStr);
      
      // Check if reference has expired
      if (Date.now() - stemReference.timestamp >= REFERENCE_EXPIRY_MS) {
        logger.info('Audio reference expired', { timestamp: stemReference.timestamp });
        cleanupAudioReference();
        setIsLoading(false);
        return;
      }

      // Extract lyrics
      if (stemReference.lyrics) {
        setLyrics(stemReference.lyrics);
      }

      // Extract style from multiple possible fields
      const styleToUse = 
        stemReference.style || 
        stemReference.tags || 
        stemReference.prompt || 
        '';
      if (styleToUse) {
        setStyle(styleToUse);
      }

      // Extract title
      if (stemReference.originalTitle) {
        const remixTitle = `${stemReference.originalTitle} (ремикс)`;
        setTitle(remixTitle.slice(0, TITLE_MAX_LENGTH));
      }

      // Show success toast with loaded parts
      const loadedParts: string[] = [];
      if (stemReference.lyrics) loadedParts.push('текст');
      if (styleToUse) loadedParts.push('стиль');

      toast.success('Контекст загружен из студии', {
        description: loadedParts.length > 0 
          ? `Скопировано: ${loadedParts.join(', ')}` 
          : 'Готово к генерации',
      });

      // Load audio file
      fetch(stemReference.url)
        .then(response => response.blob())
        .then(blob => {
          const audioFile = new File(
            [blob], 
            `${stemReference.name}.mp3`, 
            { type: 'audio/mpeg' }
          );
          setFile(audioFile);
          toast.success('Аудио референс загружен!', {
            description: stemReference.name,
          });
          // Cleanup only after successful load
          cleanupAudioReference();
        })
        .catch(err => {
          logger.error('Failed to load stem reference', { error: err });
          toast.error('Не удалось загрузить аудио референс');
          // Cleanup on error as well
          cleanupAudioReference();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } catch (e) {
      logger.error('Failed to parse stem reference', { error: e });
      cleanupAudioReference();
      setIsLoading(false);
    }
  }, [enabled]);

  return {
    file,
    lyrics,
    style,
    title,
    isLoading,
  };
}
