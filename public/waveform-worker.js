/**
 * Waveform Worker
 * 
 * Web Worker for generating waveform peaks from audio data.
 * Offloads CPU-intensive work from the main thread.
 */

/**
 * Generate peaks from audio data
 * @param {Float32Array} audioData
 * @param {number} targetPeaks
 * @returns {number[]}
 */
function generatePeaks(audioData, targetPeaks) {
  const samplesPerPeak = Math.ceil(audioData.length / targetPeaks);
  const peaks = [];
  
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

/**
 * Normalize peaks to 0-1 range
 * @param {number[]} peaks
 * @returns {number[]}
 */
function normalizePeaks(peaks) {
  const max = Math.max(...peaks);
  if (max === 0) return peaks;
  return peaks.map(p => p / max);
}

// Handle incoming messages
self.onmessage = function(event) {
  const { type, id, audioData, targetPeaks } = event.data;
  
  try {
    if (type === 'generate-peaks') {
      // Generate and normalize peaks
      const rawPeaks = generatePeaks(audioData, targetPeaks);
      const normalizedPeaks = normalizePeaks(rawPeaks);
      
      self.postMessage({
        type: 'peaks-result',
        id: id,
        peaks: normalizedPeaks,
      });
    } else {
      throw new Error('Unknown message type: ' + type);
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      id: id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
