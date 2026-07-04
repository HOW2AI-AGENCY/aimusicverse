/**
 * Shared helper for forwarding a base64 (or remote-URL) audio payload to
 * Suno via the suno-file-upload edge function proxy.
 *
 * Used by suno-upload-cover and suno-upload-extend (Sprint 052-A5) to
 * consolidate the duplicated multipart/base64 upload logic that lived inline
 * in each edge before. Future Suno flows that need an uploadUrl
 * (mashup if it later supports local files, voice-generate, etc.) should
 * also use this helper.
 */

import { createLogger } from "./logger.ts";

export interface FileUploadResult {
  file_url: string;
  expires_in_days: number;
}

export interface ForwardBase64Options {
  supabaseUrl: string;
  serviceRoleKey: string;
  logger: ReturnType<typeof createLogger>;
  filename: string;
  fileBase64: string;
  contentType?: string;
  /** Per-action timeout in ms — Suno's file upload is heavier than /generate. */
  timeoutMs?: number;
}

/**
 * Forwards a base64 audio payload to suno-file-upload and returns the
 * Suno-hosted file_url (which the caller can then send as `uploadUrl` to
 * /api/v1/generate/upload-{cover,extend}).
 *
 * Strips an optional "data:audio/mpeg;base64," prefix before forwarding.
 * Validates the file size client-side (≤50MB) before hitting the proxy
 * so we fail fast on obviously oversized payloads.
 */
export async function forwardBase64ToSuno(opts: ForwardBase64Options): Promise<FileUploadResult> {
  const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

  // Strip the data-URL prefix before any size math.
  const cleaned = opts.fileBase64.includes(",") ? (opts.fileBase64.split(",").pop() ?? "") : opts.fileBase64;

  // Approximate byte length: 4 base64 chars → 3 bytes.
  const approxBytes = Math.floor((cleaned.length * 3) / 4);
  if (approxBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File too large: ~${approxBytes} bytes (max ${MAX_FILE_SIZE_BYTES})`);
  }

  const response = await fetch(`${opts.supabaseUrl}/functions/v1/suno-file-upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "base64",
      filename: opts.filename,
      fileBase64: cleaned,
      contentType: opts.contentType ?? "audio/mpeg",
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 60000),
  });

  const data = await response.json();
  if (!response.ok || !data.success || !data.file_url) {
    opts.logger.error("suno-file-upload proxy failed", null, { data });
    throw new Error(data.error ?? data.msg ?? "suno-file-upload failed");
  }

  return {
    file_url: data.file_url as string,
    expires_in_days: data.expires_in_days as number,
  };
}

export interface ForwardUrlOptions {
  supabaseUrl: string;
  serviceRoleKey: string;
  logger: ReturnType<typeof createLogger>;
  fileUrl: string;
  filename?: string;
  timeoutMs?: number;
}

/**
 * Asks Suno to take custody of an existing remote audio URL. Useful when
 * a Suno-flow needs an `uploadUrl` but the user already had their audio
 * on Supabase Storage.
 */
export async function forwardUrlToSuno(opts: ForwardUrlOptions): Promise<FileUploadResult> {
  const response = await fetch(`${opts.supabaseUrl}/functions/v1/suno-file-upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "url",
      fileUrl: opts.fileUrl,
      filename: opts.filename,
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 60000),
  });

  const data = await response.json();
  if (!response.ok || !data.success || !data.file_url) {
    opts.logger.error("suno-file-upload (url) proxy failed", null, { data });
    throw new Error(data.error ?? data.msg ?? "suno-file-upload (url) failed");
  }

  return {
    file_url: data.file_url as string,
    expires_in_days: data.expires_in_days as number,
  };
}
