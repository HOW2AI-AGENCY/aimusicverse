import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = getSupabaseClient();

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
      language, // Add language parameter
    } = await req.json();

    console.log(`Project AI action: ${action} for user: ${user.id}`);

    // Detect language from user input
    const detectLanguage = (text: string): string => {
      if (!text) return 'en';
      // Check for Cyrillic characters
      const cyrillicPattern = /[а-яА-ЯёЁ]/;
      if (cyrillicPattern.test(text)) return 'ru';
      return 'en';
    };

    // Use language from request or detect from user input
    const userLanguage = language || detectLanguage(
      title || description || concept || genre || mood || theme || ''
    );

    const languageInstruction = userLanguage === 'ru'
      ? 'ВАЖНО: Отвечай ТОЛЬКО на русском языке. Весь текст должен быть на русском.' 
      : 'IMPORTANT: Respond ONLY in English. All text must be in English.';

    // Helper to get recommended track count by project type
    const getRecommendedTrackCount = (type: string): number => {
      switch (type) {
        case 'single': return 2;
        case 'ep': return 5;
        case 'album': return 10;
        case 'ost': return 8;
        case 'mixtape': return 8;
        default: return 8;
      }
    };

    let result;

    switch (action) {
      case 'full-project': {
        // Generate complete project with title, description, concept, tracklist with cover prompts
        const trackCountNum = trackCount || getRecommendedTrackCount(projectType);
        
        const fullProjectPrompt = `${languageInstruction}

You are a professional music producer, A&R expert, and album conceptualist. Create a COMPLETE, COHESIVE music project.

═══════════════════════════════════════════════════════
PROJECT REQUIREMENTS:
═══════════════════════════════════════════════════════
Type: ${projectType || 'album'}
Genre: ${genre || 'open to interpretation'}
Mood: ${mood || 'varied'}
Target Audience: ${targetAudience || 'general'}
Theme/Concept: ${theme || 'create an original concept'}
${artistPersona ? `Artist Persona: ${artistPersona}` : ''}
Number of Tracks: ${trackCountNum}

═══════════════════════════════════════════════════════
WHAT TO GENERATE:
═══════════════════════════════════════════════════════

1. PROJECT IDENTITY:
   - Creative, memorable title that captures the essence
   - Description (2-3 paragraphs): what the project is about, its journey
   - Creative concept: the narrative arc, emotional journey, story
   - Visual aesthetic: colors, imagery, art style direction

2. COVER ART PROMPT:
   - Detailed AI image generation prompt for main project cover
   - Include: style, colors, composition, mood, symbolic elements
   - Should be specific enough for image AI to generate cohesive artwork

3. TRACKLIST (${trackCountNum} tracks) with narrative flow:
   Each track needs:
   - Title (creative, fits the concept)
   - styleTags: 4-6 genre/style tags for music generation (e.g., "Dark Trap", "808", "Melancholic Piano")
   - notes: Lyrics development hints, theme, story for this song
   - structure: Song structure (e.g., "intro-verse-chorus-verse-chorus-bridge-outro")
   - coverPrompt: Unique AI prompt for this track's cover art
   - bpm: Tempo suggestion (60-180)
   - keySignature: Musical key (e.g., "Am", "C#m", "F")
   - energyLevel: 1-10 energy rating

IMPORTANT: 
- Create an emotional journey across tracks (opener → development → climax → resolution)
- Each track should connect to the overall concept but have its own identity
- Vary tempos, keys, and energy levels for dynamic listening experience

Return as JSON:
{
  "title": "Project Title",
  "description": "Detailed project description...",
  "concept": "Creative concept and narrative arc...",
  "visualAesthetic": "Visual direction for artwork...",
  "coverPrompt": "Detailed AI prompt for main project cover art...",
  "tracks": [
    {
      "position": 1,
      "title": "Track Title",
      "styleTags": ["tag1", "tag2", "tag3", "tag4"],
      "notes": "Theme and mood description for lyrics development...",
      "structure": "intro-verse-chorus-verse-chorus-bridge-chorus-outro",
      "coverPrompt": "Detailed AI prompt for this track's cover art...",
      "bpm": 120,
      "keySignature": "Am",
      "energyLevel": 7
    }
  ]
}`;

        console.log('Generating full project with prompt length:', fullProjectPrompt.length);
        
        const fullProjectResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: fullProjectPrompt }],
          }),
        });

        if (!fullProjectResponse.ok) {
          const errorText = await fullProjectResponse.text();
          console.error('AI gateway error:', fullProjectResponse.status, errorText);
          if (fullProjectResponse.status === 429) {
            throw new Error('Превышен лимит запросов AI. Попробуйте позже.');
          }
          if (fullProjectResponse.status === 402) {
            throw new Error('Необходимо пополнить баланс AI.');
          }
          throw new Error('Ошибка AI сервиса');
        }

        const fullProjectData = await fullProjectResponse.json();
        const fullProjectText = fullProjectData.choices?.[0]?.message?.content || '{}';
        
        console.log('Received AI response length:', fullProjectText.length);
        
        try {
          // Parse JSON from response (handle markdown code blocks)
          const jsonMatch = fullProjectText.match(/```json\s*([\s\S]*?)\s*```/) || 
                           fullProjectText.match(/```\s*([\s\S]*?)\s*```/);
          const jsonText = jsonMatch ? jsonMatch[1] : fullProjectText;
          result = JSON.parse(jsonText.trim());
          
          console.log('Parsed project:', { 
            title: result.title, 
            trackCount: result.tracks?.length,
            hasCoverPrompt: !!result.coverPrompt 
          });
          
          // If projectId is provided, insert tracks into database
          if (result.tracks && Array.isArray(result.tracks) && projectId) {
            const tracksToInsert = result.tracks.map((track: any) => ({
              project_id: projectId,
              position: track.position,
              title: track.title,
              style_prompt: track.styleTags?.join(', ') || null,
              notes: track.notes || null,
              recommended_tags: track.styleTags || null,
              recommended_structure: track.structure || null,
              key_signature: track.keySignature || null,
              energy_level: track.energyLevel || null,
              bpm_target: track.bpm || null,
              duration_target: track.bpm ? Math.round((60 / track.bpm) * 240) : 180,
              status: 'draft',
            }));

            const { data: insertedTracks, error: insertError } = await supabase
              .from('project_tracks')
              .insert(tracksToInsert)
              .select();

            if (insertError) {
              console.error('Error inserting tracks:', insertError);
              // Don't throw - return result anyway so user gets the generated data
              result.insertError = insertError.message;
            } else {
              console.log('Tracks inserted successfully:', insertedTracks?.length);
              result.insertedCount = insertedTracks?.length || 0;
            }
          }
        } catch (e) {
          console.error('Error in full-project generation:', e, 'Raw text:', fullProjectText.slice(0, 500));
          result = { error: 'Failed to parse AI response', raw: fullProjectText.slice(0, 1000) };
        }
        break;
      }

      case 'concept': {
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
      }

      case 'tracklist': {
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
          
          // Insert tracks into database using service role
          if (result.tracks && Array.isArray(result.tracks) && projectId) {
            const tracksToInsert = result.tracks.map((track: any) => ({
              project_id: projectId,
              position: track.position,
              title: track.title,
              style_prompt: track.styleTags?.join(', ') || null,
              notes: track.description || track.notes || null,
              recommended_tags: track.styleTags || null,
              recommended_structure: track.structure || null,
              duration_target: track.bpm ? Math.round((60 / track.bpm) * 240) : 120,
              status: 'draft',
            }));

            const { data: insertedTracks, error: insertError } = await supabase
              .from('project_tracks')
              .insert(tracksToInsert)
              .select();

            if (insertError) {
              console.error('Error inserting tracks:', insertError);
              throw insertError;
            }
            
            console.log('Tracks inserted successfully:', insertedTracks?.length);
            result.insertedCount = insertedTracks?.length || 0;
          }
        } catch (e) {
          console.error('Error in tracklist generation:', e);
          result = { error: 'Failed to parse or insert tracklist', raw: tracklistText };
        }
        break;
      }

      case 'collaboration': {
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
      }

      case 'analyze': {
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

CRITICAL: Use ONLY these EXACT field names (copy them exactly as shown):
- "description" - for project description
- "concept" - for creative concept
- "target_audience" - for target audience (use underscore, not space!)
- "genre" - for music genre
- "mood" - for emotional mood

DO NOT suggest improvements for: title, project_type, or any other fields not listed above!
DO NOT use "Project Title", "Target Audience" with capital letters or spaces!

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
      }

      case 'improve': {
        // Define valid database fields and their aliases
        const validFields = [
          'title', 'description', 'concept', 'target_audience', 
          'genre', 'mood', 'project_type', 'cover_url', 
          'reference_artists', 'reference_tracks', 'key_signature',
          'bpm_range', 'release_date', 'status', 'copyright_info',
          'label_name', 'is_commercial'
        ];
        
        // Map field names to database column names
        const fieldMapping: Record<string, string> = {
          // Title variations
          'Project Title': 'title',
          'project_title': 'title',
          'project title': 'title',
          'projectTitle': 'title',
          'Title': 'title',
          
          // Target audience variations
          'Target Audience': 'target_audience',
          'target audience': 'target_audience',
          'targetAudience': 'target_audience',
          'audience': 'target_audience',
          
          // Description variations
          'Description': 'description',
          'desc': 'description',
          
          // Concept variations
          'Concept': 'concept',
          
          // Genre variations
          'Genre': 'genre',
          'music genre': 'genre',
          'musicGenre': 'genre',
          
          // Mood variations
          'Mood': 'mood',
          'emotional mood': 'mood',
          'emotionalMood': 'mood',
          
          // Project type variations
          'Type': 'project_type',
          'type': 'project_type',
          'projectType': 'project_type',
          'project type': 'project_type',
          'Project Type': 'project_type',
        };
        
        // Normalize field name
        const normalizedField = fieldMapping[field] || field.toLowerCase().replace(/\s+/g, '_');
        
        // Validate that the field exists in the database
        if (!validFields.includes(normalizedField)) {
          console.error('Invalid field name:', field, 'normalized to:', normalizedField);
          throw new Error(`Field "${field}" is not a valid database column. Valid fields: ${validFields.join(', ')}`);
        }
        
        console.log('Field normalization:', { original: field, normalized: normalizedField });
        
        // Generate improved version of a specific field
        const improvePrompt = `${languageInstruction}

You are a music industry expert. Improve this project field:

Field: ${normalizedField}
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
        result = { 
          improved: improveData.choices?.[0]?.message?.content || '',
          normalizedField // Return normalized field name
        };
        break;
      }

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
