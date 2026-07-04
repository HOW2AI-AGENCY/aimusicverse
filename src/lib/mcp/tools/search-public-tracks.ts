import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "search_public_tracks",
  title: "Search public tracks",
  description:
    "Search MusicVerse AI's public track catalog by title, genre, or mood. Returns id, title, genre, mood, duration, play count, and audio/cover URLs.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Search text matched against title, genre, mood, and prompt."),
    limit: z.number().int().min(1).max(50).default(10).describe("Max results (1-50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const like = `%${query}%`;
    const { data, error } = await supabase
      .from("tracks")
      .select(
        "id, title, computed_genre, mood, duration_seconds, play_count, likes_count, audio_url, cover_url, created_at",
      )
      .eq("is_public", true)
      .eq("status", "completed")
      .or(`title.ilike.${like},computed_genre.ilike.${like},mood.ilike.${like},prompt.ilike.${like}`)
      .order("play_count", { ascending: false })
      .limit(limit);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { tracks: data ?? [] },
    };
  },
});
