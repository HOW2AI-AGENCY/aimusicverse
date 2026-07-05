/**
 * Trim audio blob to [startS..endS] range and re-encode as WAV.
 * Uses OfflineAudioContext for pure-JS sample-accurate slicing.
 */

function encodeWav(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * numCh * 2 + 44;
  const out = new ArrayBuffer(length);
  const view = new DataView(out);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, length - 8, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numCh, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numCh * 2, true);
  view.setUint16(32, numCh * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, buffer.length * numCh * 2, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numCh; c++) channels.push(buffer.getChannelData(c));

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numCh; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([out], { type: "audio/wav" });
}

export async function trimAudioBlob(blob: Blob, startS: number, endS: number): Promise<Blob> {
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const arr = await blob.arrayBuffer();
    const decoded = await ctx.decodeAudioData(arr.slice(0));
    const sr = decoded.sampleRate;
    const startSample = Math.max(0, Math.floor(startS * sr));
    const endSample = Math.min(decoded.length, Math.floor(endS * sr));
    const frames = Math.max(1, endSample - startSample);
    const numCh = decoded.numberOfChannels;

    const trimmed = new AudioBuffer({ length: frames, numberOfChannels: numCh, sampleRate: sr });
    for (let c = 0; c < numCh; c++) {
      const src = decoded.getChannelData(c);
      const dst = trimmed.getChannelData(c);
      for (let i = 0; i < frames; i++) dst[i] = src[startSample + i];
    }
    return encodeWav(trimmed);
  } finally {
    void ctx.close().catch(() => {});
  }
}
