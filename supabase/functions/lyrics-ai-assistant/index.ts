import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LyricsRequest {
  action: 'complete' | 'improve' | 'rhyme' | 'translate' | 'generate_section' | 'suggest_tags';
  content: string;
  context?: {
    genre?: string;
    mood?: string;
    language?: string;
    style?: string;
    existingLyrics?: string;
    sectionType?: string;
  };
}

const systemPrompts: Record<string, string> = {
  complete: `You are a professional songwriter helping to complete lyrics. 
Continue the given lyrics naturally, maintaining the same style, rhythm, and theme.
Match the language of the input. Keep responses concise (2-4 lines).`,

  improve: `You are a professional lyrics editor.
Improve the given lyrics by enhancing word choice, rhythm, and emotional impact.
Keep the original meaning and structure. Respond only with the improved version.`,

  rhyme: `You are a rhyme expert for songwriting.
Suggest 5-8 rhyming words or short phrases for the given text.
Consider both perfect rhymes and near rhymes. Format as a comma-separated list.`,

  translate: `You are a professional music translator.
Translate the lyrics while preserving rhythm, rhyme schemes, and emotional tone.
Adapt cultural references appropriately. Maintain singability.`,

  generate_section: `You are a professional songwriter.
Generate a complete song section based on the given context and requirements.
Match the specified style and mood. Include natural line breaks.`,

  suggest_tags: `You are a music metadata expert.
Analyze the lyrics and suggest relevant tags for music generation.
Include genre, mood, instruments, tempo, and vocal style suggestions.
Format as a JSON array of strings, max 10 tags.`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, content, context } = await req.json() as LyricsRequest;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = systemPrompts[action] || systemPrompts.improve;
    
    let userMessage = content;
    if (context) {
      const contextParts = [];
      if (context.genre) contextParts.push(`Genre: ${context.genre}`);
      if (context.mood) contextParts.push(`Mood: ${context.mood}`);
      if (context.language) contextParts.push(`Language: ${context.language}`);
      if (context.style) contextParts.push(`Style: ${context.style}`);
      if (context.sectionType) contextParts.push(`Section type: ${context.sectionType}`);
      if (context.existingLyrics) contextParts.push(`Existing lyrics:\n${context.existingLyrics}`);
      
      if (contextParts.length > 0) {
        userMessage = `Context:\n${contextParts.join('\n')}\n\nContent:\n${content}`;
      }
    }

    console.log(`[lyrics-ai-assistant] Action: ${action}, content length: ${content.length}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Превышен лимит запросов. Попробуйте позже.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Требуется пополнение баланса AI.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('[lyrics-ai-assistant] AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || '';

    // Parse tags if action is suggest_tags
    let parsedResult = result;
    if (action === 'suggest_tags') {
      try {
        // Extract JSON array from response
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: split by commas
          parsedResult = result.split(',').map((t: string) => t.trim()).filter(Boolean);
        }
      } catch {
        parsedResult = result.split(',').map((t: string) => t.trim()).filter(Boolean);
      }
    }

    console.log(`[lyrics-ai-assistant] Success, result length: ${typeof parsedResult === 'string' ? parsedResult.length : parsedResult.length}`);

    return new Response(
      JSON.stringify({ result: parsedResult, action }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[lyrics-ai-assistant] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
