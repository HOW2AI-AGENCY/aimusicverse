/**
 * Web Worker for waveform generation
 * Offloads heavy audio processing from main thread
 */

interface WaveformMessage {
  type: 'generate';
  audioUrl: string;
  samples: number;
  id: string;
}

interface WaveformResult {
  type: 'result';
  id: string;
  peaks: number[];
  audioUrl: string;
}

interface WaveformError {
  type: 'error';
  id: string;
  error: string;
  audioUrl: string;
}

// Generate peaks from ArrayBuffer
function generatePeaksFromArrayBuffer(arrayBuffer: ArrayBuffer, samples: number): Promise<number[]> {
  return new Promise((resolve, reject) => {
    // Use OfflineAudioContext for decoding (available in workers)
    const audioContext = new OfflineAudioContext(1, 1, 44100);
    
    audioContext.decodeAudioData(arrayBuffer)
      .then((audioBuffer) => {
        const channelData = audioBuffer.getChannelData(0);
        const blockSize = Math.floor(channelData.length / samples);
        const peaks: number[] = [];
        
        for (let i = 0; i < samples; i++) {
          const start = i * blockSize;
          const end = Math.min(start + blockSize, channelData.length);
          
          let max = 0;
          for (let j = start; j < end; j++) {
            const abs = Math.abs(channelData[j]);
            if (abs > max) max = abs;
          }
          peaks.push(max);
        }
        
        // Normalize
        const maxPeak = Math.max(...peaks, 0.01);
        const normalized = peaks.map(p => p / maxPeak);
        
        resolve(normalized);
      })
      .catch(reject);
  });
}

// Handle messages
self.onmessage = async (event: MessageEvent<WaveformMessage>) => {
  const { type, audioUrl, samples, id } = event.data;
  
  if (type === 'generate') {
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const peaks = await generatePeaksFromArrayBuffer(arrayBuffer, samples);
      
      const result: WaveformResult = {
        type: 'result',
        id,
        peaks,
        audioUrl,
      };
      
      self.postMessage(result);
    } catch (error) {
      const errorResult: WaveformError = {
        type: 'error',
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
        audioUrl,
      };
      
      self.postMessage(errorResult);
    }
  }
};

export {}; // Make it a module
