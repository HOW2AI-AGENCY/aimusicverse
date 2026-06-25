/**
 * Lyrics Versioning Service
 * Core operations for lyrics versioning and history management
 *
 * This module handles:
 * - Saving lyrics with automatic versioning
 * - Retrieving lyrics history
 * - Restoring previous versions
 * - Comparing different versions
 *
 * @see src/api/lyrics.api.ts for database operations
 * @see src/services/lyrics/lyrics-validation.service.ts for validation utilities
 * @see src/services/lyrics/lyrics-types.ts for type definitions
 */

import * as lyricsApi from '@/api/lyrics.api';
import { logger } from '@/lib/logger';
import type {
  EnrichedLyricVersion,
  SaveLyricsRequest,
  LyricsComparison
} from './lyrics-types';
import { validateSaveLyricsRequest, hasStructuredSections } from './lyrics-validation.service';

// ============================================================================
// VERSIONING CONFIGURATION
// ============================================================================

const VERSIONING_CONFIG = {
  MAX_VERSIONS_PER_TRACK: 100,
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  COMPARISON_SIMILARITY_THRESHOLD: 0.8,
} as const;

// ============================================================================
// CORE VERSIONING OPERATIONS
// ============================================================================

/**
 * Saves lyrics with automatic versioning
 *
 * Creates a new version of the lyrics with automatic version numbering,
 * change detection, and history management.
 *
 * @param request - The save lyrics request with trackId, content, and authorId
 * @returns The newly created lyric version with metadata
 * @throws Error if validation fails or database operation fails
 */
export async function saveLyricsWithVersioning(
  request: SaveLyricsRequest
): Promise<EnrichedLyricVersion> {
  logger.info('Saving lyrics with versioning', {
    trackId: request.trackId,
    authorId: request.authorId,
    contentLength: request.content.length
  });

  // Validate request
  const validation = validateSaveLyricsRequest(request);
  if (!validation.isValid) {
    throw new Error(`Invalid save request: ${validation.errors.join(', ')}`);
  }

  // Get existing versions to determine next version number
  const existingVersions = await lyricsApi.getLyricVersions(request.trackId);
  const nextVersionNumber = existingVersions.length + 1;

  // Check if we've reached the max versions limit
  if (nextVersionNumber > VERSIONING_CONFIG.MAX_VERSIONS_PER_TRACK) {
    logger.warn('Maximum versions limit reached', {
      trackId: request.trackId,
      maxVersions: VERSIONING_CONFIG.MAX_VERSIONS_PER_TRACK
    });
    // Could implement oldest version deletion here
  }

  // Detect if this is a significant change (different from last version)
  const lastVersion = existingVersions[0]; // Most recent is first
  const hasSignificantChange = !lastVersion ||
    lastVersion.content !== request.content ||
    lastVersion.metadata !== JSON.stringify(request.metadata || {});

  // Create the new version
  const versionData: lyricsApi.CreateLyricVersionParams = {
    track_id: request.trackId,
    version_number: nextVersionNumber,
    content: request.content,
    author_id: request.authorId,
    change_description: generateChangeDescription(lastVersion, request.content),
    metadata: request.metadata || {},
    is_major_change: hasSignificantChange,
  };

  const result = await lyricsApi.createLyricVersion(versionData);

  // Enrich with computed properties
  const enrichedVersion = enrichLyricVersion(result);

  logger.info('Lyrics saved successfully', {
    trackId: request.trackId,
    versionNumber: nextVersionNumber,
    isMajorChange: hasSignificantChange
  });

  return enrichedVersion;
}

/**
 * Retrieves complete lyrics history for a track
 *
 * @param trackId - The ID of the track
 * @param options - Optional pagination and filtering options
 * @returns Array of enriched lyric versions ordered by creation date (newest first)
 */
