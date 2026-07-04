/**
 * suno-file-upload — proxy for Suno's file upload API.
 *
 * Two actions supported per the docs (https://docs.sunoapi.org/file-upload-api/):
 *
 * 1. action: "base64" — uploads a base64-encoded file. Used when the client
 *    has the bytes in memory (e.g. drag-and-drop, recorded voice).
 *
 *    Body: { action: "base64", filename: string, fileBase64: string,
 *            contentType?: string }
 *
 * 2. action: "url" — uploads a remote file by URL. Used when the client
 *    already has a Supabase Storage URL for the audio.
 *
 *    Body: { action: "url", fileUrl: string, filename?: string }
 *
 * Returns: { file_url: string, expires_in_days: 3 }
 *
 * Notes:
 *  - Suno auto-deletes uploaded files after 3 days; we don't mirror that
 *    on our side, but we DO refuse to upload anything ≥50MB (Suno's hard
 *    limit per docs).
 *  - This is the single point of integration for all Suno flows that need
 *    an `uploadUrl` (upload-cover, upload-extend, mashup if it later
 *    supports local files, voice-generate, etc.) — see 052-A5.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";
import { corsHeaders } from "../_shared/cors.ts";

const logger = createLogger("suno-file-upload");

// Per docs: https://docs.sunoapi.org/file-upload-api/upload-file-base-64
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

interface Base64Body {
  action: "base64";
  filename: string;
  fileBase64: string;
  contentType?: string;
}

interface UrlBody {
  action: "url";
  fileUrl: string;
  filename?: string;
}

type FileUploadBody = Base64Body | UrlBody;

function bad(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function safeFilename(name: string): string {
  // Strip any path components and characters that could cause issues at
  // Suno's storage layer.
  const base = name.split(/[\\/]/).pop() ?? "audio.mp3";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "audio.mp3";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sunoApiKey = Deno.env.get("SUNO_API_KEY");
    if (!sunoApiKey) {
      logger.error("SUNO_API_KEY not configured");
      return bad("API key not configured", 500);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return bad("Server misconfigured", 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return bad("No authorization header", 401);

    // We accept both user JWTs (for direct UI calls) and service-role
    // (for internal Suno-edge calls like suno-upload-cover forwarding).
    const serviceSupabase = createClient(supabaseUrl, serviceKey);
    const isServiceRole = authHeader.replace(/^Bearer\s+/i, "").trim() === serviceKey;

    if (!isServiceRole) {
      const {
        data: { user },
        error: authError,
      } = await serviceSupabase.auth.getUser(authHeader.replace(/^Bearer\s+/, ""));
      if (authError || !user) return bad("Unauthorized", 401);
    }

    const body: FileUploadBody = await req.json();

    if (body.action === "base64") {
      if (!body.fileBase64) return bad("fileBase64 is required");
      if (!body.filename) return bad("filename is required");

      // Data-URL prefix stripping (clients commonly send "data:audio/mpeg;base64,...")
      const cleaned = body.fileBase64.includes(",") ? (body.fileBase64.split(",").pop() ?? "") : body.fileBase64;

      let bytes: Uint8Array;
      try {
        const raw = atob(cleaned);
        bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      } catch (err) {
        logger.error("Invalid base64", err);
        return bad("Invalid base64 payload");
      }

      if (bytes.length > MAX_FILE_SIZE_BYTES) {
        return bad(`File too large: ${bytes.length} bytes (max ${MAX_FILE_SIZE_BYTES})`);
      }
      if (bytes.length === 0) {
        return bad("Empty file");
      }

      const filename = safeFilename(body.filename);
      logger.info("Uploading base64 file to Suno", {
        bytes: bytes.length,
        filename,
      });

      // Suno's base64 endpoint accepts the base64 string in a JSON body.
      const sunoResponse = await fetch("https://api.sunoapi.org/api/v1/files/base64", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sunoApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // The exact field name isn't documented; we forward the cleaned
          // base64 + filename + content type so Suno can identify the file.
          fileBase64: cleaned,
          filename,
          contentType: body.contentType ?? "audio/mpeg",
        }),
        signal: AbortSignal.timeout(60000),
      });

      const sunoData = await sunoResponse.json();
      if (!sunoResponse.ok || sunoData.code !== 200) {
        logger.error("Suno file upload error", null, { sunoData });
        return new Response(
          JSON.stringify({
            error: sunoData.msg ?? "File upload failed",
            code: sunoData.code,
            details: sunoData,
          }),
          {
            status: sunoResponse.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const fileUrl: string | undefined = sunoData.data?.file_url ?? sunoData.data?.url ?? sunoData.data?.fileUrl;
      if (!fileUrl) {
        logger.error("No file_url in Suno response", null, { sunoData });
        throw new Error("No file_url in Suno file-upload response");
      }

      logger.info("File uploaded to Suno", { fileUrl });
      return new Response(
        JSON.stringify({
          success: true,
          file_url: fileUrl,
          expires_in_days: 3,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (body.action === "url") {
      if (!body.fileUrl) return bad("fileUrl is required");

      const filename = body.filename
        ? safeFilename(body.filename)
        : safeFilename(body.fileUrl.split("/").pop() ?? "audio.mp3");

      logger.info("Uploading URL file to Suno", {
        fileUrl: body.fileUrl,
        filename,
      });

      const sunoResponse = await fetch("https://api.sunoapi.org/api/v1/files/url", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sunoApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileUrl: body.fileUrl,
          filename,
        }),
        signal: AbortSignal.timeout(60000),
      });

      const sunoData = await sunoResponse.json();
      if (!sunoResponse.ok || sunoData.code !== 200) {
        logger.error("Suno file upload by URL error", null, { sunoData });
        return new Response(
          JSON.stringify({
            error: sunoData.msg ?? "File upload failed",
            code: sunoData.code,
            details: sunoData,
          }),
          {
            status: sunoResponse.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const outUrl: string | undefined =
        sunoData.data?.file_url ?? sunoData.data?.url ?? sunoData.data?.fileUrl ?? body.fileUrl;

      logger.info("URL file forwarded to Suno", { outUrl });
      return new Response(
        JSON.stringify({
          success: true,
          file_url: outUrl,
          expires_in_days: 3,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return bad('action must be "base64" or "url"');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Unhandled error in suno-file-upload", error);
    return bad(message, 500);
  }
});
