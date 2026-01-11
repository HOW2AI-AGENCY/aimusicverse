import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseClient } from "../telegram-bot/core/supabase-client.ts";

interface StemInput {
  audioUrl: string;
  volume: number;
  pan?: number;
  solo?: boolean;
}

interface MergeStemsRequest {
  stems: StemInput[];
  masterVolume?: number;
  trackId?: string;
  versionLabel?: string;
  projectId?: string;
  format?: 'wav' | 'mp3';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();

    const { stems, masterVolume = 1.0, trackId, versionLabel, projectId, format = 'wav' } = await req.json() as MergeStemsRequest;

    if (!stems || stems.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No stems provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[merge-stems] Merging ${stems.length} stems, masterVolume: ${masterVolume}`);

    // Filter stems based on solo state
    const soloedStems = stems.filter(s => s.solo);
    const stemsToMix = soloedStems.length > 0 ? soloedStems : stems;

    // For now, we'll use a simple approach:
    // If only one stem (after filtering), just return its URL with volume adjustment
    // For multiple stems, we would need FFmpeg or similar (future enhancement)
    
    if (stemsToMix.length === 1) {
      const stem = stemsToMix[0];
      console.log(`[merge-stems] Single stem, returning with volume ${stem.volume * masterVolume}`);
      
      // For a single stem, we can just return the URL
      // In a real implementation, you'd apply volume normalization
      return new Response(
        JSON.stringify({ 
          success: true, 
          audioUrl: stem.audioUrl,
          format,
          stemsCount: 1,
          note: 'Single stem returned as-is. Multi-stem mixing requires FFmpeg.'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Multiple stems - for now, return the first one with a note
    // Full implementation would require FFmpeg/Tone.js processing
    console.log(`[merge-stems] Multiple stems (${stemsToMix.length}) - full mixing not yet implemented`);
    
    // Find the stem with highest volume as "primary"
    const primaryStem = stemsToMix.reduce((a, b) => a.volume > b.volume ? a : b);

    // Log the merge request for future processing
    if (projectId) {
      await supabase.from('api_usage_logs').insert({
        service: 'merge-stems',
        endpoint: '/merge-stems',
        request_body: { 
          stems: stemsToMix.map(s => ({ url: s.audioUrl.slice(0, 50), volume: s.volume })),
          masterVolume,
          trackId,
          projectId,
        },
        response_status: 200,
        method: 'POST',
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        audioUrl: primaryStem.audioUrl,
        format,
        stemsCount: stemsToMix.length,
        note: 'Multi-stem mixing returns primary stem. Full mixing requires FFmpeg backend.',
        volumes: stemsToMix.map(s => ({ volume: s.volume, pan: s.pan }))
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[merge-stems] Error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
