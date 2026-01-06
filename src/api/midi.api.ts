/**
 * MIDI API Layer
 * Edge Function operations for MIDI file upload, metadata, and download
 *
 * API Contracts Reference: specs/031-mobile-studio-v2/contracts/api-contracts.md
 */

import { supabase } from '@/integrations/supabase/client';

// ==========================================
// Types
// ==========================================

/**
 * MIDI file metadata from upload response
 */
export interface MidiFileMetadata {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  duration: number;
  tempo: number;
  timeSignature: string;
  keySignature: string;
  noteCount: number;
  trackCount: number;
}

/**
 * MIDI file record with timestamps
 */
export interface MidiFileRecord extends MidiFileMetadata {
  createdAt: string;
  updatedAt?: string;
}

/**
 * Upload MIDI file request
 */
export interface UploadMidiRequest {
  file: File;
  trackId?: string;
}

/**
 * Upload MIDI file response
 */
export interface UploadMidiResponse {
  success: boolean;
  data?: MidiFileMetadata;
  error?: string;
}

/**
 * Get MIDI metadata response
 */
export interface GetMidiMetadataResponse {
  success: boolean;
  data?: MidiFileRecord;
  error?: string;
}

/**
 * Download MIDI file response
 */
export interface DownloadMidiResponse {
  success: boolean;
  data?: Blob;
  filename?: string;
  error?: string;
}

/**
 * API error response
 */
export interface MidiApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
}

// ==========================================
// MIDI File Operations
// ==========================================

/**
 * Upload a MIDI file
 *
 * POST /midi/upload
 *
 * @param params - Upload parameters including file and optional track ID
 * @returns MIDI file metadata or error
 *
 * @example
 * ```typescript
 * const result = await uploadMidiFile({
 *   file: midiFile,
 *   trackId: 'track-uuid'
 * });
 * if (result.success && result.data) {
 *   console.log('MIDI uploaded:', result.data.fileUrl);
 * }
 * ```
 */
export async function uploadMidiFile(
  params: UploadMidiRequest
): Promise<UploadMidiResponse> {
  try {
    const { file, trackId } = params;

    // Validate file type
    if (!file.type.includes('midi') && !file.name.endsWith('.mid')) {
      return {
        success: false,
        error: 'Invalid file type. Please upload a MIDI file (.mid)',
      };
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: 'File size exceeds 10MB limit',
      };
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    if (trackId) {
      formData.append('trackId', trackId);
    }

    // Invoke edge function
    const { data, error } = await supabase.functions.invoke('midi-upload', {
      body: formData,
    });

    if (error) {
      console.error('[midi.api] Upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload MIDI file',
      };
    }

    // Parse response
    if (data?.error) {
      return {
        success: false,
        error: data.error,
      };
    }

    return {
      success: true,
      data: data as MidiFileMetadata,
    };
  } catch (err) {
    console.error('[midi.api] Upload exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected error during upload',
    };
  }
}

/**
 * Get MIDI file metadata
 *
 * GET /midi/{midiId}
 *
 * @param midiId - MIDI file ID
 * @returns MIDI file metadata or error
 *
 * @example
 * ```typescript
 * const result = await getMidiMetadata('midi-uuid');
 * if (result.success && result.data) {
 *   console.log('MIDI duration:', result.data.duration);
 *   console.log('MIDI tempo:', result.data.tempo);
 * }
 * ```
 */
export async function getMidiMetadata(
  midiId: string
): Promise<GetMidiMetadataResponse> {
  try {
    if (!midiId) {
      return {
        success: false,
        error: 'MIDI ID is required',
      };
    }

    // Query MIDI metadata from database
    // Note: This assumes a midi_files table exists or uses edge function
    const { data, error } = await supabase.functions.invoke('midi-get-metadata', {
      body: { midiId },
    });

    if (error) {
      console.error('[midi.api] Get metadata error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get MIDI metadata',
      };
    }

    if (data?.error) {
      return {
        success: false,
        error: data.error,
      };
    }

    return {
      success: true,
      data: data as MidiFileRecord,
    };
  } catch (err) {
    console.error('[midi.api] Get metadata exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected error fetching metadata',
    };
  }
}

/**
 * Download MIDI file
 *
 * GET /midi/{midiId}/download
 *
 * @param midiId - MIDI file ID
 * @returns MIDI file as blob or error
 *
 * @example
 * ```typescript
 * const result = await downloadMidiFile('midi-uuid');
 * if (result.success && result.data) {
 *   const url = URL.createObjectURL(result.data);
 *   const a = document.createElement('a');
 *   a.href = url;
 *   a.download = result.filename || 'song.mid';
 *   a.click();
 * }
 * ```
 */
