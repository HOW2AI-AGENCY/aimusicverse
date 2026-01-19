/**
 * Mix Export Hook
 * 
 * Exports the mixed stems with effects to a single audio file
 * Uses OfflineAudioContext for rendering
 * Supports WAV and MP3 formats
 */

import { useState, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';
import type { StemEffects } from './studio/types';
import { defaultStemEffects } from './studio/stemEffectsConfig';

type LameModule = typeof import('lamejs');

interface StemMixData {
  id: string;
  audioUrl: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  effects: StemEffects;
}

interface ExportOptions {
  format: 'wav' | 'mp3';
  sampleRate?: number;
  bitRate?: number; // For MP3
}

// Generate impulse response for reverb
function createImpulseResponse(
  audioContext: BaseAudioContext,
  duration: number,
  decay: number
): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const impulse = audioContext.createBuffer(2, length, sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  
  return impulse;
}

// Convert AudioBuffer to WAV blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;
  
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, bufferLength - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);
  
  // Interleave audio data
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

// Convert AudioBuffer to MP3 using lamejs (lazy-loaded)
async function audioBufferToMp3(buffer: AudioBuffer, bitRate: number = 192): Promise<Blob> {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;

  const lame = (await import('lamejs')) as unknown as LameModule;
  const Mp3Encoder = (lame as any).Mp3Encoder;

  const mp3encoder = new Mp3Encoder(numChannels, sampleRate, bitRate);
  const mp3Data: number[][] = [];

  const left = buffer.getChannelData(0);
  const right = numChannels > 1 ? buffer.getChannelData(1) : left;

  // Convert Float32Array to Int16Array
  const leftInt16 = new Int16Array(left.length);
  const rightInt16 = new Int16Array(right.length);

  for (let i = 0; i < left.length; i++) {
    leftInt16[i] = Math.max(-32768, Math.min(32767, Math.round(left[i] * 32767)));
    rightInt16[i] = Math.max(-32768, Math.min(32767, Math.round(right[i] * 32767)));
  }

  // Encode in chunks
  const blockSize = 1152;
  for (let i = 0; i < leftInt16.length; i += blockSize) {
    const leftChunk = leftInt16.subarray(i, i + blockSize);
    const rightChunk = rightInt16.subarray(i, i + blockSize);
    const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(Array.from(mp3buf));
    }
  }

  // Flush remaining data
  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(Array.from(mp3buf));
  }

  // Combine all chunks into single array
  const combined = mp3Data.flat();
  const uint8Array = new Uint8Array(combined);

  return new Blob([uint8Array.buffer], { type: 'audio/mp3' });
}

