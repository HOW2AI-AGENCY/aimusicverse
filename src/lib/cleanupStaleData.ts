/**
 * Stale Data Cleanup Utility
 * 
 * Cleans up old/stale data from localStorage, sessionStorage, and IndexedDB
 * to prevent startup issues and invalid audio URL notifications.
 */

import { logger } from './logger';

const log = logger.child({ module: 'StaleDataCleanup' });

// Legacy keys that should be cleaned on app startup
// Note: Audio references now use unified ReferenceManager (active_audio_reference key)
const SESSION_STORAGE_KEYS_TO_CLEAN = [
  // Legacy audio reference keys (migrated to ReferenceManager)
  'cloudAudioReference',
  'audioReferenceFromDrums',
  'audioReferenceFromDJ',
  'drumPatternForDJ',
  // Generation params
  'generationParams', 
  'presetParams',
  'templateLyrics',
  'templateName',
  'fromQuickCreate',
];

const LOCAL_STORAGE_KEYS_TO_VALIDATE = [
  'stem_audio_reference', // Legacy - migrated to ReferenceManager
  'musicverse-playback-positions',
];

// Reference expiry (24 hours)
const REFERENCE_EXPIRY_MS = 24 * 60 * 60 * 1000;
// Position expiry (7 days)
const POSITION_EXPIRY_DAYS = 7;

/**
 * Clean stale sessionStorage items
 */
function cleanSessionStorage(): void {
  SESSION_STORAGE_KEYS_TO_CLEAN.forEach(key => {
    try {
      const value = sessionStorage.getItem(key);
      if (value) {
        sessionStorage.removeItem(key);
        log.debug(`Cleaned stale sessionStorage: ${key}`);
      }
    } catch (error) {
      log.error(`Error cleaning sessionStorage key: ${key}`, error);
    }
  });
}

/**
 * Validate and clean stem audio reference
 */
function cleanStemAudioReference(): void {
  try {
    const stemRef = localStorage.getItem('stem_audio_reference');
    if (!stemRef) return;

    const parsed = JSON.parse(stemRef);
    if (!parsed.timestamp || Date.now() - parsed.timestamp > REFERENCE_EXPIRY_MS) {
      localStorage.removeItem('stem_audio_reference');
      log.info('Removed expired stem audio reference');
    }
  } catch (error) {
    localStorage.removeItem('stem_audio_reference');
    log.error('Removed invalid stem audio reference', error);
  }
}

/**
 * Validate and clean playback positions
 */
function cleanPlaybackPositions(): void {
  const key = 'musicverse-playback-positions';
  try {
    const positions = localStorage.getItem(key);
    if (!positions) return;

    const parsed = JSON.parse(positions);
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(key);
      log.info('Removed invalid playback positions');
      return;
    }

    const now = Date.now();
    const maxAge = POSITION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    const validPositions = parsed.filter((pos: any) => {
      return pos?.timestamp && now - pos.timestamp < maxAge;
    });

    if (validPositions.length !== parsed.length) {
      localStorage.setItem(key, JSON.stringify(validPositions));
      log.info(`Cleaned ${parsed.length - validPositions.length} expired playback positions`);
    }
  } catch (error) {
    localStorage.removeItem(key);
    log.error('Removed corrupted playback positions', error);
  }
}

/**
 * Clean stale lyrics wizard state
 */
function cleanLyricsWizardState(): void {
  const key = 'lyrics-wizard-storage';
  try {
    const state = localStorage.getItem(key);
    if (!state) return;

    const parsed = JSON.parse(state);
    // Reset step to 0 on app restart to prevent stuck state
    if (parsed.state?.step > 0) {
      parsed.state.step = 0;
      localStorage.setItem(key, JSON.stringify(parsed));
      log.debug('Reset lyrics wizard step');
    }
  } catch (error) {
    log.error('Error cleaning lyrics wizard state', error);
  }
}

/**
 * Clean IndexedDB audio cache if corrupted
 */
async function cleanAudioCache(): Promise<void> {
  try {
    const DB_NAME = 'musicverse_audio_cache';
    const request = indexedDB.open(DB_NAME);
    
    request.onsuccess = () => {
      const db = request.result;
      // Just verify the database opens correctly
      db.close();
      log.debug('Audio cache verified');
    };

    request.onerror = () => {
      // If database is corrupted, delete it
      indexedDB.deleteDatabase(DB_NAME);
      log.warn('Deleted corrupted audio cache database');
    };
  } catch (error) {
    log.error('Error checking audio cache', error);
  }
}

/**
 * Run all cleanup tasks on app startup
 */
export async function cleanupStaleData(): Promise<void> {
  log.info('Starting stale data cleanup...');
  
  try {
    // Clean session storage first (synchronous)
    cleanSessionStorage();
    
    // Clean and validate localStorage
    cleanStemAudioReference();
    cleanPlaybackPositions();
    cleanLyricsWizardState();
    
    // Clean IndexedDB (async)
    await cleanAudioCache();
    
    log.info('Stale data cleanup completed');
  } catch (error) {
    log.error('Error during stale data cleanup', error);
  }
}

/**
 * Clear all app storage (for debugging/reset)
 */
export function clearAllAppStorage(): void {
  // Clear sessionStorage
  SESSION_STORAGE_KEYS_TO_CLEAN.forEach(key => {
    sessionStorage.removeItem(key);
  });
  
  // Clear localStorage app keys
  const appKeys = [
    'stem_audio_reference',
    'musicverse-playback-positions',
    'lyrics-wizard-storage',
    'player-settings',
    'generate-form-draft',
  ];
  appKeys.forEach(key => localStorage.removeItem(key));
  
  // Clear IndexedDB
  indexedDB.deleteDatabase('musicverse_audio_cache');
  
  log.info('All app storage cleared');
}
