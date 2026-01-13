/**
 * Suno Generate - Legacy Proxy
 * 
 * DEPRECATED: This function is a proxy to suno-music-generate for backwards compatibility.
 * New code should use suno-music-generate directly.
 * 
 * Maps legacy action-based API to modern suno-music-generate API.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = getSupabaseClient();

    // Forward to suno-music-generate
    const body = await req.json();
    const { 
      action,
      trackId,
      prompt,
      lyrics,
      style,
      title,
      makeInstrumental = false,
      extendAudioUrl,
      continueAt,
      coverAudioUrl,
      stemMode,
      defaultParamFlag,
    } = body;

    console.log(`[suno-generate] Legacy proxy - action: ${action}`);

    // Map legacy actions to modern endpoints
    let targetFunction = 'suno-music-generate';
    let mappedBody: any = {};

    switch (action) {
      case 'generate':
        mappedBody = {
          mode: lyrics ? 'custom' : 'simple',
          prompt: lyrics || prompt,
          style: style,
          title: title,
          instrumental: makeInstrumental,
        };
        break;

      case 'extend':
        // For extend with audioUrl (from reference audio), use suno-extend-audio
        // For extend with trackId (from existing track), use suno-music-extend
        if (extendAudioUrl && !trackId) {
          targetFunction = 'suno-extend-audio';
          mappedBody = {
            audioUrl: extendAudioUrl,
            continueAt: continueAt,
            prompt: prompt,
            style: style,
            title: title,
            defaultParamFlag: defaultParamFlag ?? true, // Default to using original params
          };
        } else {
          targetFunction = 'suno-music-extend';
          mappedBody = {
            sourceTrackId: trackId,
            continueAt: continueAt,
            prompt: prompt,
            style: style,
            title: title,
            defaultParamFlag: false,
          };
        }
        break;

      case 'cover':
        targetFunction = 'suno-remix';
        mappedBody = {
          audioUrl: coverAudioUrl,
          prompt: prompt,
          style: style,
          title: title,
          instrumental: makeInstrumental,
          audioWeight: body.audioWeight ?? 0.5, // Pass through audioWeight
        };
        break;

      case 'stems':
        targetFunction = 'suno-separate-vocals';
        mappedBody = {
          audioUrl: coverAudioUrl,
          mode: stemMode || '4_stems',
        };
        break;

      case 'add_vocals':
        targetFunction = 'suno-add-vocals';
        mappedBody = {
          audioUrl: coverAudioUrl,
          lyrics: lyrics,
        };
        break;

      default:
        throw new Error(`Unknown action: ${action}. Use suno-music-generate directly.`);
    }

    console.log(`[suno-generate] Forwarding to ${targetFunction}`, { hasAudioUrl: !!extendAudioUrl, hasTrackId: !!trackId });

    // Forward the request with original auth header
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const response = await fetch(`${supabaseUrl}/functions/v1/${targetFunction}`, {
      method: 'POST',
      headers: {
        'Authorization': req.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
      },
      body: JSON.stringify(mappedBody),
    });

    const data = await response.json();

    // Map response back to legacy format if needed
    if (data.success && data.trackId) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: data,
          taskId: data.taskId || data.sunoTaskId,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { 
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('[suno-generate] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
