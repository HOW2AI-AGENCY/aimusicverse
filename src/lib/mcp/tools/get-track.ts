import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "get_track",
  title: "Get track details",
  description:
    "Fetch full details for a single public track including all A/B versions, lyrics, and audio URLs.",
  inputSchema: {
    track_id: z.string().uuid().describe("UUID of the track."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ track_id }) => {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("tracks")
      .select("*, track_versions(*)")
      .eq("id", track_id)
      .eq("is_public", true)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Track not found or not public." }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { track: data },
    };
  },
});
