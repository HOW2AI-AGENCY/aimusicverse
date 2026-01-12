import { getSupabaseClient } from '../_shared/supabase-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DownloadRequest {
  trackId: string;
  audioUrl: string;
  coverUrl?: string;
  metadata?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { trackId, audioUrl, coverUrl, metadata } = await req.json() as DownloadRequest;

    console.log('Downloading track:', trackId);

    // Download audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.statusText}`);
    }

    const audioBlob = await audioResponse.arrayBuffer();
    const audioFileName = `${user.id}/${trackId}/audio.mp3`;

    // Upload audio to Supabase Storage
    const { data: audioData, error: audioError } = await supabase.storage
      .from('project-assets')
      .upload(audioFileName, audioBlob, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (audioError) {
      throw new Error(`Failed to upload audio: ${audioError.message}`);
    }

    console.log('Audio uploaded:', audioData.path);

    // Get public URL for audio
    const { data: { publicUrl: audioPublicUrl } } = supabase.storage
      .from('project-assets')
      .getPublicUrl(audioFileName);

    // Download and upload cover image if provided
    let coverPublicUrl = null;
    if (coverUrl) {
      try {
        const coverResponse = await fetch(coverUrl);
        if (coverResponse.ok) {
          const coverBlob = await coverResponse.arrayBuffer();
          const coverFileName = `${user.id}/${trackId}/cover.jpg`;

          const { data: coverData, error: coverError } = await supabase.storage
            .from('project-assets')
            .upload(coverFileName, coverBlob, {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (!coverError) {
            const { data: { publicUrl } } = supabase.storage
              .from('project-assets')
              .getPublicUrl(coverFileName);
            coverPublicUrl = publicUrl;
            console.log('Cover uploaded:', coverData.path);
          }
        }
      } catch (error) {
        console.error('Failed to download/upload cover:', error);
        // Continue without cover
      }
    }

    // Update track with new URLs
    const { error: updateError } = await supabase
      .from('tracks')
      .update({
        audio_url: audioPublicUrl,
        cover_url: coverPublicUrl || coverUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', trackId)
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error(`Failed to update track: ${updateError.message}`);
    }

    // Log download event
    await supabase.from('track_analytics').insert({
      track_id: trackId,
      user_id: user.id,
      event_type: 'download',
      metadata: {
        source: 'auto_download',
        original_audio_url: audioUrl,
        original_cover_url: coverUrl,
        ...metadata,
      },
    });

    // Create initial version
    const { error: versionError } = await supabase
      .from('track_versions')
      .insert({
        track_id: trackId,
        audio_url: audioPublicUrl,
        cover_url: coverPublicUrl || coverUrl,
        version_type: 'initial',
        is_primary: true,
        metadata: {
          downloaded_at: new Date().toISOString(),
          original_source: 'suno_api',
          ...metadata,
        },
      });

    if (versionError) {
      console.error('Failed to create version:', versionError);
    }

    console.log('Track download completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        audioUrl: audioPublicUrl,
        coverUrl: coverPublicUrl,
        trackId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error downloading track:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
