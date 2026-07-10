import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "generate_track",
  title: "Generate a new music track",
  description:
    "Start an AI music generation job using Suno. Returns a task_id immediately; poll `get_generation_status` for completion. Consumes credits from the signed-in user's balance.",
  inputSchema: {
    prompt: z.string().trim().min(1).max(2000).describe("Musical idea, lyrics, or description to generate from."),
    style: z.string().trim().max(200).optional().describe("Optional style tags, e.g. 'lo-fi, chill, jazz'."),
    title: z.string().trim().max(120).optional().describe("Optional track title."),
    is_instrumental: z.boolean().default(false).describe("If true, generate instrumental (no vocals)."),
    model: z.enum(["V3_5", "V4", "V4_5", "V5"]).default("V5").describe("Suno model version."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, destructiveHint: false, openWorldHint: true },
  handler: async ({ prompt, style, title, is_instrumental, model }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }

    const supabaseUrl = process.env.SUPABASE_URL!;
    const token = ctx.getToken();

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/suno-music-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: process.env.SUPABASE_PUBLISHABLE_KEY!,
        },
        body: JSON.stringify({
          prompt,
          style: style ?? "",
          title: title ?? "",
          instrumental: is_instrumental,
          model,
          customMode: !!style,
        }),
      });

      const bodyText = await response.text();
      if (!response.ok) {
        return {
          content: [{ type: "text", text: `Generation failed [${response.status}]: ${bodyText}` }],
          isError: true,
        };
      }

      let body: Record<string, unknown> = {};
      try {
        body = JSON.parse(bodyText);
      } catch {
        body = { raw: bodyText };
      }

      const taskId =
        (body.taskId as string) ||
        (body.task_id as string) ||
        ((body.data as Record<string, unknown> | undefined)?.taskId as string) ||
        null;

      return {
        content: [
          {
            type: "text",
            text: taskId
              ? `Generation started. task_id=${taskId}. Poll get_generation_status to check progress (typically 30–120s).`
              : `Generation submitted. Response: ${bodyText.slice(0, 500)}`,
          },
        ],
        structuredContent: { task_id: taskId, status: "pending", raw: body },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { content: [{ type: "text", text: `Network error: ${msg}` }], isError: true };
    }
  },
});
