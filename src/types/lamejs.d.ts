/**
 * Type declarations for lamejs
 * 
 * lamejs is a JavaScript MP3 encoder library that doesn't ship with types.
 * This provides basic type definitions for the parts we use.
 */

declare module 'lamejs' {
  export class Mp3Encoder {
    constructor(channels: number, sampleRate: number, kbps: number);
    
    /**
     * Encode PCM samples to MP3
     * @param left - Left channel samples (Int16Array)
     * @param right - Right channel samples (Int16Array, optional for mono)
     * @returns Encoded MP3 data as Int8Array
     */
    encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
    
    /**
     * Finish encoding and get remaining MP3 data
     * @returns Final MP3 data as Int8Array
     */
    flush(): Int8Array;
  }

  export class WavHeader {
    static readHeader(dataView: DataView): WavHeaderData;
  }

  export interface WavHeaderData {
    channels: number;
    sampleRate: number;
    dataOffset: number;
    dataLen: number;
  }

  const lamejs: {
    Mp3Encoder: typeof Mp3Encoder;
    WavHeader: typeof WavHeader;
  };

  export default lamejs;
}
