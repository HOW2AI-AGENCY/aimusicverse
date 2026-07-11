import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "create_playlist",
  title: "Create a playlist",
  description: "Create a new playlist for the signed-in user. Returns the new playlist's id and metadata.",
  inputSchema: {
    name: z.string().trim().min(1).max(120).describe("Playlist display name."),
    description: z.string().trim().max(500).optional().describe("Optional description."),
    is_public: z.boolean().default(false).describe("If true, playlist is visible to everyone."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ name, description, is_public }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from("playlists")
      .insert({ name, description: description ?? null, is_public, user_id: ctx.getUserId() })
      .select()
      .single();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Created playlist "${data.name}" (id: ${data.id})` }],
      structuredContent: { playlist: data },
    };
  },
});
