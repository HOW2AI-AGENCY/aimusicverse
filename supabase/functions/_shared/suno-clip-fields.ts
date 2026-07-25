/**
 * Suno clip field extraction with case-insensitive mapping.
 *
 * Suno's callback payload historically arrived in snake_case but current
 * production callbacks use camelCase (and some proxied paths mix both).
 * Every handler MUST route field access through these helpers so a shape
 * change on the vendor side can never silently drop clips.
 *
 * `validateClip` returns a structured skip reason (or null when the clip
 * is usable) so callers can log AND surface the reason to the UI via
 * `generation_tasks.audio_clips` / `notifications`.
 */

export type SunoClip = Record<string, unknown> & { id?: string; title?: string; duration?: number };

const pick = (clip: SunoClip | null | undefined, keys: string[]): string | null => {
  if (!clip) return null;
  for (const k of keys) {
    const v = (clip as Record<string, unknown>)[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return null;
};

export const getAudioUrl = (clip: SunoClip | null | undefined): string | null =>
  pick(clip, ["sourceAudioUrl", "source_audio_url", "audioUrl", "audio_url"]);

export const getStreamUrl = (clip: SunoClip | null | undefined): string | null =>
  pick(clip, [
    "sourceStreamAudioUrl",
    "source_stream_audio_url",
    "streamAudioUrl",
    "stream_audio_url",
  ]);

export const getImageUrl = (clip: SunoClip | null | undefined): string | null =>
  pick(clip, ["sourceImageUrl", "source_image_url", "imageUrl", "image_url"]);

export const getModelName = (clip: SunoClip | null | undefined): string | null =>
  pick(clip, ["modelName", "model_name"]);

export interface ExtractedClip {
  audioUrl: string | null;
  streamUrl: string | null;
  imageUrl: string | null;
  modelName: string | null;
  title: string | null;
  id: string | null;
  duration: number | null;
}

export function extractClipFields(clip: SunoClip | null | undefined): ExtractedClip {
  return {
    audioUrl: getAudioUrl(clip),
    streamUrl: getStreamUrl(clip),
    imageUrl: getImageUrl(clip),
    modelName: getModelName(clip),
    title: pick(clip, ["title"]),
    id: pick(clip, ["id"]),
    duration: typeof clip?.duration === "number" ? clip.duration : null,
  };
}

export type SkipReasonCode =
  | "missing_audio_url"
  | "missing_stream_url"
  | "missing_image_url"
  | "empty_clip"
  | "version_lookup_failed"
  | "version_write_failed"
  | "track_update_failed";

export interface SkipReason {
  code: SkipReasonCode;
  message: string;
  clipIndex: number;
  clipId: string | null;
  availableKeys: string[];
}

export interface ValidateOpts {
  requireAudio?: boolean; // default true
  requireStream?: boolean; // default false
  requireImage?: boolean; // default false
}

/**
 * Returns a skip reason when the clip cannot produce a version, or null when OK.
 * Includes the top-level keys observed on the clip to speed up debugging
 * when Suno changes the payload shape again.
 */
export function validateClip(
  clip: SunoClip | null | undefined,
  clipIndex: number,
  opts: ValidateOpts = {},
): SkipReason | null {
  const { requireAudio = true, requireStream = false, requireImage = false } = opts;

  if (!clip || typeof clip !== "object") {
    return {
      code: "empty_clip",
      message: `Clip #${clipIndex} is empty or not an object`,
      clipIndex,
      clipId: null,
      availableKeys: [],
    };
  }

  const availableKeys = Object.keys(clip);
  const fields = extractClipFields(clip);

  if (requireAudio && !fields.audioUrl) {
    return {
      code: "missing_audio_url",
      message: `Clip #${clipIndex} missing audio URL (checked sourceAudioUrl/source_audio_url/audioUrl/audio_url)`,
      clipIndex,
      clipId: fields.id,
      availableKeys,
    };
  }
  if (requireStream && !fields.streamUrl && !fields.audioUrl) {
    return {
      code: "missing_stream_url",
      message: `Clip #${clipIndex} missing stream URL`,
      clipIndex,
      clipId: fields.id,
      availableKeys,
    };
  }
  if (requireImage && !fields.imageUrl) {
    return {
      code: "missing_image_url",
      message: `Clip #${clipIndex} missing cover/image URL`,
      clipIndex,
      clipId: fields.id,
      availableKeys,
    };
  }
  return null;
}
