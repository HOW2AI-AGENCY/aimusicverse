import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';
import Replicate from "https://esm.sh/replicate@0.25.2";
import { createLogger } from "../_shared/logger.ts";

const logger = createLogger('transcribe-lyrics');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Transcribe lyrics from audio using Audio Flamingo 3 and Whisper
 * 
 * This function:
 * 1. First uses Audio Flamingo 3 to check if the audio has vocals
 * 2. If vocals are detected, uses Whisper to transcribe the lyrics
 * 3. Returns the transcribed lyrics along with vocal detection info
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY not configured');
    }

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });
    
    const supabase = getSupabaseClient();

    const { audio_url, track_id, analyze_style = true } = await req.json();
    logger.info('Transcribing lyrics', { audio_url, track_id, analyze_style });

    if (!audio_url) {
      throw new Error('audio_url is required');
    }

    // Step 1: Use Audio Flamingo 3 to detect vocals and get style analysis
    const flamingoPrompt = `Analyze this audio track. 
Answer these questions in EXACTLY this format (use these exact labels):

VOCALS: YES or NO
LANGUAGE: the language of vocals, or N/A if no vocals
GENRE: the music genre
MOOD: the mood/emotion
VOCAL_STYLE: describe the vocals (gender, style) or N/A

Be very careful - if you hear ANY singing or rapping, answer VOCALS: YES`;

    logger.info('Running Audio Flamingo analysis...');
    
    const flamingoOutput = await replicate.run(
      "zsxkib/audio-flamingo-3:2856d42f07154766b0cc0f3554fb425d7c3422ae77269264fbe0c983ac759fef",
      {
        input: {
          audio: audio_url,
          prompt: 'Analyze this audio for vocals and style',
          system_prompt: flamingoPrompt,
          enable_thinking: false,
          temperature: 0.1,
          max_length: 512,
        },
      }
    ) as string;

    logger.info('Flamingo analysis complete', { response: flamingoOutput });

    // More flexible parsing - look for various indicators of vocals
    const outputLower = flamingoOutput.toLowerCase();
    
    // Check multiple patterns for vocal detection
    let hasVocals = false;
    
    // Pattern 1: explicit VOCALS: YES
    if (/vocals?:\s*yes/i.test(flamingoOutput)) {
      hasVocals = true;
    }
    // Pattern 2: "has vocals" anywhere
    else if (/has vocals|contains vocals|with vocals|includes vocals/i.test(flamingoOutput)) {
      hasVocals = true;
    }
    // Pattern 3: mentions singing/rapping/voice
    else if (/singing|singer|vocalist|rapper|rapping|vocal performance|voice|lyrics/i.test(flamingoOutput)) {
      hasVocals = true;
    }
    // Pattern 4: NOT instrumental
    else if (/not instrumental|isn't instrumental|has vocals/i.test(flamingoOutput)) {
      hasVocals = true;
    }
    // Pattern 5: explicit VOCALS: NO or "instrumental"
    else if (/vocals?:\s*no|purely instrumental|no vocals|without vocals|instrumental track/i.test(flamingoOutput)) {
      hasVocals = false;
    }
    // Default: if we detect any vocal-related terms, assume vocals
    else if (/male|female|alto|soprano|tenor|bass|baritone|voice/i.test(flamingoOutput)) {
      hasVocals = true;
    }
    
    logger.info('Vocal detection result', { hasVocals, rawOutput: flamingoOutput.substring(0, 200) });
    
    const languageMatch = flamingoOutput.match(/LANGUAGE:\s*([^\n]+)/i) || 
                          flamingoOutput.match(/language[:\s]+([a-zA-Zа-яА-Я]+)/i);
    const language = languageMatch?.[1]?.trim() || 'auto';
    
    const genreMatch = flamingoOutput.match(/GENRE:\s*([^\n]+)/i) ||
                       flamingoOutput.match(/genre[:\s]+([^\n,]+)/i);
    const genre = genreMatch?.[1]?.trim() || null;
    
    const moodMatch = flamingoOutput.match(/MOOD:\s*([^\n]+)/i) ||
                      flamingoOutput.match(/mood[:\s]+([^\n,]+)/i);
    const mood = moodMatch?.[1]?.trim() || null;
    
    const vocalStyleMatch = flamingoOutput.match(/VOCAL_STYLE:\s*([^\n]+)/i) ||
                            flamingoOutput.match(/vocal style[:\s]+([^\n]+)/i);
    const vocalStyle = vocalStyleMatch?.[1]?.trim() || null;

    let lyrics: string | null = null;
    let transcriptionMethod: string | null = null;

    // Step 2: If vocals detected, transcribe using Whisper
    if (hasVocals) {
      logger.info('Vocals detected, starting transcription...', { language });
      
      try {
        // Use openai/whisper for transcription
        const whisperOutput = await replicate.run(
          "openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2",
          {
            input: {
              audio: audio_url,
              model: "large-v3",
              language: language !== 'unknown' && language !== 'N/A' ? language.toLowerCase() : undefined,
              translate: false,
              temperature: 0,
              transcription: "plain text",
              suppress_tokens: "-1",
              logprob_threshold: -1,
              no_speech_threshold: 0.6,
              condition_on_previous_text: true,
              compression_ratio_threshold: 2.4,
            },
          }
        ) as { transcription?: string; text?: string };

        lyrics = whisperOutput?.transcription || whisperOutput?.text || null;
        transcriptionMethod = 'whisper-large-v3';
        
        logger.info('Whisper transcription complete', { 
          lyricsLength: lyrics?.length || 0 
        });
      } catch (whisperError) {
        logger.error('Whisper transcription failed', whisperError);
        
        // Fallback: Try to get lyrics from Audio Flamingo
        try {
          logger.info('Trying Audio Flamingo for lyrics extraction...');
          
          const lyricsOutput = await replicate.run(
            "zsxkib/audio-flamingo-3:2856d42f07154766b0cc0f3554fb425d7c3422ae77269264fbe0c983ac759fef",
            {
              input: {
                audio: audio_url,
                prompt: 'What are the lyrics?',
                system_prompt: 'Listen carefully to the audio and transcribe ALL the lyrics/words sung in the song. Write only the lyrics, nothing else. If you cannot understand some words, write [unclear].',
                enable_thinking: true,
                temperature: 0.1,
                max_length: 2048,
              },
            }
          ) as string;
          
          lyrics = lyricsOutput;
          transcriptionMethod = 'audio-flamingo-3';
          
          logger.info('Audio Flamingo lyrics extraction complete');
        } catch (flamingoLyricsError) {
          logger.error('Audio Flamingo lyrics extraction failed', flamingoLyricsError);
        }
      }
    } else {
      logger.info('No vocals detected in audio');
    }

    // Update track if track_id provided
    if (track_id && (lyrics || genre || mood)) {
      const updates: Record<string, unknown> = {};
      
      if (lyrics) {
        updates.lyrics = lyrics;
      }
      if (!hasVocals) {
        updates.is_instrumental = true;
        updates.has_vocals = false;
      } else {
        updates.has_vocals = true;
        updates.is_instrumental = false;
      }
      
      const { error: updateError } = await supabase
        .from('tracks')
        .update(updates)
        .eq('id', track_id);
      
      if (updateError) {
        logger.error('Error updating track', updateError);
      } else {
        logger.info('Track updated with lyrics', { trackId: track_id });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        has_vocals: hasVocals,
        language,
        lyrics,
        transcription_method: transcriptionMethod,
        analysis: {
          genre,
          mood,
          vocal_style: vocalStyle,
          full_response: flamingoOutput,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    logger.error('Error in transcribe-lyrics', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
