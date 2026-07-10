import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_track_versions",
  title: "List track versions",
  description: "List all A/B versions for a track with version_label, is_primary, audio_url and metadata.",
  inputSchema: {
    track_id: z.string().uuid().describe("UUID of the track."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ track_id }, ctx: ToolContext) => {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      global: ctx.isAuthenticated() ? { headers: { Authorization: `Bearer ${ctx.getToken()}` } } : {},
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from("track_versions")
      .select("*")
      .eq("track_id", track_id)
      .order("clip_index", { ascending: true });

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { track_id, versions: data ?? [] },
    };
  },
});
