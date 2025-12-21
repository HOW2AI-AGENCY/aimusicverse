/**
 * Edge Function: separate-reference-stems
 * 
 * Separates stems from reference_audio using Replicate Demucs
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SeparationRequest {
  reference_id: string;
  user_id: string;
  telegram_chat_id?: number;
  telegram_message_id?: number;
  mode?: 'simple' | 'detailed'; // simple = 2 stems, detailed = 4+ stems
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not set");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const replicate = new Replicate({ auth: REPLICATE_API_KEY });

    const body: SeparationRequest = await req.json();
    const { reference_id, user_id, telegram_chat_id, telegram_message_id, mode = 'simple' } = body;

    if (!reference_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "reference_id and user_id are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get reference audio
    const { data: refAudio, error: refError } = await supabase
      .from("reference_audio")
      .select("id, file_url, file_name, stems_status")
      .eq("id", reference_id)
      .eq("user_id", user_id)
      .single();

    if (refError || !refAudio) {
      return new Response(
        JSON.stringify({ error: "Reference audio not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    if (!refAudio.file_url) {
      return new Response(
        JSON.stringify({ error: "Reference audio has no file URL" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check if stems already processing/completed
    if (refAudio.stems_status === 'processing') {
      return new Response(
        JSON.stringify({ error: "Stem separation already in progress", status: 'processing' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    if (refAudio.stems_status === 'completed') {
      return new Response(
        JSON.stringify({ message: "Stems already separated", status: 'completed' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Update status to processing
    await supabase
      .from("reference_audio")
      .update({ stems_status: 'processing' })
      .eq("id", reference_id);

    console.log(`Starting stem separation for reference ${reference_id} with mode ${mode}`);

    // Choose model based on mode
    const model = mode === 'detailed' 
      ? "cjwbw/demucs:25a173108cff36ef9f80f854c162d01df9e6528be175794b81b7a0f3b7571ebe"
      : "cjwbw/demucs:25a173108cff36ef9f80f854c162d01df9e6528be175794b81b7a0f3b7571ebe";

    // Run Demucs model
    const prediction = await replicate.run(model, {
      input: {
        audio: refAudio.file_url,
        stems: mode === 'simple' ? 2 : 4, // 2 = vocals+accompaniment, 4 = vocals+drums+bass+other
      },
    });

    console.log("Demucs prediction result:", prediction);

    // Parse results - Demucs returns URLs for each stem
    let stemUrls: Record<string, string> = {};
    
    if (typeof prediction === 'object' && prediction !== null) {
      const pred = prediction as Record<string, unknown>;
      
      // Demucs returns stems as URLs
      if (pred.vocals) stemUrls.vocal_stem_url = pred.vocals as string;
      if (pred.accompaniment) stemUrls.instrumental_stem_url = pred.accompaniment as string;
      if (pred.drums) stemUrls.drums_stem_url = pred.drums as string;
      if (pred.bass) stemUrls.bass_stem_url = pred.bass as string;
      if (pred.other) stemUrls.other_stem_url = pred.other as string;
      
      // Some models return 'no_vocals' instead of 'accompaniment'
      if (pred.no_vocals && !stemUrls.instrumental_stem_url) {
        stemUrls.instrumental_stem_url = pred.no_vocals as string;
      }
    }

    // Update reference_audio with stem URLs
    const { error: updateError } = await supabase
      .from("reference_audio")
      .update({
        ...stemUrls,
        stems_status: 'completed',
      })
      .eq("id", reference_id);

    if (updateError) {
      console.error("Failed to update stems:", updateError);
      throw updateError;
    }

    // Send Telegram notification if chat_id provided
    if (telegram_chat_id) {
      try {
        const stemCount = Object.keys(stemUrls).length;
        const stemTypes = Object.keys(stemUrls)
          .map(k => k.replace('_stem_url', '').replace('_', ' '))
          .join(', ');

        await supabase.functions.invoke('send-telegram-notification', {
          body: {
            chat_id: telegram_chat_id,
            message: `✅ *Стемы готовы\\!*\n\n` +
              `📁 ${refAudio.file_name?.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&') || 'Аудио'}\n` +
              `🎛️ Разделено на ${stemCount} стемов:\n` +
              `_${stemTypes}_\n\n` +
              `Используйте стемы как референс для генерации:`,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🎤 Вокал → Кавер', callback_data: `stem_use_vocal_${reference_id}` },
                  { text: '🎸 Инструментал', callback_data: `stem_use_instrumental_${reference_id}` }
                ],
                [
                  { text: '⬇️ Скачать стемы', callback_data: `stem_download_${reference_id}` }
                ],
                [
                  { text: '📱 Открыть в приложении', web_app: { url: `${SUPABASE_URL.replace('.supabase.co', '')}.lovable.app?startapp=cloud` } }
                ]
              ]
            },
            message_id: telegram_message_id, // Edit existing message if provided
          },
        });
      } catch (notifError) {
        console.error("Failed to send Telegram notification:", notifError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reference_id,
        stems: stemUrls,
        stem_count: Object.keys(stemUrls).length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Stem separation error:", error);

    // Try to update status to failed
    try {
      const body = await req.clone().json();
      if (body.reference_id) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabase
          .from("reference_audio")
          .update({ stems_status: 'failed' })
          .eq("id", body.reference_id);
      }
    } catch (e) {
      console.error("Failed to update status to failed:", e);
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
