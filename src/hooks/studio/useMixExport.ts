import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

type LameModule = typeof import('lamejs');

export type ExportFormat = 'wav' | 'mp3';
export type ExportQuality = 'high' | 'medium' | 'low';
export type Mp3Bitrate = 128 | 192 | 320;

interface ExportTrack {
  url: string;
  volume: number;
  muted: boolean;
}

interface MasteringOptions {
  normalize: boolean;
  limiter: boolean;
  limiterThreshold: number; // in dB, e.g., -1
  dither: boolean;
}

interface ExportOptions {
  format: ExportFormat;
  quality: ExportQuality;
  tracks: ExportTrack[];
  masterVolume: number;
  mp3Bitrate?: Mp3Bitrate;
  mastering?: MasteringOptions;
}

interface ExportProgress {
  stage: 'loading' | 'mixing' | 'mastering' | 'encoding' | 'done';
  progress: number;
  message: string;
}

const DEFAULT_MASTERING: MasteringOptions = {
  normalize: true,
  limiter: true,
  limiterThreshold: -1,
  dither: false,
};

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

  /**
   * Apply mastering chain to audio buffer
   */
  const applyMastering = (audioBuffer: AudioBuffer, options: MasteringOptions): AudioBuffer => {
    const numChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    
    // Create a new buffer to hold processed audio
    const ctx = new OfflineAudioContext(numChannels, length, sampleRate);
    const outputBuffer = ctx.createBuffer(numChannels, length, sampleRate);
    
    // Copy channels (avoid type issues with Float32Array by creating new arrays)
    const channels: Float32Array[] = [];
    for (let ch = 0; ch < numChannels; ch++) {
      const original = audioBuffer.getChannelData(ch);
      const copy = new Float32Array(original.length);
      copy.set(original);
      channels.push(copy);
    }
    
    // Step 1: Normalize
    if (options.normalize) {
      let maxSample = 0;
      for (const channel of channels) {
        for (let i = 0; i < channel.length; i++) {
          const abs = Math.abs(channel[i]);
          if (abs > maxSample) maxSample = abs;
        }
      }
      
      if (maxSample > 0) {
        // Normalize to -1 dB (0.891)
        const targetPeak = Math.pow(10, -1 / 20); // -1 dB
        const gain = targetPeak / maxSample;
        
        for (const channel of channels) {
          for (let i = 0; i < channel.length; i++) {
            channel[i] *= gain;
          }
        }
      }
    }
    
    // Step 2: Limiter (soft knee)
    if (options.limiter) {
      const threshold = Math.pow(10, options.limiterThreshold / 20);
      const knee = 0.1; // soft knee width
      
      for (const channel of channels) {
        for (let i = 0; i < channel.length; i++) {
          const sample = channel[i];
          const absSample = Math.abs(sample);
          
          if (absSample > threshold) {
            // Soft limiting
            const excess = absSample - threshold;
            const compressed = threshold + (excess / (1 + excess / knee));
            channel[i] = sample > 0 ? compressed : -compressed;
          }
        }
      }
    }
    
    // Step 3: Dither (for 16-bit export)
    if (options.dither) {
      const ditherAmp = 1.0 / 32768.0; // 16-bit dither amplitude
      
      for (const channel of channels) {
        for (let i = 0; i < channel.length; i++) {
          // Triangular dither
          const r1 = Math.random() - 0.5;
          const r2 = Math.random() - 0.5;
          channel[i] += (r1 + r2) * ditherAmp;
        }
      }
    }
    
    // Copy to output buffer - use explicit loop to avoid type issues
    for (let ch = 0; ch < numChannels; ch++) {
      const outputData = outputBuffer.getChannelData(ch);
      const sourceData = channels[ch];
      for (let i = 0; i < sourceData.length; i++) {
        outputData[i] = sourceData[i];
      }
    }
    
    return outputBuffer;
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

  /**
   * Encode AudioBuffer to MP3 using lamejs (lazy-loaded)
   */
  const encodeMp3 = async (audioBuffer: AudioBuffer, bitrate: Mp3Bitrate): Promise<Blob> => {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const samples = audioBuffer.length;

    const lame = (await import('lamejs')) as unknown as LameModule;
    const Mp3Encoder = (lame as any).Mp3Encoder;

    // Get channel data
    const leftChannelData = audioBuffer.getChannelData(0);
    const rightChannelData = numChannels > 1 ? audioBuffer.getChannelData(1) : leftChannelData;

    // Convert Float32 to Int16
    const leftInt16 = new Int16Array(samples);
    const rightInt16 = new Int16Array(samples);

    for (let i = 0; i < samples; i++) {
      leftInt16[i] = Math.max(-32768, Math.min(32767, Math.floor(leftChannelData[i] * 32767)));
      rightInt16[i] = Math.max(-32768, Math.min(32767, Math.floor(rightChannelData[i] * 32767)));
    }

    // Create MP3 encoder
    const mp3Encoder = new Mp3Encoder(numChannels, sampleRate, bitrate);
    const mp3Data: Int8Array[] = [];

    // Encode in chunks
    const chunkSize = 1152; // MP3 frame size

    for (let i = 0; i < samples; i += chunkSize) {
      const leftChunk = leftInt16.subarray(i, i + chunkSize);
      const rightChunk = rightInt16.subarray(i, i + chunkSize);

      const mp3buf = numChannels === 1
        ? mp3Encoder.encodeBuffer(leftChunk)
        : mp3Encoder.encodeBuffer(leftChunk, rightChunk);

      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }

    // Flush encoder
    const mp3End = mp3Encoder.flush();
    if (mp3End.length > 0) {
      mp3Data.push(mp3End);
    }

    // Combine chunks
    const totalLength = mp3Data.reduce((acc, buf) => acc + buf.length, 0);
    const mp3Buffer = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of mp3Data) {
      mp3Buffer.set(chunk, offset);
      offset += chunk.length;
    }

    return new Blob([mp3Buffer], { type: 'audio/mp3' });
  };

  const exportMix = useCallback(async (options: ExportOptions): Promise<Blob | null> => {
    const { 
      format, 
      quality, 
      tracks, 
      masterVolume, 
      mp3Bitrate = 320,
      mastering = DEFAULT_MASTERING 
    } = options;
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
      let renderedBuffer = await offlineContext.startRendering();

      // Stage 3: Mastering
      if (mastering.normalize || mastering.limiter || mastering.dither) {
        setExportProgress({ stage: 'mastering', progress: 0, message: 'Мастеринг...' });
        renderedBuffer = applyMastering(renderedBuffer, mastering);
        setExportProgress({ stage: 'mastering', progress: 100, message: 'Мастеринг завершён' });
      }

      // Stage 4: Encoding
      setExportProgress({ stage: 'encoding', progress: 0, message: 'Кодирование...' });

      let blob: Blob;

      if (format === 'wav') {
        blob = encodeWav(renderedBuffer);
      } else {
        setExportProgress({ stage: 'encoding', progress: 50, message: `Кодирование MP3 (${mp3Bitrate} kbps)...` });
        blob = await encodeMp3(renderedBuffer, mp3Bitrate);
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
