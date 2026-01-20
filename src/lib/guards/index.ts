/**
 * Type guard utilities for runtime type checking
 * 
 * These utilities provide type-safe runtime checks that help TypeScript
 * narrow types and prevent runtime errors from null/undefined values.
 * 
 * @module lib/guards
 * @see docs/DEVELOPER_GUIDE.md for usage patterns
 */

import type { Track, TrackWithCreator } from '@/types/track';

// ============================================================================
// Track Guards
// ============================================================================

/**
 * Check if track has a valid audio URL
 * 
 * @param track - Track to check
 * @returns True if track has valid audio URL (non-empty string)
 * 
 * @example
 * ```ts
 * const playableTracks = tracks.filter(hasAudioUrl);
 * ```
 */
export function hasAudioUrl(track: Track): track is Track & { audio_url: string } {
  return typeof track.audio_url === 'string' && track.audio_url.length > 0;
}

/**
 * Check if track has a valid cover URL
 * 
 * @param track - Track to check
 * @returns True if track has valid cover URL
 */
export function hasCoverUrl(track: Track): track is Track & { cover_url: string } {
  return typeof track.cover_url === 'string' && track.cover_url.length > 0;
}

/**
 * Check if track has creator information
 * 
 * @param track - Track to check
 * @returns True if track has creator username or name
 */
export function hasCreatorInfo(track: Track): track is TrackWithCreator {
  return (
    ('creator_username' in track && typeof track.creator_username === 'string') ||
    ('creator_name' in track && typeof track.creator_name === 'string')
  );
}

/**
 * Check if track is playable (completed status + has audio)
 * 
 * @param track - Track to check
 * @returns True if track can be played
 */
export function isPlayable(track: Track): boolean {
  return track.status === 'completed' && hasAudioUrl(track);
}

/**
 * Check if track is public and playable
 * 
 * @param track - Track to check
 * @returns True if track is public and can be played
 */
export function isPublicPlayable(track: Track): boolean {
  return track.is_public === true && isPlayable(track);
}

// ============================================================================
// General Utility Guards
// ============================================================================

/**
 * Check if value is non-null and non-undefined
 * 
 * Useful for filtering arrays to remove null/undefined values
 * while maintaining proper TypeScript types.
 * 
 * @param value - Value to check
 * @returns True if value is not null or undefined
 * 
 * @example
 * ```ts
 * const items: (string | null)[] = ['a', null, 'b'];
 * const strings: string[] = items.filter(isNotNull); // ['a', 'b']
 * ```
 */
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value != null;
}

/**
 * Check if value is a non-empty string
 * 
 * @param value - Value to check
 * @returns True if value is a string with length > 0
 * 
 * @example
 * ```ts
 * isNonEmptyString('hello'); // true
 * isNonEmptyString('');      // false
 * isNonEmptyString(null);    // false
 * ```
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Check if value is a valid UUID v4
 * 
 * @param value - Value to check
 * @returns True if value matches UUID v4 format
 */
export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Check if value is a non-empty array
 * 
 * @param value - Value to check
 * @returns True if value is an array with at least one element
 * 
 * @example
 * ```ts
 * isNonEmptyArray([1, 2]);  // true
 * isNonEmptyArray([]);      // false
 * isNonEmptyArray(null);    // false
 * ```
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Check if value is a valid positive number
 * 
 * @param value - Value to check
 * @returns True if value is a finite positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/**
 * Check if value is a valid non-negative number (>= 0)
 * 
 * @param value - Value to check
 * @returns True if value is a finite non-negative number
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

// ============================================================================
// Object Guards
// ============================================================================

/**
 * Check if object has a specific property
 * 
 * Type-safe version of 'in' operator that narrows types properly.
 * 
 * @param obj - Object to check
 * @param key - Property name to look for
 * @returns True if object has the property
 * 
 * @example
 * ```ts
 * const data: unknown = { name: 'test' };
 * if (hasProperty(data, 'name')) {
 *   console.log(data.name); // TypeScript knows 'name' exists
 * }
 * ```
 */
export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj;
}

/**
 * Check if object is a plain object (not null, array, or other types)
 * 
 * @param value - Value to check
 * @returns True if value is a plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

// ============================================================================
// Date Guards
// ============================================================================

/**
 * Check if value is a valid Date object
 * 
 * @param value - Value to check
 * @returns True if value is a valid Date
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Check if string is a valid ISO date string
 * 
 * @param value - Value to check
 * @returns True if value is a valid ISO date string
 */
export function isISODateString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}
