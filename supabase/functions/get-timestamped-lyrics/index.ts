import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// Note: createClient import removed - not used in this function

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskId, audioId } = await req.json();

    if (!taskId || !audioId) {
      return new Response(
        JSON.stringify({ error: 'taskId and audioId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sunoApiKey = Deno.env.get('SUNO_API_KEY');
    if (!sunoApiKey) {
      throw new Error('SUNO_API_KEY not configured');
    }

    console.log('Fetching timestamped lyrics:', { taskId, audioId });

    const response = await fetch('https://api.sunoapi.org/api/v1/generate/get-timestamped-lyrics', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskId,
        audioId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Suno API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch timestamped lyrics', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    if (data.code !== 200) {
      console.error('Suno API returned error:', data);
      return new Response(
        JSON.stringify({ error: data.msg || 'Failed to fetch lyrics' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully fetched timestamped lyrics');

    return new Response(
      JSON.stringify(data.data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-timestamped-lyrics:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
