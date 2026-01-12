/**
 * Edge Function: separate-reference-stems
 * 
 * Separates stems from reference_audio using Replicate Demucs
 * Downloads stems and stores them in Supabase Storage
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";
import { getSupabaseClient } from "../_shared/supabase-client.ts";

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

async function downloadAndUploadStem(
  supabase: any,
  stemUrl: string,
  userId: string,
  referenceId: string,
  stemType: string
): Promise<string | null> {
  try {
    console.log(`Downloading stem ${stemType} from ${stemUrl}`);
    
    // Download the stem file
    const response = await fetch(stemUrl);
    if (!response.ok) {
      console.error(`Failed to download ${stemType}: ${response.status}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'audio/wav';
    
    // Determine file extension
    const ext = contentType.includes('mp3') ? 'mp3' : 'wav';
    const storagePath = `${userId}/${referenceId}/${stemType}.${ext}`;
    
    console.log(`Uploading ${stemType} to storage: ${storagePath}`);
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('stems')
      .upload(storagePath, arrayBuffer, {
        contentType,
        upsert: true,
      });
    
    if (uploadError) {
      console.error(`Failed to upload ${stemType}:`, uploadError);
      return null;
    }
    
    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('stems')
      .getPublicUrl(storagePath);
    
    console.log(`Uploaded ${stemType}: ${publicUrl.publicUrl}`);
    return publicUrl.publicUrl;
  } catch (error) {
    console.error(`Error processing ${stemType}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");

    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not set");
    }

    const supabase = getSupabaseClient();
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

    // Run Demucs model - htdemucs for 4-stem, htdemucs_6s for 6-stem
    const model = "cjwbw/demucs:25a173108cff36ef9f80f854c162d01df9e6528be175794b81b7a0f3b7571ebe";
    
    const prediction = await replicate.run(model, {
      input: {
        audio: refAudio.file_url,
        stems: mode === 'simple' ? 2 : 4, // 2 = vocals+accompaniment, 4 = vocals+drums+bass+other
      },
    });

    console.log("Demucs prediction result:", prediction);

    // Parse results and upload to storage
    const storedStems: Record<string, string> = {};
    
    if (typeof prediction === 'object' && prediction !== null) {
      const pred = prediction as Record<string, unknown>;
      
      // Map Demucs output to our stem types and upload to storage
      const stemMappings: [string, string][] = [
        ['vocals', 'vocal_stem_url'],
        ['accompaniment', 'instrumental_stem_url'],
        ['no_vocals', 'instrumental_stem_url'],
        ['drums', 'drums_stem_url'],
        ['bass', 'bass_stem_url'],
        ['other', 'other_stem_url'],
      ];
      
      for (const [demucsKey, dbKey] of stemMappings) {
        const stemUrl = pred[demucsKey] as string | undefined;
        if (stemUrl && !storedStems[dbKey]) {
          const storedUrl = await downloadAndUploadStem(
            supabase,
            stemUrl,
            user_id,
            reference_id,
            demucsKey
          );
          if (storedUrl) {
            storedStems[dbKey] = storedUrl;
          }
        }
      }
    }

    console.log("Stored stems:", storedStems);

    // Update reference_audio with storage URLs
    const { error: updateError } = await supabase
      .from("reference_audio")
      .update({
        ...storedStems,
        stems_status: Object.keys(storedStems).length > 0 ? 'completed' : 'failed',
      })
      .eq("id", reference_id);

    if (updateError) {
      console.error("Failed to update stems:", updateError);
      throw updateError;
    }

    // Send Telegram notification if chat_id provided
    if (telegram_chat_id) {
      try {
        const stemCount = Object.keys(storedStems).length;
        const stemTypes = Object.keys(storedStems)
          .map(k => k.replace('_stem_url', '').replace('_', ' '))
          .join(', ');

        const BOT_URL = Deno.env.get("TELEGRAM_BOT_MINIAPP_URL") || "https://ygmvthybdrqymfsqifmj.lovable.app";

        await supabase.functions.invoke('send-telegram-notification', {
          body: {
            chat_id: telegram_chat_id,
            message: `✅ *Стемы готовы\\!*\n\n` +
              `📁 ${refAudio.file_name?.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&') || 'Аудио'}\n` +
              `🎛️ Разделено на ${stemCount} стемов:\n` +
              `_${stemTypes}_`,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📱 Открыть в приложении', web_app: { url: `${BOT_URL}/reference/${reference_id}` } }
                ]
              ]
            },
            message_id: telegram_message_id,
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
        stems: storedStems,
        stem_count: Object.keys(storedStems).length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Stem separation error:", error);

    // Try to update status to failed
    try {
      const body = await req.clone().json();
      if (body.reference_id) {
        const supabase = getSupabaseClient();
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
