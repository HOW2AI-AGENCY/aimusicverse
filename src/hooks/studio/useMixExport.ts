import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export type ExportFormat = 'wav' | 'mp3';
export type ExportQuality = 'high' | 'medium' | 'low';

interface ExportTrack {
  url: string;
  volume: number;
  muted: boolean;
}

interface ExportOptions {
  format: ExportFormat;
  quality: ExportQuality;
  tracks: ExportTrack[];
  masterVolume: number;
}

interface ExportProgress {
  stage: 'loading' | 'mixing' | 'encoding' | 'done';
  progress: number;
  message: string;
}

export function useMixExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getSampleRate = (quality: ExportQuality): number => {
    switch (quality) {
      case 'high': return 48000;
      case 'medium': return 44100;
      case 'low': return 22050;
    }
  };

  const loadAudioBuffer = async (
    url: string,
    context: OfflineAudioContext,
    signal: AbortSignal
  ): Promise<AudioBuffer> => {
    const response = await fetch(url, { signal });
    const arrayBuffer = await response.arrayBuffer();
    return await context.decodeAudioData(arrayBuffer);
  };

  const encodeWav = (audioBuffer: AudioBuffer): Blob => {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = audioBuffer.length * blockAlign;
    const bufferSize = 44 + dataSize;

    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);

    // Write WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
    const channels: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  const exportMix = useCallback(async (options: ExportOptions): Promise<Blob | null> => {
    const { format, quality, tracks, masterVolume } = options;
    const activeTracks = tracks.filter(t => !t.muted && t.url);

    if (activeTracks.length === 0) {
      toast.error('Нет активных дорожек для экспорта');
      return null;
    }

    setIsExporting(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // Stage 1: Loading
      setExportProgress({ stage: 'loading', progress: 0, message: 'Загрузка аудио...' });

      const sampleRate = getSampleRate(quality);
      
      // First, load all tracks to determine max duration
      const tempContext = new AudioContext({ sampleRate });
      const buffers: { buffer: AudioBuffer; volume: number }[] = [];
      
      for (let i = 0; i < activeTracks.length; i++) {
        if (signal.aborted) throw new Error('Cancelled');
        
        const track = activeTracks[i];
        setExportProgress({
          stage: 'loading',
          progress: ((i + 1) / activeTracks.length) * 100,
          message: `Загрузка дорожки ${i + 1}/${activeTracks.length}...`
        });

        const response = await fetch(track.url, { signal });
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await tempContext.decodeAudioData(arrayBuffer);
        buffers.push({ buffer, volume: track.volume });
      }

      await tempContext.close();

      // Stage 2: Mixing
      setExportProgress({ stage: 'mixing', progress: 0, message: 'Микширование...' });

      const maxDuration = Math.max(...buffers.map(b => b.buffer.duration));
      const offlineContext = new OfflineAudioContext(2, Math.ceil(maxDuration * sampleRate), sampleRate);

      // Create master gain
      const masterGain = offlineContext.createGain();
      masterGain.gain.value = masterVolume;
      masterGain.connect(offlineContext.destination);

      // Connect all tracks
      for (const { buffer, volume } of buffers) {
        const source = offlineContext.createBufferSource();
        source.buffer = buffer;
        
        const gainNode = offlineContext.createGain();
        gainNode.gain.value = volume;
        
        source.connect(gainNode);
        gainNode.connect(masterGain);
        source.start(0);
      }

      setExportProgress({ stage: 'mixing', progress: 50, message: 'Рендеринг микса...' });
      const renderedBuffer = await offlineContext.startRendering();

      // Stage 3: Encoding
      setExportProgress({ stage: 'encoding', progress: 0, message: 'Кодирование...' });

      let blob: Blob;
      
      if (format === 'wav') {
        blob = encodeWav(renderedBuffer);
      } else {
        // For MP3, we'll export as WAV for now (browser doesn't have native MP3 encoding)
        // In production, you'd use a library like lamejs or server-side encoding
        blob = encodeWav(renderedBuffer);
        toast.info('MP3 экспорт временно недоступен, сохранено как WAV');
      }

      setExportProgress({ stage: 'done', progress: 100, message: 'Готово!' });
      
      return blob;
    } catch (error) {
      if ((error as Error).message === 'Cancelled') {
        toast.info('Экспорт отменён');
      } else {
        console.error('Export error:', error);
        toast.error('Ошибка при экспорте');
      }
      return null;
    } finally {
      setIsExporting(false);
      setExportProgress(null);
      abortControllerRef.current = null;
    }
  }, []);

  const cancelExport = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return {
    isExporting,
    exportProgress,
    exportMix,
    cancelExport,
    downloadBlob
  };
}
