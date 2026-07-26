/**
 * Trim audio blob to [startS..endS] range and re-encode as WAV or MP3.
 * Uses AudioContext decoding for sample-accurate slicing.
 *
 * MP3 is preferred for uploads to Suno — its voice endpoints reject/choke on
 * raw PCM WAV produced by the browser recorder.
 */

type LameModule = typeof import("lamejs");

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

/** Encode AudioBuffer to MP3 using lazily loaded lamejs. */
async function encodeMp3(buffer: AudioBuffer, bitrate = 128): Promise<Blob> {
  const lame = (await import("lamejs")) as unknown as LameModule;
  const numCh = Math.min(2, buffer.numberOfChannels);
  const encoder = new lame.Mp3Encoder(numCh, buffer.sampleRate, bitrate);

  const toInt16 = (input: Float32Array) => {
    const out = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  };

  const left = toInt16(buffer.getChannelData(0));
  const right = numCh === 2 ? toInt16(buffer.getChannelData(1)) : null;

  const chunks: Uint8Array[] = [];
  const blockSize = 1152;
  for (let i = 0; i < left.length; i += blockSize) {
    const l = left.subarray(i, i + blockSize);
    const buf = right
      ? encoder.encodeBuffer(l, right.subarray(i, i + blockSize))
      : encoder.encodeBuffer(l);
    if (buf.length > 0) chunks.push(new Uint8Array(buf));
  }
  const tail = encoder.flush();
  if (tail.length > 0) chunks.push(new Uint8Array(tail));

  return new Blob(chunks as BlobPart[], { type: "audio/mpeg" });
}

async function decodeAndTrim(blob: Blob, startS: number, endS: number): Promise<AudioBuffer> {
  const AudioCtx =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
    return trimmed;
  } finally {
    void ctx.close().catch(() => {});
  }
}

export async function trimAudioBlob(blob: Blob, startS: number, endS: number): Promise<Blob> {
  return encodeWav(await decodeAndTrim(blob, startS, endS));
}

/** Trim and encode as MP3; falls back to WAV if the MP3 encoder is unavailable. */
export async function trimAudioToMp3(blob: Blob, startS: number, endS: number): Promise<Blob> {
  const trimmed = await decodeAndTrim(blob, startS, endS);
  try {
    return await encodeMp3(trimmed);
  } catch {
    return encodeWav(trimmed);
  }
}
