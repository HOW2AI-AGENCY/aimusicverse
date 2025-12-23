/**
 * Hook for automatic cloud upload of microphone recordings
 * Handles upload to Supabase storage with retry logic and logging
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

const log = logger.child({ module: 'RecordingUpload' });

interface UploadResult {
  url: string;
  fileName: string;
  size: number;
}

interface UseRecordingUploadOptions {
  bucket?: string;
  folder?: string;
  maxRetries?: number;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
}

export function useRecordingUpload(options: UseRecordingUploadOptions = {}) {
  const {
    bucket = 'reference-audio',
    folder = 'recordings',
    maxRetries = 3,
    onSuccess,
    onError,
  } = options;

  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastUploadResult, setLastUploadResult] = useState<UploadResult | null>(null);

  const uploadRecording = useCallback(async (
    blob: Blob,
    customFileName?: string
  ): Promise<UploadResult | null> => {
    if (!user) {
      log.warn('Upload attempted without authentication');
      toast.error('Необходимо авторизоваться');
      return null;
    }

    if (!blob || blob.size === 0) {
      log.error('Empty blob provided for upload');
      toast.error('Пустая запись');
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const dateStr = new Date().toISOString().slice(0, 10);
    const timeStr = new Date().toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    }).replace(/:/g, '-');
    
    const extension = blob.type.includes('webm') ? 'webm' : 
                      blob.type.includes('mp4') ? 'm4a' : 
                      blob.type.includes('ogg') ? 'ogg' : 'webm';
    
    const fileName = customFileName || `rec_${dateStr}_${timeStr}.${extension}`;
    const filePath = `${folder}/${user.id}/${fileName}`;

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < maxRetries) {
      attempt++;
      
      try {
        log.info('Starting upload attempt', { 
          attempt, 
          filePath, 
          size: blob.size,
          type: blob.type 
        });

        setUploadProgress(attempt * 20); // Show progress during retries

        const { error: uploadError, data } = await supabase.storage
          .from(bucket)
          .upload(filePath, blob, { 
            contentType: blob.type,
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        const result: UploadResult = {
          url: urlData.publicUrl,
          fileName,
          size: blob.size,
        };

        setLastUploadResult(result);
        setUploadProgress(100);

        log.info('Upload successful', { 
          filePath, 
          url: result.url,
          size: blob.size 
        });

        onSuccess?.(result);
        
        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        log.error('Upload attempt failed', lastError, { 
          attempt, 
          maxRetries,
          filePath 
        });

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 500;
          log.info('Retrying upload', { attempt, delay });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    setIsUploading(false);
    setUploadProgress(0);
    
    const finalError = lastError || new Error('Upload failed after max retries');
    log.error('Upload failed after all retries', finalError, { 
      maxRetries, 
      filePath 
    });
    
    toast.error('Не удалось сохранить запись', {
      description: 'Проверьте подключение к интернету'
    });
    
    onError?.(finalError);
    return null;

  }, [user, bucket, folder, maxRetries, onSuccess, onError]);

  const uploadRecordingQuietly = useCallback(async (
    blob: Blob,
    customFileName?: string
  ): Promise<UploadResult | null> => {
    // Same as uploadRecording but without toast notifications
    if (!user || !blob || blob.size === 0) {
      return null;
    }

    setIsUploading(true);

    const dateStr = new Date().toISOString().slice(0, 10);
    const timeStr = Date.now().toString(36);
    const extension = blob.type.includes('webm') ? 'webm' : 'm4a';
    const fileName = customFileName || `rec_${dateStr}_${timeStr}.${extension}`;
    const filePath = `${folder}/${user.id}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, { 
          contentType: blob.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      const result: UploadResult = {
        url: urlData.publicUrl,
        fileName,
        size: blob.size,
      };

      setLastUploadResult(result);
      setIsUploading(false);
      
      log.debug('Quiet upload successful', { filePath });
      return result;

    } catch (error) {
      log.error('Quiet upload failed', error, { filePath });
      setIsUploading(false);
      return null;
    }
  }, [user, bucket, folder]);

  return {
    uploadRecording,
    uploadRecordingQuietly,
    isUploading,
    uploadProgress,
    lastUploadResult,
  };
}
