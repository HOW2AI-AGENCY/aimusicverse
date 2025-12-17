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
import { cleanupAudioReference } from '@/lib/errorHandling';
import { TITLE_MAX_LENGTH } from '@/constants/generationConstants';
import { ReferenceManager, ACTIVE_REFERENCE_KEY } from '@/services/audio-reference';

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

    // LEGACY: Check for cloud audio reference (from Cloud tab)
    const cloudReferenceStr = sessionStorage.getItem('cloudAudioReference');
    if (cloudReferenceStr) {
      setIsLoading(true);
      
      try {
        const cloudRef: CloudAudioReference = JSON.parse(cloudReferenceStr);
        
        // Set mode
        setCloudMode(cloudRef.mode);
        
        // Build style from metadata - prefer style_description if available
        if (cloudRef.styleDescription) {
          setStyle(cloudRef.styleDescription);
        } else {
          const styleParts: string[] = [];
          if (cloudRef.genre) styleParts.push(cloudRef.genre);
          if (cloudRef.mood) styleParts.push(cloudRef.mood);
          if (cloudRef.vocalStyle) styleParts.push(cloudRef.vocalStyle);
          if (cloudRef.tempo) styleParts.push(cloudRef.tempo);
          if (cloudRef.energy) styleParts.push(cloudRef.energy);
          if (cloudRef.bpm) styleParts.push(`${cloudRef.bpm} BPM`);
          if (cloudRef.instruments?.length) styleParts.push(cloudRef.instruments.join(', '));
          if (styleParts.length > 0) {
            setStyle(styleParts.join(', '));
          }
        }
        
        // Set pre-calculated duration if available
        if (cloudRef.durationSeconds) {
          setDuration(cloudRef.durationSeconds);
        }
        
        // Set lyrics if available
        if (cloudRef.transcription) {
          setLyrics(cloudRef.transcription);
        }
        
        // Load audio file
        fetch(cloudRef.fileUrl)
          .then(response => response.blob())
          .then(async (blob) => {
            // Calculate duration before creating file
            const audioDuration = await calculateDuration(blob);
            setDuration(audioDuration);
            
            const ext = cloudRef.fileName.split('.').pop() || 'mp3';
            const audioFile = new File(
              [blob], 
              cloudRef.fileName, 
              { type: `audio/${ext === 'wav' ? 'wav' : 'mpeg'}` }
            );
            setFile(audioFile);
            
            const modeLabel = cloudRef.mode === 'cover' ? 'Кавер' : 'Расширение';
            toast.success(`Аудио загружено для: ${modeLabel}`, {
              description: `${cloudRef.fileName} (${Math.round(audioDuration)}с)`,
            });
            
            // Cleanup
            sessionStorage.removeItem('cloudAudioReference');
          })
          .catch(err => {
            logger.error('Failed to load cloud audio reference', { error: err });
            toast.error('Не удалось загрузить аудио');
            sessionStorage.removeItem('cloudAudioReference');
          })
          .finally(() => {
            setIsLoading(false);
          });
          
        return; // Don't check other sources
      } catch (e) {
        logger.error('Failed to parse cloud reference', { error: e });
        sessionStorage.removeItem('cloudAudioReference');
        setIsLoading(false);
      }
    }

    // Check for stem audio reference (from Stem Studio)
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

      // Extract action and stem type
      if (stemReference.action) {
        setAction(stemReference.action);
      }
      if (stemReference.stemType) {
        setStemType(stemReference.stemType);
      }

      // Show success toast with loaded parts
      const loadedParts: string[] = [];
      if (stemReference.lyrics) loadedParts.push('текст');
      if (styleToUse) loadedParts.push('стиль');
      if (stemReference.action) {
        // Translate action to Russian
        const actionLabels: Record<string, string> = {
          'add-vocals-to-instrumental': 'добавить вокал',
          'add-instrumental-to-vocals': 'добавить аранжировку',
          'create-instrumental': 'создать инструментал',
          'regenerate-from-stem': 'регенерация',
        };
        loadedParts.push(actionLabels[stemReference.action] || 'действие');
      }

      toast.success('Контекст загружен из студии', {
        description: loadedParts.length > 0
          ? `Скопировано: ${loadedParts.join(', ')}`
          : 'Готово к генерации',
      });

      // Load audio file
      fetch(stemReference.url)
        .then(response => response.blob())
        .then(async (blob) => {
          // Calculate duration before creating file
          const audioDuration = await calculateDuration(blob);
          setDuration(audioDuration);
          
          const audioFile = new File(
            [blob], 
            `${stemReference.name}.mp3`, 
            { type: 'audio/mpeg' }
          );
          setFile(audioFile);
          toast.success('Аудио референс загружен!', {
            description: `${stemReference.name} (${Math.round(audioDuration)}с)`,
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
