import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface TrimExportOptions {
  audioUrl: string;
  startTime: number;
  endTime: number;
  trackId: string;
  format?: 'wav' | 'mp3';
}

interface TrimResult {
  blob: Blob;
  url: string;
  duration: number;
}

export const useTrimExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const trimAudio = useCallback(async ({
    audioUrl,
    startTime,
    endTime,
    format = 'wav',
  }: TrimExportOptions): Promise<TrimResult | null> => {
    setIsExporting(true);
    setProgress(0);

    try {
      // Fetch audio data
      setProgress(10);
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      setProgress(30);
      
      // Decode audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      setProgress(50);
      
      // Calculate sample positions
      const sampleRate = audioBuffer.sampleRate;
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.floor(endTime * sampleRate);
      const trimmedLength = endSample - startSample;
      
      // Create new buffer for trimmed audio
      const trimmedBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        trimmedLength,
        sampleRate
      );
      
      // Copy trimmed data
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const sourceData = audioBuffer.getChannelData(channel);
        const trimmedData = trimmedBuffer.getChannelData(channel);
        for (let i = 0; i < trimmedLength; i++) {
          trimmedData[i] = sourceData[startSample + i];
        }
      }
      
      setProgress(70);
      
      // Render to blob using OfflineAudioContext
      const offlineContext = new OfflineAudioContext(
        trimmedBuffer.numberOfChannels,
        trimmedBuffer.length,
        trimmedBuffer.sampleRate
      );
      
      const source = offlineContext.createBufferSource();
      source.buffer = trimmedBuffer;
      source.connect(offlineContext.destination);
      source.start();
      
      const renderedBuffer = await offlineContext.startRendering();
      
      setProgress(90);
      
      // Convert to WAV blob
      const wavBlob = await audioBufferToWav(renderedBuffer);
      const blobUrl = URL.createObjectURL(wavBlob);
      
      setProgress(100);
      
      await audioContext.close();
      
      return {
        blob: wavBlob,
        url: blobUrl,
        duration: endTime - startTime,
      };
    } catch (error) {
      logger.error('Error trimming audio', error);
      toast.error('Ошибка при обрезке аудио');
      return null;
    } finally {
      setIsExporting(false);
    }
  }, []);

  const saveAsNewTrack = useCallback(async (
    trimResult: TrimResult,
    originalTrack: { title?: string | null; style?: string | null; tags?: string | null },
    userId: string
  ): Promise<string | null> => {
    try {
      // Upload to Supabase Storage
      const fileName = `${userId}/${Date.now()}_trimmed.wav`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(`audio/${fileName}`, trimResult.blob, {
          contentType: 'audio/wav',
        });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(`audio/${fileName}`);
      
      // Create new track
      const { data: newTrack, error: trackError } = await supabase
        .from('tracks')
        .insert({
          user_id: userId,
          title: `${originalTrack.title || 'Трек'} (обрезка)`,
          audio_url: publicUrl,
          duration_seconds: trimResult.duration,
          status: 'completed',
          style: originalTrack.style,
          tags: originalTrack.tags,
          prompt: 'Обрезка из существующего трека',
        })
        .select('id')
        .single();
      
      if (trackError) throw trackError;
      
      toast.success('Обрезанный трек сохранён');
      return newTrack.id;
    } catch (error) {
      logger.error('Error saving trimmed track', error);
      toast.error('Ошибка при сохранении трека');
      return null;
    }
  }, []);

  const downloadTrimmed = useCallback((trimResult: TrimResult, filename: string) => {
    const link = document.createElement('a');
    link.href = trimResult.url;
    link.download = `${filename}_trimmed.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return {
    trimAudio,
    saveAsNewTrack,
    downloadTrimmed,
    isExporting,
    progress,
  };
};

// Helper function to convert AudioBuffer to WAV
async function audioBufferToWav(buffer: AudioBuffer): Promise<Blob> {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  const samples = buffer.length;
  const dataSize = samples * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);
  
  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, 'WAVE');
  
  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  
  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Write samples
  const offset = 44;
  const channelData: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channelData.push(buffer.getChannelData(i));
  }
  
  for (let i = 0; i < samples; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset + (i * blockAlign) + (channel * bytesPerSample), intSample, true);
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
