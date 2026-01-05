/**
 * Tone.js Lazy Loader
 * 
 * Lazy loads Tone.js (~200KB) only when MIDI/Studio features are accessed.
 * This significantly reduces initial bundle size for users who don't use these features.
 * 
 * Usage:
 *   const Tone = await loadTone();
 *   const synth = new Tone.Synth();
 * 
 * @module toneLoader
 */

import { logger } from '@/lib/logger';

type ToneType = typeof import('tone');

let toneModule: ToneType | null = null;
let loadingPromise: Promise<ToneType> | null = null;

/**
 * Lazily loads Tone.js module
 * Uses a singleton pattern to ensure Tone.js is only loaded once
 * 
 * @returns Promise that resolves to the Tone.js module
 * @throws Error if Tone.js fails to load
 */
export async function loadTone(): Promise<ToneType> {
  // Return cached module if already loaded
  if (toneModule) {
    logger.debug('Tone.js already loaded, returning cached module');
    return toneModule;
  }

  // If already loading, return the existing promise
  if (loadingPromise) {
    logger.debug('Tone.js is loading, waiting for existing promise');
    return loadingPromise;
  }

  // Start loading Tone.js
  logger.info('Loading Tone.js module (lazy load)...');
  const startTime = performance.now();

  loadingPromise = import('tone')
    .then((module) => {
      const loadTime = performance.now() - startTime;
      logger.info(`Tone.js loaded successfully in ${loadTime.toFixed(2)}ms`);
      
      toneModule = module;
      loadingPromise = null;
      
      return module;
    })
    .catch((error) => {
      logger.error('Failed to load Tone.js:', error);
      loadingPromise = null;
      throw new Error('Failed to load Tone.js audio library');
    });

  return loadingPromise;
}

/**
 * Checks if Tone.js is already loaded
 * Useful for avoiding unnecessary loading attempts
 * 
 * @returns true if Tone.js is loaded, false otherwise
 */
export function isToneLoaded(): boolean {
  return toneModule !== null;
}

/**
 * Preloads Tone.js in the background
 * Useful for warming up the module when you know it will be needed soon
 * 
 * @returns Promise that resolves when Tone.js is loaded
 */
export function preloadTone(): Promise<ToneType> {
  return loadTone();
}

/**
 * Resets the Tone.js module cache
 * Primarily useful for testing purposes
 * 
 * @internal
 */
export function resetToneCache(): void {
  toneModule = null;
  loadingPromise = null;
  logger.debug('Tone.js cache reset');
}
