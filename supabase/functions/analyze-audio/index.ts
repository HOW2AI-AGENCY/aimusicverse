import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const falApiKey = Deno.env.get('FAL_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!falApiKey) {
      throw new Error('FAL_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { audioUrl, trackId, analysisType = 'full' } = await req.json();

    if (!audioUrl) {
      throw new Error('audioUrl is required');
    }

    console.log(`Analyzing audio for user: ${user.id}, type: ${analysisType}`);

    let transcription = null;
    let styleAnalysis = null;

    // Step 1: Transcribe lyrics using fal.ai/wizper
    if (analysisType === 'full' || analysisType === 'lyrics') {
      console.log('Transcribing audio with fal.ai/wizper...');
      const transcriptionResponse = await fetch('https://fal.run/fal-ai/wizper', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${falApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          task: 'transcribe',
          language: 'auto',
          chunk_level: 'segment',
          version: '3',
        }),
      });

      if (!transcriptionResponse.ok) {
        const errorText = await transcriptionResponse.text();
        console.error('Fal.ai transcription error:', errorText);
      } else {
        const transcriptionData = await transcriptionResponse.json();
        transcription = {
          text: transcriptionData.text || '',
          chunks: transcriptionData.chunks || [],
          language: transcriptionData.language || 'unknown',
        };
      }
    }

    // Step 2: Analyze style, genre, mood using Lovable AI
    if (analysisType === 'full' || analysisType === 'style') {
      console.log('Analyzing style with Lovable AI...');
      
      const analysisPrompt = `Analyze this music track and provide a detailed analysis in JSON format.

${transcription ? `Lyrics:\n${transcription.text}\n\n` : ''}

Provide the following analysis:
1. Genre(s) - specific genres and subgenres
2. Style - detailed description of musical style
3. Mood/Emotion - emotional characteristics
4. BPM estimate - approximate beats per minute
5. Key signature - musical key if identifiable
6. Instruments - prominent instruments used
7. Vocal characteristics - if vocals present
8. Production quality - assessment of mixing/mastering
9. Tags - 5-10 descriptive tags for music generation

Return ONLY valid JSON in this exact format:
{
  "genre": ["genre1", "genre2"],
  "style": "detailed style description",
  "mood": ["mood1", "mood2"],
  "bpm": 120,
  "key": "C major",
  "instruments": ["instrument1", "instrument2"],
  "vocals": "description or null",
  "production": "assessment",
  "tags": ["tag1", "tag2", "tag3"]
}`;

      const styleResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: analysisPrompt,
            },
          ],
          temperature: 0.3,
        }),
      });

      if (!styleResponse.ok) {
        const errorText = await styleResponse.text();
        console.error('Lovable AI analysis error:', errorText);
      } else {
        const styleData = await styleResponse.json();
        const analysisText = styleData.choices?.[0]?.message?.content || '{}';
        
        try {
          // Extract JSON from markdown code blocks if present
          const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                           analysisText.match(/```\s*([\s\S]*?)\s*```/);
          const jsonText = jsonMatch ? jsonMatch[1] : analysisText;
          styleAnalysis = JSON.parse(jsonText);
        } catch (e) {
          console.error('Failed to parse style analysis JSON:', e);
          styleAnalysis = { raw: analysisText };
        }
      }
    }

    // Step 3: Update track if trackId provided
    if (trackId) {
      const updates: any = {};
      
      if (transcription) {
        updates.lyrics = transcription.text;
      }
      
      if (styleAnalysis) {
        updates.style = styleAnalysis.style;
        updates.tags = styleAnalysis.tags?.join(', ');
        
        // Update metadata field
        const { data: currentTrack } = await supabase
          .from('tracks')
          .select('metadata')
          .eq('id', trackId)
          .single();

        const currentMetadata = currentTrack?.metadata || {};
        updates.metadata = {
          ...currentMetadata,
          analysis: {
            genre: styleAnalysis.genre,
            mood: styleAnalysis.mood,
            bpm: styleAnalysis.bpm,
            key: styleAnalysis.key,
            instruments: styleAnalysis.instruments,
            vocals: styleAnalysis.vocals,
            production: styleAnalysis.production,
          },
        };
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('tracks')
          .update(updates)
          .eq('id', trackId);

        // Log the analysis
        await supabase.from('track_change_log').insert({
          track_id: trackId,
          user_id: user.id,
          change_type: 'ai_analyze',
          changed_by: 'ai',
          ai_model_used: 'fal_wizper+gemini_2.5_flash',
          metadata: {
            analysis_type: analysisType,
            transcription_success: !!transcription,
            style_analysis_success: !!styleAnalysis,
          },
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        transcription,
        styleAnalysis,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in analyze-audio:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
