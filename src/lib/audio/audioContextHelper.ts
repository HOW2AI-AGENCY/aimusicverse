/**
 * Audio Context Helper
 * 
 * Provides type-safe access to AudioContext with webkit fallback.
 * Eliminates need for (window as any).webkitAudioContext casts.
 */

// Extend Window interface to include webkit prefix
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

// Singleton AudioContext for studio use
let studioAudioContext: AudioContext | null = null;

/**
 * Get the AudioContext constructor with webkit fallback
 */
export function getAudioContextClass(): typeof AudioContext | undefined {
  return window.AudioContext || window.webkitAudioContext;
}

/**
 * Create a new AudioContext with webkit fallback
 * @throws Error if AudioContext is not supported
 */
export function createAudioContext(options?: AudioContextOptions): AudioContext {
  const AudioContextClass = getAudioContextClass();
  
  if (!AudioContextClass) {
    throw new Error('AudioContext is not supported in this browser');
  }
  
  return new AudioContextClass(options);
}

/**
 * Get or create singleton AudioContext for studio
 * This prevents multiple contexts being created/destroyed
 */
export function getOrCreateStudioContext(options?: AudioContextOptions): AudioContext {
  if (studioAudioContext && studioAudioContext.state !== 'closed') {
    return studioAudioContext;
  }
  
  studioAudioContext = createAudioContext(options);
  return studioAudioContext;
}

/**
 * Get current studio context if exists (without creating new one)
 */
export function getStudioContext(): AudioContext | null {
  if (studioAudioContext && studioAudioContext.state !== 'closed') {
    return studioAudioContext;
  }
  return null;
}

/**
 * Check if AudioContext is supported
 */
export function isAudioContextSupported(): boolean {
  return !!(window.AudioContext || window.webkitAudioContext);
}

/**
 * Ensure AudioContext is in running state
 * Resumes if suspended (required after user interaction on some browsers)
 */
export async function ensureAudioContextRunning(ctx: AudioContext): Promise<void> {
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

/**
 * Safely close an AudioContext
 */
export async function safeCloseAudioContext(ctx: AudioContext | null): Promise<void> {
  if (!ctx) return;
  
  try {
    if (ctx.state !== 'closed') {
      await ctx.close();
    }
  } catch (e) {
    // Ignore errors during cleanup
    console.warn('Error closing AudioContext:', e);
  }
}

/**
 * Close and reset studio singleton context
 */
export async function closeStudioContext(): Promise<void> {
  if (studioAudioContext) {
    await safeCloseAudioContext(studioAudioContext);
    studioAudioContext = null;
  }
}
