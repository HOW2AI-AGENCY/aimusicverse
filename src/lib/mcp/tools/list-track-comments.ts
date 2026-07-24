import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

/**
 * Returns top-level moderated comments on a public track. RLS filters out
 * non-moderated comments and comments on private tracks, so no extra check is
 * needed here — the anon key + row policies keep visibility correct.
 */
export default defineTool({
  name: "list_track_comments",
  title: "List comments on a public track",
  description:
    "Return moderated top-level comments on a public track. Threaded replies are not expanded — pass a parent_id to fetch a specific thread.",
  inputSchema: {
    track_id: z.string().uuid().describe("UUID of the track."),
    limit: z.number().int().min(1).max(100).default(20).describe("Max results (1-100)."),
    parent_id: z
      .string()
      .uuid()
      .optional()
      .describe("Optional: fetch replies to this comment id instead of top-level comments."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ track_id, limit, parent_id }) => {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let query = supabase
      .from("comments")
      .select("id, track_id, user_id, content, likes_count, parent_id, created_at, updated_at")
      .eq("track_id", track_id)
      .eq("is_moderated", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    query = parent_id ? query.eq("parent_id", parent_id) : query.is("parent_id", null);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { comments: data ?? [] },
    };
  },
});
