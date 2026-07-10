import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "switch_active_version",
  title: "Switch active track version",
  description:
    "Set which A/B version of a track is active/primary. Updates both tracks.active_version_id and track_versions.is_primary. Only works on tracks owned by the signed-in user (RLS).",
  inputSchema: {
    track_id: z.string().uuid().describe("Track UUID (must be owned by the user)."),
    version_id: z.string().uuid().describe("Version UUID to make active/primary."),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: false, openWorldHint: false },
  handler: async ({ track_id, version_id }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Verify version belongs to this track
    const { data: version, error: verErr } = await supabase
      .from("track_versions")
      .select("id, track_id")
      .eq("id", version_id)
      .eq("track_id", track_id)
      .maybeSingle();
    if (verErr) return { content: [{ type: "text", text: verErr.message }], isError: true };
    if (!version) {
      return { content: [{ type: "text", text: "Version not found for this track." }], isError: true };
    }

    // Clear is_primary from other versions of this track
    const { error: clearErr } = await supabase
      .from("track_versions")
      .update({ is_primary: false })
      .eq("track_id", track_id)
      .neq("id", version_id);
    if (clearErr) return { content: [{ type: "text", text: clearErr.message }], isError: true };

    // Set is_primary on target
    const { error: setErr } = await supabase
      .from("track_versions")
      .update({ is_primary: true })
      .eq("id", version_id);
    if (setErr) return { content: [{ type: "text", text: setErr.message }], isError: true };

    // Update parent track's active_version_id
    const { error: trackErr } = await supabase
      .from("tracks")
      .update({ active_version_id: version_id })
      .eq("id", track_id);
    if (trackErr) return { content: [{ type: "text", text: trackErr.message }], isError: true };

    return {
      content: [{ type: "text", text: `Set version ${version_id} as active for track ${track_id}` }],
      structuredContent: { track_id, active_version_id: version_id },
    };
  },
});
