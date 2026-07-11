import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "remove_track_from_playlist",
  title: "Remove track from playlist",
  description: "Remove a track from a user-owned playlist. RLS enforces ownership.",
  inputSchema: {
    playlist_id: z.string().uuid().describe("Target playlist UUID."),
    track_id: z.string().uuid().describe("Track UUID to remove."),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: true, openWorldHint: false },
  handler: async ({ playlist_id, track_id }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await supabase
      .from("playlist_tracks")
      .delete()
      .eq("playlist_id", playlist_id)
      .eq("track_id", track_id);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Removed track ${track_id} from playlist ${playlist_id}` }],
      structuredContent: { playlist_id, track_id, removed: true },
    };
  },
});