export async function downloadMidiFile(
  midiId: string
): Promise<DownloadMidiResponse> {
  try {
    if (!midiId) {
      return {
        success: false,
        error: 'MIDI ID is required',
      };
    }

    // Get metadata first to retrieve file URL
    const metadataResult = await getMidiMetadata(midiId);
    if (!metadataResult.success || !metadataResult.data) {
      return {
        success: false,
        error: metadataResult.error || 'Failed to get MIDI metadata',
      };
    }

    // Fetch the file from the public URL
    const response = await fetch(metadataResult.data.fileUrl);
    if (!response.ok) {
      return {
        success: false,
        error: `Failed to download MIDI file: ${response.statusText}`,
      };
    }

    const blob = await response.blob();

    return {
      success: true,
      data: blob,
      filename: metadataResult.data.fileName,
    };
  } catch (err) {
    console.error('[midi.api] Download exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected error downloading file',
    };
  }
}

/**
 * Get MIDI file public URL (for direct access)
 *
 * @param midiId - MIDI file ID
 * @returns Public URL or null
 *
 * @example
 * ```typescript
 * const url = await getMidiPublicUrl('midi-uuid');
 * if (url) {
 *   window.open(url, '_blank');
 * }
 * ```
 */
export async function getMidiPublicUrl(
  midiId: string
): Promise<string | null> {
  try {
    const result = await getMidiMetadata(midiId);
    return result.success && result.data ? result.data.fileUrl : null;
  } catch (err) {
    console.error('[midi.api] Get public URL exception:', err);
    return null;
  }
}

/**
 * Delete MIDI file
 *
 * DELETE /midi/{midiId}
 *
 * @param midiId - MIDI file ID
 * @returns Success status or error
 *
 * @example
 * ```typescript
 * const result = await deleteMidiFile('midi-uuid');
 * if (result.success) {
 *   console.log('MIDI file deleted');
 * }
 * ```
 */
export async function deleteMidiFile(
  midiId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!midiId) {
      return {
        success: false,
        error: 'MIDI ID is required',
      };
    }

    // Invoke edge function to delete MIDI file
    const { data, error } = await supabase.functions.invoke('midi-delete', {
      body: { midiId },
    });

    if (error) {
      console.error('[midi.api] Delete error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete MIDI file',
      };
    }

    if (data?.error) {
      return {
        success: false,
        error: data.error,
      };
    }

    return { success: true };
  } catch (err) {
    console.error('[midi.api] Delete exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected error during deletion',
    };
  }
}

/**
 * List MIDI files for a track
 *
 * GET /midi?trackId={trackId}
 *
 * @param trackId - Track ID to list MIDI files for
 * @returns Array of MIDI file metadata or error
 *
 * @example
 * ```typescript
 * const result = await listMidiFilesForTrack('track-uuid');
 * if (result.success && result.data) {
 *   console.log('Found MIDI files:', result.data.length);
 * }
 * ```
 */
export async function listMidiFilesForTrack(
  trackId: string
): Promise<{ success: boolean; data?: MidiFileRecord[]; error?: string }> {
  try {
    if (!trackId) {
      return {
        success: false,
        error: 'Track ID is required',
      };
    }

    // Query MIDI files for the track
    const { data, error } = await supabase.functions.invoke('midi-list', {
      body: { trackId },
    });

    if (error) {
      console.error('[midi.api] List error:', error);
      return {
        success: false,
        error: error.message || 'Failed to list MIDI files',
      };
    }

    if (data?.error) {
      return {
        success: false,
        error: data.error,
      };
    }

    return {
      success: true,
      data: data as MidiFileRecord[],
    };
  } catch (err) {
    console.error('[midi.api] List exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected error listing files',
    };
  }
}

// ==========================================
// Utility Functions
// ==========================================

/**
 * Validate MIDI file before upload
 *
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 */
export function validateMidiFile(
  file: File
): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['audio/midi', 'audio/mid', 'audio/x-midi'];
  const validExtensions = ['.mid', '.midi'];

  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );

  if (!hasValidType && !hasValidExtension) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a MIDI file (.mid)',
    };
  }

  // Check file size (max 10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size exceeds 10MB limit',
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  return { valid: true };
}

/**
 * Format MIDI metadata for display
 *
 * @param metadata - MIDI file metadata
 * @returns Formatted string with key information
 */
export function formatMidiMetadata(metadata: MidiFileMetadata): string {
  const parts = [
    `Tempo: ${metadata.tempo} BPM`,
    `Time Signature: ${metadata.timeSignature}`,
    `Key: ${metadata.keySignature}`,
    `Duration: ${Math.round(metadata.duration)}s`,
    `Notes: ${metadata.noteCount}`,
    `Tracks: ${metadata.trackCount}`,
  ];

  return parts.join(' | ');
}

/**
 * Parse MIDI file name to extract metadata
 *
 * @param filename - MIDI file name
 * @returns Parsed metadata object
 */
export function parseMidiFileName(
  filename: string
): { name: string; extension: string } {
  const lastDotIndex = filename.lastIndexOf('.');
  const name = lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
  const extension = lastDotIndex !== -1
    ? filename.substring(lastDotIndex + 1).toLowerCase()
    : '';

  return { name, extension };
}
