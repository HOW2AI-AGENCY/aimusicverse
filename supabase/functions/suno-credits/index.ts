import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sunoApiKey = Deno.env.get('SUNO_API_KEY');

    if (!sunoApiKey) {
      throw new Error('SUNO_API_KEY not configured');
    }

    console.log('Fetching SunoAPI credits');

    const sunoResponse = await fetch('https://api.sunoapi.org/api/v1/generate/credit', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
      },
    });

    if (!sunoResponse.ok) {
      const errorText = await sunoResponse.text();
      console.error('SunoAPI error:', sunoResponse.status, errorText);
      throw new Error(`SunoAPI error: ${sunoResponse.status} - ${errorText}`);
    }

    const sunoData = await sunoResponse.json();

    if (sunoData.code !== 200) {
      throw new Error(sunoData.msg || 'Failed to fetch credits');
    }

    const credits = sunoData.data;
    console.log('SunoAPI credits:', credits);

    return new Response(
      JSON.stringify({ 
        success: true,
        credits,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in suno-credits:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
