/**
 * Audio utilities export
 */

export {
  getBufferPool,
  createBufferPool,
  type AudioBufferPool,
  type BufferPoolConfig,
  type PooledBuffer,
} from './bufferPool';

export {
  getAudioContextClass,
  createAudioContext,
  isAudioContextSupported,
  ensureAudioContextRunning,
  safeCloseAudioContext,
} from './audioContextHelper';

export {
  audioManager,
  AudioManager,
  type AudioManagerConfig,
  type AudioElementMetadata,
} from './AudioManager';
