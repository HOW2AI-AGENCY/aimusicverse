/**
 * Constants for music generation and form handling
 */

// Character limits
export const SIMPLE_DESCRIPTION_MAX_LENGTH = 500;
export const LYRICS_MAX_LENGTH = 3000;
export const LYRICS_MIN_LENGTH = 100;
export const TITLE_MAX_LENGTH = 80;
export const BOOST_STYLE_MAX_LENGTH = 450;

// Timing constants (milliseconds)
export const DRAFT_AUTO_SAVE_DELAY = 1000;
export const LYRICS_VALIDATION_DEBOUNCE = 500;
export const FILE_READER_TIMEOUT = 30000; // 30 seconds

// Audio parameters
export const DEFAULT_STYLE_WEIGHT = 0.65;
export const DEFAULT_WEIRDNESS = 0.5;
export const DEFAULT_AUDIO_WEIGHT = 0.65;

// Audio context
export const AUDIO_SYNC_DRIFT_THRESHOLD = 0.1; // seconds

// Mobile limits
export const MAX_MOBILE_AUDIO_ELEMENTS = 8;
