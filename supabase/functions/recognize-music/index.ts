import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecognitionRequest {
  // One of these is required
  audioBase64?: string;  // Base64 encoded audio file
  audioUrl?: string;     // URL to audio file
  // Optional
  returnData?: string;   // Comma-separated: apple_music, spotify, deezer, musicbrainz, napster, lyrics
}

interface AuddResult {
  status: string;
  result: {
    artist: string;
    title: string;
    album: string;
    release_date: string;
    label: string;
    timecode: string;
    song_link: string;
    apple_music?: any;
    spotify?: any;
    deezer?: any;
    lyrics?: any;
  } | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auddApiKey = Deno.env.get('AUDD_API_KEY');
    if (!auddApiKey) {
      console.error('AUDD_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AUDD_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { audioBase64, audioUrl, returnData } = await req.json() as RecognitionRequest;

    if (!audioBase64 && !audioUrl) {
      return new Response(
        JSON.stringify({ error: 'Either audioBase64 or audioUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Music recognition request:', {
      hasAudioBase64: !!audioBase64,
      audioUrl: audioUrl?.substring(0, 50),
      returnData
    });

    const formData = new FormData();
    formData.append('api_token', auddApiKey);
    
    // Add return metadata if specified
    if (returnData) {
      formData.append('return', returnData);
    } else {
      // Default: get spotify and apple_music data
      formData.append('return', 'spotify,apple_music');
    }

    if (audioUrl) {
      // Recognition by URL
      formData.append('url', audioUrl);
    } else if (audioBase64) {
      // Recognition by file
      // Convert base64 to blob
      const binaryString = atob(audioBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mp3' });
      formData.append('file', blob, 'audio.mp3');
    }

    console.log('Sending request to AuDD API...');
    const startTime = Date.now();

    const response = await fetch('https://api.audd.io/', {
      method: 'POST',
      body: formData,
    });

    const duration = Date.now() - startTime;
    console.log(`AuDD API response in ${duration}ms, status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AuDD API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Music recognition failed', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json() as AuddResult;
    console.log('AuDD API result:', JSON.stringify(result).substring(0, 500));

    if (result.status === 'error') {
      return new Response(
        JSON.stringify({ error: 'Recognition failed', details: result }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!result.result) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          found: false, 
          message: 'No music found in the audio' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return successful recognition
    return new Response(
      JSON.stringify({
        success: true,
        found: true,
        track: {
          artist: result.result.artist,
          title: result.result.title,
          album: result.result.album,
          releaseDate: result.result.release_date,
          label: result.result.label,
          timecode: result.result.timecode,
          songLink: result.result.song_link,
          appleMusic: result.result.apple_music,
          spotify: result.result.spotify,
          deezer: result.result.deezer,
          lyrics: result.result.lyrics,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recognize-music:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
