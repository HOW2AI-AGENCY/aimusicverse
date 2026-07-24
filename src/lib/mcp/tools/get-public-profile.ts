import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

/**
 * Reads the `safe_public_profiles` view, which exposes only fields the profile
 * owner has chosen to make public. Base `profiles` rows are never returned.
 */
export default defineTool({
  name: "get_public_profile",
  title: "Get a public profile",
  description:
    "Look up another user's public MusicVerse AI profile by username or user_id. Only fields the owner has chosen to publish are returned.",
  inputSchema: {
    username: z.string().trim().min(1).optional().describe("Public username (without @)."),
    user_id: z.string().uuid().optional().describe("UUID of the user (auth.users.id)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ username, user_id }) => {
    if (!username && !user_id) {
      return {
        content: [{ type: "text", text: "Provide either `username` or `user_id`." }],
        isError: true,
      };
    }
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let query = supabase
      .from("safe_public_profiles")
      .select(
        "user_id, username, display_name, bio, photo_url, banner_url, followers_count, following_count, subscription_tier, created_at",
      )
      .limit(1);
    query = user_id ? query.eq("user_id", user_id) : query.eq("username", username!);

    const { data, error } = await query.maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) {
      return {
        content: [{ type: "text", text: "No public profile found for the given identifier." }],
        structuredContent: { profile: null },
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { profile: data },
    };
  },
});
