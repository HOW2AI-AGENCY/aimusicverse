/**
 * Storage Helper Functions
 * Sprint 010 Infrastructure - Phase 0
 *
 * Provides helper functions for uploading, downloading, and managing files
 * in Supabase Storage buckets with proper RLS policies and quota checks.
 *
 * Supported buckets:
 * - tracks: Audio files (private, up to 50MB)
 * - covers: Cover images (public, up to 5MB)
 * - stems: Stem files (private, up to 100MB)
 * - uploads: User uploads (private, up to 50MB)
 * - avatars: Profile images (public, up to 2MB)
 * - banners: Banner images (public, up to 5MB)
 * - temp: Temporary files (private, up to 100MB, auto-cleanup)
 */

import { supabase } from "@/integrations/supabase/client";

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

/**
 * File entity types for tracking in file_registry
 */
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
    format?: "webp" | "avif" | "origin";
  };
}

/**
 * Check if user has sufficient storage quota for file upload
 *
 * @param userId - User ID to check quota for
 * @param fileSize - Size of file in bytes
 * @returns Validation result with quota information
 */
export async function checkStorageQuota(
  userId: string,
  fileSize: number,
): Promise<{
  allowed: boolean;
  currentUsage: number;
  quota: number | null;
  available: number | null;
  usagePercentage: number;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.rpc("validate_file_upload", {
      user_uuid: userId,
      file_size: fileSize,
    });

    if (error) throw error;

    return {
      allowed: data.allowed,
      currentUsage: data.current_usage,
      quota: data.quota,
      available: data.available,
      usagePercentage: data.usage_percentage,
    };
  } catch (error) {
    console.error("Error checking storage quota:", error);
    return {
      allowed: false,
      currentUsage: 0,
      quota: null,
      available: null,
      usagePercentage: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Upload a file to Supabase Storage with quota check and file registry tracking
 *
 * @param options - Upload options including bucket, file, path, and metadata
 * @returns Upload result with URL and file ID
 *
 * @example
 * ```typescript
 * const result = await uploadFile({
 *   bucket: STORAGE_BUCKETS.COVERS,
 *   file: coverImageFile,
 *   path: `${userId}/tracks/${trackId}/cover.jpg`,
 *   entityType: 'cover',
 *   entityId: trackId,
 * });
 * ```
 */
export async function uploadFile(options: UploadFileOptions): Promise<UploadFileResult> {
  const { bucket, file, path, entityType, entityId, isTemporary = false, expiresInHours = 24, metadata = {} } = options;

  try {
    // Get current user
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

    // Check storage quota
    const fileSize = file.size;
    const quotaCheck = await checkStorageQuota(user.id, fileSize);

    if (!quotaCheck.allowed) {
      return {
        success: false,
        path: "",
        url: "",
        error: `Storage quota exceeded. Used: ${(quotaCheck.currentUsage / 1024 / 1024).toFixed(2)}MB / ${quotaCheck.quota ? (quotaCheck.quota / 1024 / 1024).toFixed(2) + "MB" : "Unlimited"}`,
      };
    }

    // Upload file to storage
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

    // Get file URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

    // Register file in file_registry
    const fileName = file instanceof File ? file.name : `${entityType}_${Date.now()}`;
    const mimeType = file instanceof File ? file.type : "application/octet-stream";

    const { data: registryData, error: registryError } = await supabase
      .from("file_registry")
      .insert({
        user_id: user.id,
        bucket_id: bucket,
        file_path: path,
        file_name: fileName,
        file_size_bytes: fileSize,
        mime_type: mimeType,
        entity_type: entityType,
        entity_id: entityId,
        is_temporary: isTemporary,
        expires_at: isTemporary ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString() : null,
        metadata,
      })
      .select("id")
      .single();

    if (registryError) {
      console.warn("Failed to register file in registry:", registryError);
    }

    return {
      success: true,
      path: uploadData.path,
      url: urlData.publicUrl,
      publicUrl: urlData.publicUrl,
      fileId: registryData?.id,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    return {
      success: false,
      path: "",
      url: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete a file from Supabase Storage and remove from file registry
 *
 * @param options - Delete options including bucket and path
 * @returns Success status
 *
 * @example
 * ```typescript
 * const result = await deleteFile({
 *   bucket: STORAGE_BUCKETS.COVERS,
 *   path: `${userId}/tracks/${trackId}/cover.jpg`,
 * });
 * ```
 */
export async function deleteFile(options: DeleteFileOptions): Promise<{ success: boolean; error?: string }> {
  const { bucket, path, fileId } = options;

  try {
    // Delete from storage
    const { error: deleteError } = await supabase.storage.from(bucket).remove([path]);

    if (deleteError) {
      return {
        success: false,
        error: deleteError.message,
      };
    }

    // Remove from file registry
    if (fileId) {
      const { error: registryError } = await supabase.from("file_registry").delete().eq("id", fileId);

      if (registryError) {
        console.warn("Failed to remove file from registry:", registryError);
      }
    } else {
      // Try to find by path
      const { error: registryError } = await supabase
        .from("file_registry")
        .delete()
        .eq("bucket_id", bucket)
        .eq("file_path", path);

      if (registryError) {
        console.warn("Failed to remove file from registry:", registryError);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting file:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get public URL for a file in storage
 *
 * @param options - URL options including bucket, path, and transformations
 * @returns Public URL for the file
 *
 * @example
 * ```typescript
 * const url = getFileUrl({
 *   bucket: STORAGE_BUCKETS.COVERS,
 *   path: `${userId}/tracks/${trackId}/cover.jpg`,
 *   transform: { width: 512, height: 512, quality: 90 },
 * });
 * ```
 */
export function getFileUrl(options: FileUrlOptions): string {
  const { bucket, path, download = false, transform } = options;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path, {
    download,
    transform,
  });

  return data.publicUrl;
}

/**
 * Get storage usage for current user
 *
 * @returns Storage usage information
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
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase.from("storage_usage").select("*").eq("user_id", user.id).single();

    if (error) throw error;

    const totalGB = data.total_bytes / 1024 / 1024 / 1024;
    const quotaGB = data.quota_bytes ? data.quota_bytes / 1024 / 1024 / 1024 : null;
    const usagePercentage = data.quota_bytes ? (data.total_bytes / data.quota_bytes) * 100 : 0;

    return {
      totalBytes: data.total_bytes,
      totalGB: Math.round(totalGB * 100) / 100,
      quotaBytes: data.quota_bytes,
      quotaGB: quotaGB ? Math.round(quotaGB * 100) / 100 : null,
      usagePercentage: Math.round(usagePercentage * 100) / 100,
      breakdown: {
        tracks: data.tracks_bytes,
        covers: data.covers_bytes,
        stems: data.stems_bytes,
        uploads: data.uploads_bytes,
        avatars: data.avatars_bytes,
        banners: data.banners_bytes,
      },
    };
  } catch (error) {
    console.error("Error getting storage usage:", error);
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
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get files for a specific entity
 *
 * @param entityType - Type of entity (track, cover, stem, etc.)
 * @param entityId - ID of the entity
 * @returns List of files associated with the entity
 */
export async function getEntityFiles(
  entityType: FileEntityType,
  entityId: string,
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
  try {
    const { data, error } = await supabase.rpc("get_entity_files", {
      entity_type_param: entityType,
      entity_id_param: entityId,
    });

    if (error) throw error;

    return {
      files: data.map(
        (file: {
          id: string;
          file_path: string;
          file_name: string;
          file_size_bytes: number;
          mime_type: string;
          bucket_id: string;
          created_at: string;
        }) => ({
          id: file.id,
          filePath: file.file_path,
          fileName: file.file_name,
          fileSizeBytes: file.file_size_bytes,
          mimeType: file.mime_type,
          bucketId: file.bucket_id,
          createdAt: file.created_at,
        }),
      ),
    };
  } catch (error) {
    console.error("Error getting entity files:", error);
    return {
      files: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Format bytes to human-readable string
 *
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.23 MB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
