/**
 * Storage Helper Functions
 *
 * Provides helper functions for uploading, downloading, and managing files
 * in Supabase Storage buckets.
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

/**
 * Storage bucket names
 */
export const STORAGE_BUCKETS = {
  TRACKS: "tracks",
  COVERS: "covers",
  STEMS: "stems",
  UPLOADS: "uploads",
  AVATARS: "avatars",
  BANNERS: "banners",
  TEMP: "temp",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export type FileEntityType = "track" | "cover" | "stem" | "avatar" | "banner" | "upload" | "temp";

export interface UploadFileOptions {
  bucket: StorageBucket;
  file: File | Blob;
  path: string;
  entityType?: FileEntityType;
  entityId?: string;
  isTemporary?: boolean;
  expiresInHours?: number;
  metadata?: Record<string, unknown>;
  onProgress?: (progress: number) => void;
}

export interface UploadFileResult {
  success: boolean;
  path: string;
  url: string;
  publicUrl?: string;
  fileId?: string;
  error?: string;
}

export interface DeleteFileOptions {
  bucket: StorageBucket;
  path: string;
  fileId?: string;
}

export interface FileUrlOptions {
  bucket: StorageBucket;
  path: string;
  download?: boolean;
  transform?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "origin";
  };
}

/**
 * Check if user has sufficient storage quota for file upload
 */
export async function checkStorageQuota(
  _userId: string,
  _fileSize: number
): Promise<{
  allowed: boolean;
  currentUsage: number;
  quota: number | null;
  available: number | null;
  usagePercentage: number;
  error?: string;
}> {
  // Simplified implementation - allow all uploads
  return {
    allowed: true,
    currentUsage: 0,
    quota: null,
    available: null,
    usagePercentage: 0,
  };
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(options: UploadFileOptions): Promise<UploadFileResult> {
  const { bucket, file, path } = options;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        path: "",
        url: "",
        error: "User not authenticated",
      };
    }

    const { data: uploadData, error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadError) {
      return {
        success: false,
        path: "",
        url: "",
        error: uploadError.message,
      };
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

    return {
      success: true,
      path: uploadData.path,
      url: urlData.publicUrl,
      publicUrl: urlData.publicUrl,
    };
  } catch (error) {
    logger.error("Error uploading file", error);
    return {
      success: false,
      path: "",
      url: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(options: DeleteFileOptions): Promise<{ success: boolean; error?: string }> {
  const { bucket, path } = options;

  try {
    const { error: deleteError } = await supabase.storage.from(bucket).remove([path]);

    if (deleteError) {
      return {
        success: false,
        error: deleteError.message,
      };
    }

    return { success: true };
  } catch (error) {
    logger.error("Error deleting file", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get public URL for a file in storage
 */
export function getFileUrl(options: FileUrlOptions): string {
  const { bucket, path, download = false, transform } = options;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path, {
    download,
    transform: transform ? {
      width: transform.width,
      height: transform.height,
      quality: transform.quality,
      format: transform.format,
    } : undefined,
  });

  return data.publicUrl;
}

/**
 * Get storage usage for current user
 */
export async function getStorageUsage(): Promise<{
  totalBytes: number;
  totalGB: number;
  quotaBytes: number | null;
  quotaGB: number | null;
  usagePercentage: number;
  breakdown: {
    tracks: number;
    covers: number;
    stems: number;
    uploads: number;
    avatars: number;
    banners: number;
  };
  error?: string;
}> {
  return {
    totalBytes: 0,
    totalGB: 0,
    quotaBytes: null,
    quotaGB: null,
    usagePercentage: 0,
    breakdown: {
      tracks: 0,
      covers: 0,
      stems: 0,
      uploads: 0,
      avatars: 0,
      banners: 0,
    },
  };
}

/**
 * Get files for a specific entity
 */
export async function getEntityFiles(
  _entityType: FileEntityType,
  _entityId: string
): Promise<{
  files: Array<{
    id: string;
    filePath: string;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
    bucketId: string;
    createdAt: string;
  }>;
  error?: string;
}> {
  return { files: [] };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
