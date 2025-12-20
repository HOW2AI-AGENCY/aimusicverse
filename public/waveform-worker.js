/**
 * Waveform Worker
 * 
 * Web Worker for generating waveform peaks from audio data.
 * Offloads CPU-intensive work from the main thread.
 */

// Message types
interface GeneratePeaksMessage {
  type: 'generate-peaks';
  id: string;
  audioData: Float32Array;
  sampleRate: number;
  targetPeaks: number;
}

interface PeaksResultMessage {
  type: 'peaks-result';
  id: string;
  peaks: number[];
}

interface ErrorMessage {
  type: 'error';
  id: string;
  error: string;
}

type WorkerMessage = GeneratePeaksMessage;
type WorkerResponse = PeaksResultMessage | ErrorMessage;

// Generate peaks from audio data
function generatePeaks(
  audioData: Float32Array,
  targetPeaks: number
): number[] {
  const samplesPerPeak = Math.ceil(audioData.length / targetPeaks);
  const peaks: number[] = [];
  
  for (let i = 0; i < targetPeaks; i++) {
    const start = i * samplesPerPeak;
    const end = Math.min(start + samplesPerPeak, audioData.length);
    
    let max = 0;
    for (let j = start; j < end; j++) {
      const abs = Math.abs(audioData[j]);
      if (abs > max) max = abs;
    }
    
    peaks.push(max);
  }
  
  return peaks;
}

// Normalize peaks to 0-1 range
function normalizePeaks(peaks: number[]): number[] {
  const max = Math.max(...peaks);
  if (max === 0) return peaks;
  return peaks.map(p => p / max);
}

// Handle incoming messages
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, id } = event.data;
  
  try {
    switch (type) {
      case 'generate-peaks': {
        const { audioData, targetPeaks } = event.data as GeneratePeaksMessage;
        
        // Generate and normalize peaks
        const rawPeaks = generatePeaks(audioData, targetPeaks);
        const normalizedPeaks = normalizePeaks(rawPeaks);
        
        const response: PeaksResultMessage = {
          type: 'peaks-result',
          id,
          peaks: normalizedPeaks,
        };
        
        self.postMessage(response);
        break;
      }
      
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    const response: ErrorMessage = {
      type: 'error',
      id,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};

// Export for type checking (not used at runtime)
export type { WorkerMessage, WorkerResponse };
