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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
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

    const { 
      action, // 'concept', 'tracklist', 'collaboration', 'analyze', 'improve'
      projectType,
      genre,
      mood,
      targetAudience,
      theme,
      artistPersona,
      trackCount,
      projectId,
      title,
      description,
      concept,
      field,
      currentValue,
      suggestion,
    } = await req.json();

    console.log(`Project AI action: ${action} for user: ${user.id}`);

    // Detect language from user input
    const detectLanguage = (text: string): string => {
      if (!text) return 'English';
      // Check for Cyrillic characters
      const cyrillicPattern = /[а-яА-ЯёЁ]/;
      if (cyrillicPattern.test(text)) return 'Russian';
      return 'English';
    };

    const userLanguage = detectLanguage(
      title || description || concept || genre || mood || theme || ''
    );

    const languageInstruction = userLanguage === 'Russian' 
      ? 'ВАЖНО: Отвечай ТОЛЬКО на русском языке. Весь текст должен быть на русском.' 
      : 'IMPORTANT: Respond ONLY in English.';

    let result;

    switch (action) {
      case 'concept':
        // Generate project concept
        const conceptPrompt = `${languageInstruction}

You are a music producer and A&R expert. Create a detailed concept for a music project.

Project Type: ${projectType || 'album'}
Genre: ${genre || 'any'}
Mood: ${mood || 'any'}
Target Audience: ${targetAudience || 'general'}
Theme: ${theme || 'open'}
${artistPersona ? `Artist Persona: ${artistPersona}` : ''}

Generate a comprehensive project concept including:
1. Title suggestions (3 options)
2. Concept description (2-3 paragraphs)
3. Visual aesthetic ideas
4. Marketing angle
5. Key musical elements
6. Recommended tracklist length
7. Overall narrative arc

Return as JSON:
{
  "titleSuggestions": ["...", "...", "..."],
  "concept": "...",
  "visualAesthetic": "...",
  "marketingAngle": "...",
  "musicalElements": ["...", "..."],
  "recommendedTrackCount": 10,
  "narrativeArc": "..."
}`;

        const conceptResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: conceptPrompt }],
          }),
        });

        const conceptData = await conceptResponse.json();
        const conceptText = conceptData.choices?.[0]?.message?.content || '{}';
        
        try {
          const jsonMatch = conceptText.match(/```json\s*([\s\S]*?)\s*```/) || 
                           conceptText.match(/```\s*([\s\S]*?)\s*```/);
          const jsonText = jsonMatch ? jsonMatch[1] : conceptText;
          result = JSON.parse(jsonText);
        } catch (e) {
          result = { error: 'Failed to parse concept', raw: conceptText };
        }
        break;

      case 'tracklist':
        // Generate detailed tracklist
        const tracklistPrompt = `${languageInstruction}

You are a music producer. Create a detailed tracklist for a music project.

Project Type: ${projectType || 'album'}
Genre: ${genre || 'any'}
Mood: ${mood || 'any'}
Theme: ${theme || 'open'}
Number of Tracks: ${trackCount || 10}
${artistPersona ? `Artist Style: ${artistPersona}` : ''}

Create a tracklist with:
- Track titles
- Brief description of each track
- Suggested style/genre tags
- Recommended structure
- BPM suggestions
- Key emotional moments
- Overall flow and pacing

Return as JSON array:
{
  "tracks": [
    {
      "position": 1,
      "title": "...",
      "description": "...",
      "styleTags": ["...", "..."],
      "structure": "intro-verse-chorus-verse-chorus-bridge-chorus-outro",
      "bpm": 120,
      "mood": "...",
      "notes": "..."
    }
  ],
  "flowNotes": "Overall pacing and emotional journey"
}`;

        const tracklistResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: tracklistPrompt }],
          }),
        });

        const tracklistData = await tracklistResponse.json();
        const tracklistText = tracklistData.choices?.[0]?.message?.content || '{}';
        
        try {
          const jsonMatch = tracklistText.match(/```json\s*([\s\S]*?)\s*```/) || 
                           tracklistText.match(/```\s*([\s\S]*?)\s*```/);
          const jsonText = jsonMatch ? jsonMatch[1] : tracklistText;
          result = JSON.parse(jsonText);
        } catch (e) {
          result = { error: 'Failed to parse tracklist', raw: tracklistText };
        }
        break;

      case 'collaboration':
        // Suggest collaboration ideas
        const collabPrompt = `${languageInstruction}

You are an A&R expert. Suggest potential collaboration opportunities.

Project Genre: ${genre || 'any'}
Project Mood: ${mood || 'any'}
Main Artist Style: ${artistPersona || 'not specified'}

Suggest:
1. Types of artists that would complement
2. Specific roles (featured vocals, production, etc.)
3. Track positions best suited for collaboration
4. How collaboration would enhance the project

Return as JSON:
{
  "suggestions": [
    {
      "type": "Featured Vocalist",
      "style": "...",
      "reason": "...",
      "idealTracks": [1, 5, 8]
    }
  ]
}`;

        const collabResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: collabPrompt }],
          }),
        });

        const collabData = await collabResponse.json();
        const collabText = collabData.choices?.[0]?.message?.content || '{}';
        
        try {
          const jsonMatch = collabText.match(/```json\s*([\s\S]*?)\s*```/) || 
                           collabText.match(/```\s*([\s\S]*?)\s*```/);
          const jsonText = jsonMatch ? jsonMatch[1] : collabText;
          result = JSON.parse(jsonText);
        } catch (e) {
          result = { error: 'Failed to parse collaboration suggestions', raw: collabText };
        }
        break;

      case 'analyze':
        // Analyze project and provide recommendations
        const analyzePrompt = `${languageInstruction}

You are a music industry expert and A&R professional. Analyze this music project in detail.

Project Title: ${title || 'Untitled'}
Type: ${projectType || 'not specified'}
Genre: ${genre || 'not specified'}
Mood: ${mood || 'not specified'}
Description: ${description || 'not provided'}
Concept: ${concept || 'not provided'}
Target Audience: ${targetAudience || 'not specified'}

Provide a comprehensive analysis including:
1. Overall quality score (0-100)
2. Strengths (what's working well)
3. Weaknesses (what needs improvement)
4. Market potential assessment
5. Specific recommendations for improvement
6. Suggestions for each empty or weak field with priority level

CRITICAL: For the "field" property in improvements, use EXACT database field names:
- "description" (NOT "Description")
- "concept" (NOT "Concept")
- "target_audience" (NOT "Target Audience" or "targetAudience")
- "genre" (NOT "Genre")
- "mood" (NOT "Mood")

Return as JSON:
{
  "score": 75,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "marketPotential": "...",
  "recommendations": ["...", "..."],
  "improvements": [
    {
      "field": "description",
      "suggestion": "...",
      "priority": "high"
    },
    {
      "field": "target_audience",
      "suggestion": "...",
      "priority": "medium"
    }
  ]
}`;

        const analyzeResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: analyzePrompt }],
          }),
        });

        const analyzeData = await analyzeResponse.json();
        const analyzeText = analyzeData.choices?.[0]?.message?.content || '{}';
        
        try {
          const jsonMatch = analyzeText.match(/```json\s*([\s\S]*?)\s*```/) || 
                           analyzeText.match(/```\s*([\s\S]*?)\s*```/);
          const jsonText = jsonMatch ? jsonMatch[1] : analyzeText;
          result = JSON.parse(jsonText);
        } catch (e) {
          result = { error: 'Failed to parse analysis', raw: analyzeText };
        }
        break;

      case 'improve':
        // Generate improved version of a specific field
        const improvePrompt = `${languageInstruction}

You are a music industry expert. Improve this project field:

Field: ${field}
Current Value: ${currentValue || 'empty'}
Context - Project Type: ${projectType}, Genre: ${genre}, Mood: ${mood}
AI Suggestion: ${suggestion}

Generate an improved, professional version of this field that:
1. Incorporates the suggestion
2. Fits the project's genre and mood
3. Is compelling and market-ready
4. Maintains authenticity

Return ONLY the improved text, no JSON or formatting.`;

        const improveResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: improvePrompt }],
          }),
        });

        const improveData = await improveResponse.json();
        result = { improved: improveData.choices?.[0]?.message?.content || '' };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        action,
        data: result,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in project-ai:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
