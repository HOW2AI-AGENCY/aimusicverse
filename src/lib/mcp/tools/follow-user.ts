import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "follow_user",
  title: "Follow or unfollow a user",
  description:
    "Toggle a follow relationship with another MusicVerse AI user as the signed-in user. Returns the new follow state.",
  inputSchema: {
    user_id: z.string().uuid().describe("UUID of the user to follow or unfollow (auth.users.id)."),
    action: z.enum(["follow", "unfollow"]).default("follow").describe("Whether to follow or unfollow."),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: false, openWorldHint: false },
  handler: async ({ user_id, action }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const me = ctx.getUserId();
    if (me === user_id) {
      return { content: [{ type: "text", text: "You cannot follow yourself." }], isError: true };
    }
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (action === "unfollow") {
      const { error } = await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", me)
        .eq("following_id", user_id);
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      return {
        content: [{ type: "text", text: `Unfollowed ${user_id}` }],
        structuredContent: { user_id, following: false },
      };
    }

    const { error } = await supabase
      .from("user_follows")
      .insert({ follower_id: me, following_id: user_id });
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Followed ${user_id}` }],
      structuredContent: { user_id, following: true },
    };
  },
});
