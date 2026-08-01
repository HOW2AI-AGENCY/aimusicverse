import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { API_BASE } from "./request-builder.ts";

const STORAGE_BUCKET = "project-assets-private";

export function getContentType(format: string): string {
  const types: Record<string, string> = {
    midi: "audio/midi",
    midi_quant: "audio/midi",
    mxml: "application/xml",
    gp5: "application/x-guitar-pro",
    pdf: "application/pdf",
    json: "application/json",
  };
  return types[format] || "application/octet-stream";
}

function getExtension(format: string): string {
  if (format === "mxml") return "xml";
  if (format === "midi_quant" || format === "midi") return "mid";
  return format;
}

/** Fetch a file from Klangio API, upload to Supabase storage, return signed URL. */
export async function fetchAndUploadFile(
  supabase: SupabaseClient,
  userId: string,
  jobId: string,
  format: string,
  apiKey: string,
): Promise<{ url: string } | { error: string }> {
  const endpoints: Record<string, string[]> = {
    midi: ["midi_unq", "midi", "download/midi", "result/midi"],
    midi_quant: ["midi_unq", "midi_quant", "download/midi_unq"],
    mxml: ["xml", "download/xml"],
    gp5: ["gp5", "download/gp5"],
    pdf: ["pdf", "download/pdf"],
  };

  const candidates = endpoints[format] || [format];

  for (const ep of candidates) {
    for (let retry = 0; retry < 3; retry++) {
      if (retry > 0) await new Promise((r) => setTimeout(r, 1500 * Math.pow(1.3, retry - 1)));

      const resp = await fetch(`${API_BASE}/job/${jobId}/${ep}`, {
        headers: { "kl-api-key": apiKey },
      });

      if (resp.ok && resp.status === 200) {
        const blob = await resp.blob();
        const ext = getExtension(format);
        const fileName = `${userId}/klangio/${jobId}_${format}.${ext}`;
        const typedBlob = new Blob([blob], { type: getContentType(format) });

        const { error: uploadErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, typedBlob, { contentType: getContentType(format), upsert: true });

        if (uploadErr) return { error: `upload: ${JSON.stringify(uploadErr)}` };

        const { data: signed, error: signErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(fileName, 60 * 60 * 24 * 365);

        if (signErr || !signed?.signedUrl) return { error: `sign: ${signErr?.message}` };
        return { url: signed.signedUrl };
      }
      if (resp.status !== 404) break; // non-404 = don't retry
    }
  }

  return { error: "not_found" };
}

/** Upload a Uint8Array MIDI blob as fallback. */
export async function uploadFallbackMidi(
  supabase: SupabaseClient,
  userId: string,
  jobId: string,
  midiData: Uint8Array,
): Promise<string | null> {
  const arrayBuffer = midiData.buffer.slice(
    midiData.byteOffset,
    midiData.byteOffset + midiData.byteLength,
  ) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: "audio/midi" });
  const fileName = `${userId}/klangio/${jobId}_midi_generated.mid`;

  const { error: uploadErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, blob, { contentType: "audio/midi", upsert: true });

  if (uploadErr) return null;

  const { data: signed } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(fileName, 60 * 60 * 24 * 365);

  return signed?.signedUrl || null;
}
