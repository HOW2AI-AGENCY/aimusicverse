/**
 * Storage API — centralized Supabase Storage operations.
 *
 * All component-level storage access should go through these functions
 * instead of calling supabase.storage directly.
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export type StorageBucket =
  | "avatars"
  | "reference-audio"
  | "audio-references"
  | "audio"
  | "project-assets"
  | "project-banners"
  | "bot-assets"
  | "broadcast";

interface UploadOptions {
  bucket: StorageBucket;
  path: string;
  file: File | Blob;
  contentType?: string;
  upsert?: boolean;
}

interface UploadResult {
  data: { path: string; publicUrl: string } | null;
  error: Error | null;
}

export async function uploadFile({
  bucket,
  path,
  file,
  contentType,
  upsert = false,
}: UploadOptions): Promise<UploadResult> {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType,
    upsert,
  });

  if (error) {
    logger.error("Storage upload failed", { bucket, path, error: error.message });
    return { data: null, error };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return { data: { path: data.path, publicUrl }, error: null };
}

export async function deleteFile(bucket: StorageBucket, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    logger.error("Storage delete failed", { bucket, path, error: error.message });
  }
  return { error };
}

export async function listFiles(bucket: StorageBucket, folder: string) {
  const { data, error } = await supabase.storage.from(bucket).list(folder);
  if (error) {
    logger.error("Storage list failed", { bucket, folder, error: error.message });
  }
  return { data, error };
}

export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
}
