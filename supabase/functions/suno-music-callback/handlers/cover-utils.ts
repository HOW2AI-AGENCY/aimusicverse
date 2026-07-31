import { createLogger } from "../../_shared/logger.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const logger = createLogger("cover-utils");

export async function generateTrackCover(
  trackId: string,
  title: string,
  style: string | null,
  lyrics: string | null,
  userId: string,
  projectId: string | null,
) {
  try {
    await fetch(`${supabaseUrl}/functions/v1/generate-track-cover`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseServiceKey}` },
      body: JSON.stringify({
        trackId,
        title,
        style: style || "",
        lyrics: lyrics || "",
        userId,
        projectId,
      }),
    });
  } catch (e) {
    logger.error("Cover generation error", e);
  }
}
