/**
 * Branded Types for Type Safety
 * 
 * Provides nominal typing for IDs and other primitives
 * to prevent accidental mixing of different ID types.
 * 
 * @module types/branded
 * @example
 * ```typescript
 * import { createTrackId, TrackId } from '@/types/branded';
 * 
 * function playTrack(trackId: TrackId) {
 *   // Type-safe: only TrackId can be passed
 * }
 * 
 * const trackId = createTrackId('550e8400-e29b-41d4-a716-446655440000');
 * playTrack(trackId); // OK
 * playTrack('some-string'); // TypeScript error!
 * ```
 */

// Brand symbol for type discrimination
declare const brand: unique symbol;

/**
 * Branded type utility
 * @typeParam T - Base type to brand
 * @typeParam B - Brand identifier (string literal)
 */
type Brand<T, B> = T & { [brand]: B };

// ============= ID Types =============

/** Branded type for Track IDs (UUID format) */
export type TrackId = Brand<string, 'TrackId'>;

/** Branded type for User IDs (UUID format) */
export type UserId = Brand<string, 'UserId'>;

/** Branded type for Stem IDs (UUID format) */
export type StemId = Brand<string, 'StemId'>;

/** Branded type for Project IDs (UUID format) */
export type ProjectId = Brand<string, 'ProjectId'>;

/** Branded type for Artist IDs (UUID format) */
export type ArtistId = Brand<string, 'ArtistId'>;

/** Branded type for Playlist IDs (UUID format) */
export type PlaylistId = Brand<string, 'PlaylistId'>;

// ============= Type Guards =============

/**
 * Check if a value is a valid UUID
 * @param value - Value to validate
 * @returns True if value is a valid UUID v1-5
 */
export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// ============= Factory Functions =============

/**
 * Create a validated TrackId
 * @param id - UUID string
 * @throws Error if id is not a valid UUID
 */
export function createTrackId(id: string): TrackId {
  if (!isValidUUID(id)) {
    throw new Error(`Invalid TrackId: ${id}`);
  }
  return id as TrackId;
}

/**
 * Create a validated UserId
 * @param id - UUID string
 * @throws Error if id is not a valid UUID
 */
export function createUserId(id: string): UserId {
  if (!isValidUUID(id)) {
    throw new Error(`Invalid UserId: ${id}`);
  }
  return id as UserId;
}

/**
 * Create a validated StemId
 * @param id - UUID string
 * @throws Error if id is not a valid UUID
 */
export function createStemId(id: string): StemId {
  if (!isValidUUID(id)) {
    throw new Error(`Invalid StemId: ${id}`);
  }
  return id as StemId;
}

/**
 * Create a validated ProjectId
 * @param id - UUID string
 * @throws Error if id is not a valid UUID
 */
export function createProjectId(id: string): ProjectId {
  if (!isValidUUID(id)) {
    throw new Error(`Invalid ProjectId: ${id}`);
  }
  return id as ProjectId;
}

/**
 * Create a validated ArtistId
 * @param id - UUID string
 * @throws Error if id is not a valid UUID
 */
export function createArtistId(id: string): ArtistId {
  if (!isValidUUID(id)) {
    throw new Error(`Invalid ArtistId: ${id}`);
  }
  return id as ArtistId;
}

/**
 * Create a validated PlaylistId
 * @param id - UUID string
 * @throws Error if id is not a valid UUID
 */
export function createPlaylistId(id: string): PlaylistId {
  if (!isValidUUID(id)) {
    throw new Error(`Invalid PlaylistId: ${id}`);
  }
  return id as PlaylistId;
}

// ============= Unsafe Casts (use sparingly) =============

/**
 * Cast string to TrackId without validation
 * @warning Only use when you're certain the ID is valid
 */
export function unsafeAsTrackId(id: string): TrackId {
  return id as TrackId;
}

/**
 * Cast string to UserId without validation
 * @warning Only use when you're certain the ID is valid
 */
export function unsafeAsUserId(id: string): UserId {
  return id as UserId;
}

/**
 * Cast string to StemId without validation
 * @warning Only use when you're certain the ID is valid
 */
export function unsafeAsStemId(id: string): StemId {
  return id as StemId;
}

// ============= Utilities =============

/**
 * Extract raw string from branded ID
 * @param branded - Branded ID value
 * @returns Raw string value
 */
export function extractId<T extends string>(branded: Brand<string, T>): string {
  return branded as string;
}