export async function getLyricsHistory(
  trackId: string,
  options?: {
    limit?: number;
    offset?: number;
    includeMinorChanges?: boolean;
  }
): Promise<EnrichedLyricVersion[]> {
  logger.info('Fetching lyrics history', { trackId, options });

  try {
    const versions = await lyricsApi.getLyricVersions(trackId, {
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    });

    // Filter out minor changes if requested
    let filteredVersions = versions;
    if (options?.includeMinorChanges === false) {
      filteredVersions = versions.filter(v => v.is_major_change);
    }

    // Enrich all versions with computed properties
    const enrichedVersions = filteredVersions.map(enrichLyricVersion);

    logger.info('Lyrics history retrieved', {
      trackId,
      versionCount: enrichedVersions.length,
      totalVersions: versions.length
    });

    return enrichedVersions;
  } catch (error) {
    logger.error('Failed to fetch lyrics history', { trackId, error });
    throw new Error(`Failed to fetch lyrics history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Restores a previous lyrics version
 *
 * Creates a new version based on the content of a previous version,
 * effectively "restoring" it while maintaining version history.
 *
 * @param trackId - The ID of the track
 * @param versionNumber - The version number to restore
 * @param authorId - The ID of the user restoring the version
 * @returns The newly created version (with restored content)
 */
export async function restoreLyricsVersion(
  trackId: string,
  versionNumber: number,
  authorId: string
): Promise<EnrichedLyricVersion> {
  logger.info('Restoring lyrics version', {
    trackId,
    versionNumber,
    authorId
  });

  // Get the version to restore
  const versions = await lyricsApi.getLyricVersions(trackId);
  const versionToRestore = versions.find(v => v.version_number === versionNumber);

  if (!versionToRestore) {
    throw new Error(`Version ${versionNumber} not found for track ${trackId}`);
  }

  // Create a new version with the restored content
  const currentVersions = await lyricsApi.getLyricVersions(trackId);
  const nextVersionNumber = currentVersions.length + 1;

  const restoredVersionData: lyricsApi.CreateLyricVersionParams = {
    track_id: trackId,
    version_number: nextVersionNumber,
    content: versionToRestore.content,
    author_id: authorId,
    change_description: `Restored from version ${versionNumber}`,
    metadata: {
      restored_from_version: versionNumber,
      restored_at: new Date().toISOString(),
    },
    is_major_change: true,
  };

  const result = await lyricsApi.createLyricVersion(restoredVersionData);
  const enrichedVersion = enrichLyricVersion(result);

  logger.info('Lyrics version restored successfully', {
    trackId,
    restoredFrom: versionNumber,
    newVersionNumber: nextVersionNumber
  });

  return enrichedVersion;
}

/**
 * Compares two lyric versions and highlights differences
 *
 * @param trackId - The ID of the track
 * @param versionANumber - First version number to compare
 * @param versionBNumber - Second version number to compare
 * @returns Detailed comparison showing additions, deletions, and modifications
 */
export async function compareLyricVersions(
  trackId: string,
  versionANumber: number,
  versionBNumber: number
): Promise<LyricsComparison> {
  logger.info('Comparing lyric versions', {
    trackId,
    versionANumber,
    versionBNumber
  });

  try {
    // Get both versions
    const versions = await lyricsApi.getLyricVersions(trackId);
    const versionA = versions.find(v => v.version_number === versionANumber);
    const versionB = versions.find(v => v.version_number === versionBNumber);

    if (!versionA) {
      throw new Error(`Version ${versionANumber} not found`);
    }

    if (!versionB) {
      throw new Error(`VersionBNumber ${versionBNumber} not found`);
    }

    // Perform comparison
    const differences = computeDifferences(
      versionA.content,
      versionB.content
    );

    const similarityScore = computeSimilarityScore(
      versionA.content,
      versionB.content,
      differences
    );

    const comparison: LyricsComparison = {
      versionA: {
        versionNumber: versionANumber,
        content: versionA.content
      },
      versionB: {
        versionNumber: versionBNumber,
        content: versionB.content
      },
      differences,
      similarityScore
    };

    logger.info('Lyrics comparison completed', {
      trackId,
      similarityScore,
      differencesCount: differences.length
    });

    return comparison;
  } catch (error) {
    logger.error('Failed to compare lyrics versions', { trackId, error });
    throw new Error(`Failed to compare lyrics versions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Batch save lyrics for multiple tracks
 *
 * @param requests - Array of save lyrics requests
 * @returns BatchLyricsResult with successful and failed operations
 */
export async function batchSaveLyrics(
  requests: SaveLyricsRequest[]
): Promise<{ successful: string[]; failed: Array<{ trackId: string; error: string }> }> {
  logger.info('Batch saving lyrics', { requestCount: requests.length });

  const successful: string[] = [];
  const failed: Array<{ trackId: string; error: string }> = [];

  // Process requests sequentially to avoid overwhelming the database
  for (const request of requests) {
    try {
      await saveLyricsWithVersioning(request);
      successful.push(request.trackId);
    } catch (error) {
      logger.error('Failed to save lyrics in batch', {
        trackId: request.trackId,
        error
      });
      failed.push({
        trackId: request.trackId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  logger.info('Batch save completed', {
    total: requests.length,
    successful: successful.length,
    failed: failed.length
  });

  return { successful, failed };
}

/**
 * Batch get lyrics history for multiple tracks
 *
 * @param trackIds - Array of track IDs
 * @returns Map of track IDs to their version histories
 */
export async function batchGetLyricsHistory(
  trackIds: string[]
): Promise<Map<string, EnrichedLyricVersion[]>> {
  logger.info('Batch fetching lyrics history', { trackCount: trackIds.length });

  const historyMap = new Map<string, EnrichedLyricVersion[]>();

  // Process tracks in parallel with concurrency limit
  const concurrencyLimit = 10;
  for (let i = 0; i < trackIds.length; i += concurrencyLimit) {
    const batch = trackIds.slice(i, i + concurrencyLimit);

    const results = await Promise.allSettled(
      batch.map(trackId => getLyricsHistory(trackId))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        historyMap.set(batch[index], result.value);
      } else {
        logger.error('Failed to fetch history for track', {
          trackId: batch[index],
          error: result.reason
        });
        historyMap.set(batch[index], []);
      }
    });
  }

  logger.info('Batch history fetch completed', {
    totalTracks: trackIds.length,
    successfulFetches: historyMap.size
  });

  return historyMap;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Enriches a lyric version with computed properties
 */
function enrichLyricVersion(version: lyricsApi.LyricVersionWithAuthor): EnrichedLyricVersion {
  const words = version.content.trim().split(/\s+/).filter(w => w.length > 0);
  const lines = version.content.split('\n').filter(line => line.trim().length > 0);

  // Estimate duration (2.5 seconds per line)
  const estimatedDuration = lines.length * 2.5;

  return {
    ...version,
    wordCount: words.length,
    lineCount: lines.length,
    estimatedDuration,
    hasStructuredSections: hasStructuredSections(version.content)
  };
}

/**
 * Generates a change description based on content differences
 */
function generateChangeDescription(
  previousVersion: lyricsApi.LyricVersionWithAuthor | undefined,
  newContent: string
): string {
  if (!previousVersion) {
    return 'Initial lyrics creation';
  }

  const oldLength = previousVersion.content.length;
  const newLength = newContent.length;
  const lengthDiff = newLength - oldLength;

  if (lengthDiff > 100) {
    return `Extended lyrics (+${lengthDiff} characters)`;
  } else if (lengthDiff < -100) {
    return `Condensed lyrics (${lengthDiff} characters)`;
  } else if (previousVersion.content !== newContent) {
    return 'Modified lyrics content';
  } else {
    return 'Updated lyrics metadata';
  }
}

/**
 * Computes differences between two text contents
 */
function computeDifferences(
  contentA: string,
  contentB: string
): Array<{ type: 'addition' | 'deletion' | 'modification'; content: string; position: number }> {
  const differences: Array<{ type: 'addition' | 'deletion' | 'modification'; content: string; position: number }> = [];

  const linesA = contentA.split('\n');
  const linesB = contentB.split('\n');

  let indexA = 0;
  let indexB = 0;

  while (indexA < linesA.length || indexB < linesB.length) {
    const lineA = linesA[indexA];
    const lineB = linesB[indexB];

    if (lineA === lineB) {
      // Lines are identical
      indexA++;
      indexB++;
    } else if (lineA && !lineB) {
      // Line deleted
      differences.push({
        type: 'deletion',
        content: lineA,
        position: indexA
      });
      indexA++;
    } else if (!lineA && lineB) {
      // Line added
      differences.push({
        type: 'addition',
        content: lineB,
        position: indexB
      });
      indexB++;
    } else {
      // Line modified
      differences.push({
        type: 'modification',
        content: `${lineA} → ${lineB}`,
        position: indexA
      });
      indexA++;
      indexB++;
    }
  }

  return differences;
}

/**
 * Computes similarity score between two contents
 */
function computeSimilarityScore(
  contentA: string,
  contentB: string,
  differences: Array<{ type: string; content: string; position: number }>
): number {
  const wordsA = contentA.split(/\s+/);
  const wordsB = contentB.split(/\s+/);

  if (wordsA.length === 0 && wordsB.length === 0) return 1.0;
  if (wordsA.length === 0 || wordsB.length === 0) return 0.0;

  const maxLength = Math.max(wordsA.length, wordsB.length);
  const differenceCount = differences.length;

  const similarity = 1 - (differenceCount / maxLength);

  return Math.max(0, Math.min(1, similarity));
}