export function useMixExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const exportMix = useCallback(async (
    stems: StemMixData[],
    masterVolume: number,
    trackTitle: string,
    options: ExportOptions = { format: 'wav' }
  ): Promise<Blob | null> => {
    setIsExporting(true);
    setProgress(0);
    setProgressMessage('Подготовка к экспорту...');
    
    abortControllerRef.current = new AbortController();
    
    try {
      // Filter active stems (not muted, or solo if any solo exists)
      const hasSolo = stems.some(s => s.solo);
      const activeStems = stems.filter(s => {
        if (hasSolo) return s.solo;
        return !s.muted;
      });

      if (activeStems.length === 0) {
        throw new Error('Нет активных стемов для экспорта');
      }

      // Load all audio buffers
      setProgressMessage('Загрузка аудио файлов...');
      const audioContext = new AudioContext();
      const audioBuffers: { stem: StemMixData; buffer: AudioBuffer }[] = [];
      
      for (let i = 0; i < activeStems.length; i++) {
        const stem = activeStems[i];
        setProgress((i / activeStems.length) * 30);
        setProgressMessage(`Загрузка ${i + 1}/${activeStems.length}...`);
        
        const response = await fetch(stem.audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBuffers.push({ stem, buffer: audioBuffer });
      }

      // Find the longest duration
      const maxDuration = Math.max(...audioBuffers.map(ab => ab.buffer.duration));
      const sampleRate = options.sampleRate || 44100;
      const length = Math.ceil(maxDuration * sampleRate);

      setProgressMessage('Рендеринг микса...');
      setProgress(40);

      // Create offline context for rendering
      const offlineContext = new OfflineAudioContext(2, length, sampleRate);

      // Create master gain
      const masterGain = offlineContext.createGain();
      masterGain.gain.value = masterVolume;
      masterGain.connect(offlineContext.destination);

      // Process each stem with effects
      for (let i = 0; i < audioBuffers.length; i++) {
        const { stem, buffer } = audioBuffers[i];
        setProgress(40 + (i / audioBuffers.length) * 40);
        setProgressMessage(`Обработка стема ${i + 1}/${audioBuffers.length}...`);

        // Create source
        const source = offlineContext.createBufferSource();
        source.buffer = buffer;

        // Create effect chain
        const effects = stem.effects || defaultStemEffects;
        
        // Gain node
        const gainNode = offlineContext.createGain();
        gainNode.gain.value = stem.volume;

        // EQ
        const lowEQ = offlineContext.createBiquadFilter();
        lowEQ.type = 'lowshelf';
        lowEQ.frequency.value = effects.eq.lowFreq;
        lowEQ.gain.value = effects.eq.lowGain;

        const midEQ = offlineContext.createBiquadFilter();
        midEQ.type = 'peaking';
        midEQ.frequency.value = 1000;
        midEQ.Q.value = 1;
        midEQ.gain.value = effects.eq.midGain;

        const highEQ = offlineContext.createBiquadFilter();
        highEQ.type = 'highshelf';
        highEQ.frequency.value = effects.eq.highFreq;
        highEQ.gain.value = effects.eq.highGain;

        // Compressor
        const compressor = offlineContext.createDynamicsCompressor();
        if (effects.compressor.enabled) {
          compressor.threshold.value = effects.compressor.threshold;
          compressor.ratio.value = effects.compressor.ratio;
          compressor.attack.value = effects.compressor.attack;
          compressor.release.value = effects.compressor.release;
          compressor.knee.value = effects.compressor.knee;
        }

        // Reverb
        const dryGain = offlineContext.createGain();
        const wetGain = offlineContext.createGain();
        
        if (effects.reverb.enabled) {
          const convolver = offlineContext.createConvolver();
          convolver.buffer = createImpulseResponse(offlineContext, 3, effects.reverb.decay);
          
          dryGain.gain.value = 1 - effects.reverb.wetDry;
          wetGain.gain.value = effects.reverb.wetDry;

          // Connect chain
          source.connect(gainNode);
          gainNode.connect(lowEQ);
          lowEQ.connect(midEQ);
          midEQ.connect(highEQ);
          highEQ.connect(compressor);
          compressor.connect(dryGain);
          compressor.connect(convolver);
          convolver.connect(wetGain);
          dryGain.connect(masterGain);
          wetGain.connect(masterGain);
        } else {
          dryGain.gain.value = 1;
          wetGain.gain.value = 0;

          // Connect chain without reverb
          source.connect(gainNode);
          gainNode.connect(lowEQ);
          lowEQ.connect(midEQ);
          midEQ.connect(highEQ);
          highEQ.connect(compressor);
          compressor.connect(masterGain);
        }

        source.start(0);
      }

      setProgressMessage('Финализация...');
      setProgress(85);

      // Render
      const renderedBuffer = await offlineContext.startRendering();
      
      setProgressMessage('Создание файла...');
      setProgress(95);

      // Convert to desired format
      let outputBlob: Blob;
      if (options.format === 'mp3') {
        setProgressMessage('Кодирование в MP3...');
        outputBlob = await audioBufferToMp3(renderedBuffer, options.bitRate || 192);
      } else {
        outputBlob = audioBufferToWav(renderedBuffer);
      }

      // Clean up
      await audioContext.close();

      setProgress(100);
      setProgressMessage('Готово!');
      
      return outputBlob;
    } catch (error) {
      logger.error('Mix export error', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, []);

  const downloadMix = useCallback(async (
    stems: StemMixData[],
    masterVolume: number,
    trackTitle: string,
    options: ExportOptions = { format: 'wav' }
  ) => {
    try {
      const blob = await exportMix(stems, masterVolume, trackTitle, options);
      if (!blob) return;

      const sanitizedTitle = trackTitle.replace(/[^a-zA-Zа-яА-Я0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');
      const filename = `${sanitizedTitle}_mix.${options.format}`;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      throw error;
    }
  }, [exportMix]);

  const cancelExport = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsExporting(false);
    setProgress(0);
    setProgressMessage('');
  }, []);

  return {
    isExporting,
    progress,
    progressMessage,
    exportMix,
    downloadMix,
    cancelExport,
  };
}
