import { getAudioUrl, getImageUrl, getModelName, getStreamUrl } from "../_shared/suno-clip-fields.ts";

/** Suno uses 'prompt' for lyrics. */
export const getLyrics = (clip: any): string => clip?.prompt || clip?.lyrics || clip?.lyric || "";

export const STEM_TYPE_MAP: Record<string, string> = {
  vocal_url: "vocal",
  instrumental_url: "instrumental",
  vocals_url: "vocal",
  backing_vocals_url: "backing_vocals",
  drums_url: "drums",
  bass_url: "bass",
  guitar_url: "guitar",
  keyboard_url: "keyboard",
  strings_url: "strings",
  brass_url: "brass",
  woodwinds_url: "woodwinds",
  percussion_url: "percussion",
  synth_url: "synth",
  fx_url: "fx",
  other_url: "other",
};

export function getStemInfoFromResponse(data: any): Record<string, unknown> | null {
  return (
    data?.response?.vocal_removal_info ||
    data?.response?.vocalRemovalInfo ||
    data?.vocal_removal_info ||
    data?.vocalRemovalInfo ||
    data?.data?.vocal_removal_info ||
    data?.data?.vocalRemovalInfo ||
    data ||
    null
  );
}

export function isProviderSuccess(status: string | null | undefined): boolean {
  const normalized = (status || "").toUpperCase();
  return normalized === "SUCCESS" || normalized === "COMPLETED" || normalized === "COMPLETE";
}

export function isProviderFailure(status: string | null | undefined): boolean {
  const normalized = (status || "").toUpperCase();
  return normalized.includes("FAILED") || normalized.includes("ERROR");
}

export function getRecoveredVersionType(mode: string | null): string {
  switch (mode) {
    case "extend":
      return "extension";
    case "remix":
      return "remix";
    case "cover":
      return "cover";
    case "replace_section":
      return "replace_section";
    case "inpaint":
      return "inpaint";
    case "add_vocals":
      return "vocal_add";
    case "add_instrumental":
      return "instrumental_add";
    default:
      return "initial";
  }
}

export function getRecoveredSourceType(mode: string | null): string {
  switch (mode) {
    case "extend":
      return "extended";
    case "remix":
      return "remix";
    case "cover":
      return "cover";
    case "add_vocals":
    case "add_instrumental":
      return "studio";
    default:
      return "generated";
  }
}

export const VERSION_LABELS = ["A", "B", "C", "D", "E"];

export interface DownloadResult {
  localAudioUrl: string | null;
  localCoverUrl: string | null;
}

/**
 * Download a remote file and upload it to Supabase storage.
 * Returns the public URL or null on failure.
 */
export async function downloadAndUpload(
  supabase: any,
  remoteUrl: string | null | undefined,
  storagePath: string,
  mimeType: string,
): Promise<string | null> {
  if (!remoteUrl) return null;
  try {
    const response = await fetch(remoteUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    const { data: uploadData } = await supabase.storage
      .from("project-assets")
      .upload(storagePath, blob, { contentType: mimeType, upsert: true });
    if (!uploadData) return null;
    return supabase.storage.from("project-assets").getPublicUrl(storagePath).data.publicUrl;
  } catch {
    return null;
  }
}

/**
 * Download audio + cover for a task/track, upload both to storage.
 */
export async function downloadTrackFiles(
  supabase: any,
  userId: string,
  trackId: string,
  audioUrl: string | null | undefined,
  imageUrl: string | null | undefined,
  suffix: string,
): Promise<DownloadResult> {
  const ts = Date.now();
  const localAudioUrl = audioUrl
    ? await downloadAndUpload(supabase, audioUrl, `tracks/${userId}/${trackId}_${suffix}_${ts}.mp3`, "audio/mpeg")
    : null;
  const localCoverUrl = imageUrl
    ? await downloadAndUpload(supabase, imageUrl, `covers/${userId}/${trackId}_${suffix}_cover_${ts}.jpg`, "image/jpeg")
    : null;
  return { localAudioUrl, localCoverUrl };
}
