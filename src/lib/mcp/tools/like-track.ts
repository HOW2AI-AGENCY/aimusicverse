import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "like_track",
  title: "Like or unlike a track",
  description: "Toggle a like on a public track as the signed-in user. Returns the new like state.",
  inputSchema: {
    track_id: z.string().uuid().describe("UUID of the track to like/unlike."),
    action: z.enum(["like", "unlike"]).default("like").describe("Whether to add or remove the like."),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: false, openWorldHint: false },
  handler: async ({ track_id, action }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (action === "unlike") {
      const { error } = await supabase
        .from("track_likes")
        .delete()
        .eq("track_id", track_id)
        .eq("user_id", ctx.getUserId());
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      return {
        content: [{ type: "text", text: `Unliked track ${track_id}` }],
        structuredContent: { track_id, liked: false },
      };
    }

    const { error } = await supabase.from("track_likes").insert({ track_id, user_id: ctx.getUserId() });
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Liked track ${track_id}` }],
      structuredContent: { track_id, liked: true },
    };
  },
});
