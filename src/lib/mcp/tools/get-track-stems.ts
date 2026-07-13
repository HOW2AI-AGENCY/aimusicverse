import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "get_track_stems",
  title: "Get track stems",
  description:
    "Fetch stems (vocals, drums, bass, other) for a track. Returns stems only if the track is public or belongs to the signed-in user.",
  inputSchema: {
    track_id: z.string().uuid().describe("UUID of the track."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ track_id }, ctx: ToolContext) => {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      global: ctx.isAuthenticated() ? { headers: { Authorization: `Bearer ${ctx.getToken()}` } } : {},
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.from("track_stems").select("*").eq("track_id", track_id);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { track_id, stems: data ?? [] },
    };
  },
});
