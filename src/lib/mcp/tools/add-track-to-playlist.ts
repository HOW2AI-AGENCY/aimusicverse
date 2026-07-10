import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "add_track_to_playlist",
  title: "Add track to playlist",
  description: "Add a track to one of the signed-in user's playlists. RLS ensures the playlist must belong to the user.",
  inputSchema: {
    playlist_id: z.string().uuid().describe("Target playlist UUID (must be owned by the user)."),
    track_id: z.string().uuid().describe("Track UUID to add."),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: false, openWorldHint: false },
  handler: async ({ playlist_id, track_id }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await supabase.from("playlist_tracks").insert({ playlist_id, track_id });
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Added track ${track_id} to playlist ${playlist_id}` }],
      structuredContent: { playlist_id, track_id, added: true },
    };
  },
});
