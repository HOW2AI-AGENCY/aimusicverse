import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authorize } from "../_shared/auth.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { buildImagePrompt } from "./prompt.ts";
import { generateCoverImage } from "./providers.ts";
import { persistCover, loadProjectContext } from "./storage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const __auth = await authorize(req);
  if (!__auth.ok) {
    return new Response(JSON.stringify({ error: __auth.error }), {
      status: __auth.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = getSupabaseClient();
    const { trackId, title, style, lyrics, mood, userId, projectId, customPrompt } = await req.json();

    if (!trackId) {
      throw new Error("trackId is required");
    }

    console.log(`🎨 Generating MusicVerse cover for track: ${trackId}`);
    console.log(`📋 Title: ${title}, Style: ${style}, ProjectId: ${projectId || "none"}`);
    console.log(`📝 Custom prompt: ${customPrompt ? "yes" : "no"}`);

    const projectContext = customPrompt ? {} : await loadProjectContext(supabase, trackId, projectId);

    const imagePrompt = buildImagePrompt({
      title,
      style,
      lyrics,
      mood,
      customPrompt,
      projectContext,
    });

    // Simplified prompt used only if Replicate fallback kicks in.
    const fluxPrompt = `Album cover art, square format 1:1, no text, no watermarks, no logos, no letters. ${title || "Music track"}. Style: ${style || "modern music"}. Professional digital art for streaming platforms, high quality, distinctive and memorable.`;

    const generated = await generateCoverImage(imagePrompt, fluxPrompt);
    console.log(`✅ Cover generated via ${generated.provider}, uploading to storage...`);

    const publicUrl = await persistCover({
      supabase,
      trackId,
      userId,
      binaryData: generated.binaryData,
      provider: generated.provider,
      model: generated.model,
      promptUsed: generated.promptUsed,
      audit: {
        title,
        style,
        mood,
        projectId,
        customPrompt: !!customPrompt,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        coverUrl: publicUrl,
        trackId,
        provider: generated.provider,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("❌ Error generating cover:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Cover generation failed",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
