import { supabase } from "../../_shared/supabase-client.ts";
import { logger } from "../../_shared/logger.ts";

export type SkipReason = {
  code: string;
  message: string;
  clipIndex: number;
  clipId: string | null;
  availableKeys: string[];
};

export type SkipReasonCode = "version_lookup_failed" | "version_write_failed" | "track_update_failed";

export function makePersistenceFailure(
  code: SkipReasonCode,
  message: string,
  clipIndex: number,
  clipId: string | null,
  availableKeys: string[],
): SkipReason {
  return { code, message, clipIndex, clipId, availableKeys };
}

export async function findExistingVersion(
  trackId: string,
  versionLabel: string,
  clipIndex: number,
  clipId: string | null,
): Promise<{ version: { id: string } | null; error: Error | null }> {
  const byClipIndex = await supabase
    .from("track_versions")
    .select("id")
    .eq("track_id", trackId)
    .eq("clip_index", clipIndex)
    .limit(1);
  if (byClipIndex.error) return { version: null, error: byClipIndex.error };
  if (byClipIndex.data?.[0]) return { version: byClipIndex.data[0], error: null };

  if (clipId) {
    const bySunoId = await supabase
      .from("track_versions")
      .select("id")
      .eq("track_id", trackId)
      .eq("metadata->>suno_id", clipId)
      .limit(1);
    if (bySunoId.error) return { version: null, error: bySunoId.error };
    if (bySunoId.data?.[0]) return { version: bySunoId.data[0], error: null };
  }

  const byLabel = await supabase
    .from("track_versions")
    .select("id")
    .eq("track_id", trackId)
    .eq("version_label", versionLabel)
    .limit(1);
  if (byLabel.error) return { version: null, error: byLabel.error };
  return { version: byLabel.data?.[0] ?? null, error: null };
}

export function getSourceType(mode: string | null): string {
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
