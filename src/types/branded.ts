/**
 * Branded Types for Type Safety
 * 
 * Provides nominal typing for IDs and other primitives
 * to prevent accidental mixing of different ID types.
 */

// Brand symbol for type discrimination
declare const brand: unique symbol;

type Brand<T, B> = T & { [brand]: B };

// ============= ID Types =============

export type TrackId = Brand<string, 'TrackId'>;
export type UserId = Brand<string, 'UserId'>;
export type StemId = Brand<string, 'StemId'>;
export type ProjectId = Brand<string, 'ProjectId'>;
export type ArtistId = Brand<string, 'ArtistId'>;
export type PlaylistId = Brand<string, 'PlaylistId'>;

// ============= Type Guards =============

export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// ============= Factory Functions =============

export function createTrackId(id: string): TrackId {
  if (!isValidUUID(id)) {
    throw new Error(`Invalid TrackId: ${id}`);
  }
  return id as TrackId;
}

export function createUserId(id: string): UserId {
  if (!isValidUUID(id)) {
    throw new Error(`Invalid UserId: ${id}`);
  }
  return id as UserId;
}

export function createStemId(id: string): StemId {
  if (!isValidUUID(id)) {
    throw new Error(`Invalid StemId: ${id}`);
  }
  return id as StemId;
}

export function createProjectId(id: string): ProjectId {
  if (!isValidUUID(id)) {
    throw new Error(`Invalid ProjectId: ${id}`);
  }
  return id as ProjectId;
}

export function createArtistId(id: string): ArtistId {
  if (!isValidUUID(id)) {
    throw new Error(`Invalid ArtistId: ${id}`);
  }
  return id as ArtistId;
}

export function createPlaylistId(id: string): PlaylistId {
  if (!isValidUUID(id)) {
    throw new Error(`Invalid PlaylistId: ${id}`);
  }
  return id as PlaylistId;
}

// ============= Unsafe Casts (use sparingly) =============

export function unsafeAsTrackId(id: string): TrackId {
  return id as TrackId;
}

export function unsafeAsUserId(id: string): UserId {
  return id as UserId;
}

export function unsafeAsStemId(id: string): StemId {
  return id as StemId;
}

// ============= Utilities =============

export function extractId<T extends string>(branded: Brand<string, T>): string {
  return branded as string;
}
