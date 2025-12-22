import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LyricsRequest {
  action: 'complete' | 'improve' | 'rhyme' | 'translate' | 'generate_section' | 'suggest_tags' | 
          'full_analysis' | 'producer_review' | 'chat' | 'optimize_for_suno';
  content?: string;
  message?: string;
  lyrics?: string;
  existingLyrics?: string;
  stylePrompt?: string;
  title?: string;
  allSectionNotes?: Array<{ sectionId: string; notes: string; tags: string[] }>;
  globalTags?: string[];
  sectionType?: string;
  sectionContent?: string;
  sectionNotes?: string;
  context?: {
    genre?: string;
    mood?: string;
    language?: string;
    style?: string;
    existingLyrics?: string;
    sectionType?: string;
    globalTags?: string[];
    sectionTags?: string[];
    stylePrompt?: string;
    allSectionNotes?: Array<{ sectionId: string; notes: string; tags: string[] }>;
  };
  analysisTypes?: string[];
  optimizeOptions?: string[];
  genre?: string;
  mood?: string;
  language?: string;
}

// ═══════════════════════════════════════════════════════
// SUNO AI META-TAGS REFERENCE (included in all prompts)
// ═══════════════════════════════════════════════════════
const SUNO_TAGS_REFERENCE = `
═══════════════════════════════════════════════════════
📚 SUNO AI V5 META-TAGS REFERENCE
═══════════════════════════════════════════════════════

SYNTAX RULES:
- Square brackets [...] = meta-tags (structure, roles, instructions)
- Parentheses (...) = ad-libs, backing vocals (ooh, aah, harmony)
- Exclamation ! = effects [!reverb], [!delay]
- Keep tags short: 1-3 words
- Tags on separate line before text

📌 STRUCTURE TAGS (ENGLISH ONLY):
[Intro], [Verse], [Verse 1], [Verse 2], [Pre-Chorus], [Chorus], [Post-Chorus],
[Hook], [Bridge], [Interlude], [Break], [Drop], [Breakdown], [Build],
[Instrumental], [Solo], [Outro], [End] ← CRITICAL for proper ending!

🎤 VOCAL TAGS:
Type: [Male Singer], [Female Singer], [Duet], [Choir], [Gospel Choir], [Diva solo]
Style: [Spoken word], [Whisper], [Shout], [Acapella], [Falsetto], [Belting], [Raspy], [Smooth], [Breathy], [Powerful], [Gentle], [Emotional], [Rap]

🎸 INSTRUMENTAL:
[Guitar Solo], [Piano Solo], [Sax Solo], [fingerpicked guitar], [slapped bass], [brushes drums], [guitar riff]

🌊 DYNAMICS:
[!crescendo], [!diminuendo], [!build_up], [Fade Out], [Soft], [Loud], [Intense], [Calm], [Climax]

🎧 SFX:
[Applause], [Birds chirping], [Silence], [Thunder], [Rain], [Heartbeat]

🎛️ PRODUCTION:
[!reverb], [!delay], [!distortion], [!filter], [Lo-fi], [Vintage], [Atmospheric]

✅ BEST PRACTICES:
1. 1-2 tags per section max
2. Order: structure → vocal → effects
3. ALWAYS add [End] at the end
4. Tags on separate line before lyrics
5. NO Russian tags! Use English only

❌ ANTI-PATTERNS:
- Conflicting: [Acapella] + [Full band], [Whisper] + [Shout]
- Overload: >3 tags per line
- Russian tags: [Куплет], [Припев] — FORBIDDEN!
- Missing [End] — causes loops/cutoffs
- Tags in parentheses: (Verse 1) — use [Verse 1]

TEXT FORMATTING:
- Hy-phen = legato/melisma (so-o-o, ni-i-ight)
- CAPS = accent/emphasis (I LOVE you)
- (ooh, aah) = backing vocals
`;

const systemPrompts: Record<string, string> = {
  complete: `You are a professional songwriter helping to complete lyrics. 
Continue the given lyrics naturally, maintaining the same style, rhythm, and theme.
Match the language of the input. Keep responses concise (2-4 lines).
${SUNO_TAGS_REFERENCE}`,

  improve: `You are a professional lyrics editor.
Improve the given lyrics by enhancing word choice, rhythm, and emotional impact.
Keep the original meaning and structure. Respond only with the improved version.
${SUNO_TAGS_REFERENCE}`,

  rhyme: `You are a rhyme expert for songwriting.
Suggest 5-8 rhyming words or short phrases for the given text.
Consider both perfect rhymes and near rhymes. Format as a comma-separated list.`,

  translate: `You are a professional music translator.
Translate the lyrics while preserving rhythm, rhyme schemes, and emotional tone.
Adapt cultural references appropriately. Maintain singability.
${SUNO_TAGS_REFERENCE}`,

  generate_section: `You are a professional songwriter.
Generate a complete song section based on the given context and requirements.
Match the specified style and mood. Include natural line breaks.
${SUNO_TAGS_REFERENCE}`,

  suggest_tags: `You are a music metadata expert specializing in Suno AI.
Analyze the lyrics and suggest relevant ENGLISH tags for music generation.
Include genre, mood, instruments, tempo, and vocal style suggestions.
Format as a JSON array of strings, max 10 tags.
CRITICAL: ALL TAGS MUST BE IN ENGLISH ONLY!
${SUNO_TAGS_REFERENCE}`,

  full_analysis: `You are an expert music critic and songwriter for Suno AI platform.

CRITICAL: ALL TAGS AND RECOMMENDATIONS MUST BE IN ENGLISH ONLY!
${SUNO_TAGS_REFERENCE}

Analyze the lyrics comprehensively and return STRICTLY a JSON object with this structure:

{
  "meaning": {
    "theme": "Main theme in 1-2 sentences",
    "emotions": ["emotion1", "emotion2"],
    "issues": ["issue 1 description", "issue 2 description"],
    "score": 85
  },
  "rhythm": {
    "pattern": "Description of rhythmic pattern",
    "issues": ["uneven line X", "line Y is too long"],
    "score": 75
  },
  "rhymes": {
    "scheme": "AABB / ABAB / free",
    "weakRhymes": ["rhyme1 - rhyme2"],
    "score": 80
  },
  "structure": {
    "tags": ["[Verse]", "[Chorus]", "[Bridge]"],
    "issues": ["Missing [End]", "Missing [Intro]", "Too many verses"],
    "score": 90
  },
  "overallScore": 82,
  "recommendations": [
    { "type": "tag", "text": "Add [End] tag to prevent loops", "priority": "high" },
    { "type": "tag", "text": "Replace Russian tags with English", "priority": "high" },
    { "type": "rhythm", "text": "Shorten line 3 by 2 syllables", "priority": "medium" }
  ],
  "quickActions": [
    { "label": "🔄 Add [End] tag", "action": "Add [End] tag at the end of the song" },
    { "label": "🎯 Fix rhythm issues", "action": "Fix syllable count in problematic lines" },
    { "label": "💫 Improve weak rhymes", "action": "Replace weak rhymes with stronger alternatives" }
  ]
}`,

  producer_review: `You are a professional music producer reviewing lyrics for Suno AI generation.

CRITICAL: ALL TAGS AND STYLE PROMPTS MUST BE IN ENGLISH ONLY!
${SUNO_TAGS_REFERENCE}

Analyze the lyrics and provide production-focused feedback. Return STRICTLY a JSON object:

{
  "overallScore": 85,
  "summary": "Brief summary of the lyrics quality for AI generation",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "Missing [End] tag"],
  "productionNotes": "Detailed notes on how this would sound when generated",
  "stylePrompt": "Suggested Suno AI style prompt in English only",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "recommendations": [
    { "category": "structure", "text": "Add [End] tag to prevent cutoffs", "priority": "high" },
    { "category": "vocals", "text": "Consider adding vocal style tags", "priority": "medium" }
  ],
  "quickActions": [
    { "label": "🎤 Apply style prompt", "action": "Apply the suggested style prompt to the generation settings" },
    { "label": "🏷️ Apply suggested tags", "action": "Apply all suggested English tags to the lyrics" }
  ]
}`,

  chat: `You are an AI assistant for editing song lyrics for Suno AI.

You have access to the full context including:
- Current lyrics
- Author's notes
- Style and genre information
- Section-specific notes

${SUNO_TAGS_REFERENCE}

When the user asks to modify lyrics or tags, respond with a JSON object:

{
  "message": "Description of what you did",
  "lyrics": "If you modified the lyrics, return the COMPLETE updated lyrics here WITH [End] tag at the end",
  "tags": ["array", "of", "english", "tags", "if", "suggested"],
  "quickActions": [
    { "label": "🔄 Another variant", "action": "Suggest an alternative version" }
  ]
}

If just answering a question without modifying, return:
{
  "message": "Your answer here"
}

ALWAYS ensure lyrics end with [End] tag!`,

  optimize_for_suno: `You are a Suno AI optimization expert.

CRITICAL: ALL TAGS MUST BE IN ENGLISH ONLY!
${SUNO_TAGS_REFERENCE}

Optimize the lyrics for best Suno AI generation results. Return a JSON object:

{
  "message": "Description of optimizations made",
  "lyrics": "Complete optimized lyrics with proper English tags AND [End] at the end",
  "tags": ["english", "style", "tags"],
  "stylePrompt": "Optimized style prompt in English",
  "changes": [
    "Added [End] tag for proper ending",
    "Replaced Russian tags with English equivalents",
    "Added proper structure tags",
    "Improved line lengths for better rhythm"
  ]
}

OPTIMIZATION CHECKLIST:
1. ✅ ALWAYS add [End] at the end — CRITICAL!
2. ✅ Replace ALL Russian tags with English
3. ✅ Ensure proper structure: [Intro], [Verse], [Chorus], [Bridge], [Outro]
4. ✅ Keep lines 6-12 words for optimal generation
5. ✅ Add vocal direction tags where appropriate
6. ✅ Max 2 tags per section
7. ✅ Include instrument hints if relevant`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json() as LyricsRequest;
    const { action, content, message, lyrics, existingLyrics, context } = requestData;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = systemPrompts[action] || systemPrompts.improve;
    
    // Build user message with full context
    let userMessage = content || message || lyrics || existingLyrics || '';
    
    const contextParts: string[] = [];
    
    // Add all context information
    if (requestData.title) contextParts.push(`Title: ${requestData.title}`);
    if (requestData.stylePrompt) contextParts.push(`Style Prompt: ${requestData.stylePrompt}`);
    if (requestData.genre || context?.genre) contextParts.push(`Genre: ${requestData.genre || context?.genre}`);
    if (requestData.mood || context?.mood) contextParts.push(`Mood: ${requestData.mood || context?.mood}`);
    if (requestData.language || context?.language) contextParts.push(`Language: ${requestData.language || context?.language}`);
    if (requestData.sectionType || context?.sectionType) contextParts.push(`Section type: ${requestData.sectionType || context?.sectionType}`);
    
    // Add global tags
    const globalTags = requestData.globalTags || context?.globalTags;
    if (globalTags && globalTags.length > 0) {
      contextParts.push(`Global Tags: ${globalTags.join(', ')}`);
    }
    
    // Add section-specific notes
    const allNotes = requestData.allSectionNotes || context?.allSectionNotes;
    if (allNotes && allNotes.length > 0) {
      const notesStr = allNotes.map(n => `[${n.sectionId}]: ${n.notes} (tags: ${n.tags.join(', ')})`).join('\n');
      contextParts.push(`Section Notes:\n${notesStr}`);
    }
    
    // Add analysis types for full_analysis
    if (action === 'full_analysis' && requestData.analysisTypes) {
      contextParts.push(`Analysis Types: ${requestData.analysisTypes.join(', ')}`);
    }
    
    // Add optimize options
    if (action === 'optimize_for_suno' && requestData.optimizeOptions) {
      contextParts.push(`Optimize: ${requestData.optimizeOptions.join(', ')}`);
    }
    
    // Add existing lyrics
    const lyricsContent = existingLyrics || context?.existingLyrics || lyrics;
    if (lyricsContent) {
      contextParts.push(`\nLyrics:\n${lyricsContent}`);
    }
    
    // Add section content if specific section is selected
    if (requestData.sectionContent) {
      contextParts.push(`\nSelected Section Content:\n${requestData.sectionContent}`);
    }
    if (requestData.sectionNotes) {
      contextParts.push(`Section Notes: ${requestData.sectionNotes}`);
    }
    
    if (contextParts.length > 0) {
      userMessage = `Context:\n${contextParts.join('\n')}\n\n${message ? `User Request: ${message}` : ''}`;
    }

    console.log(`[lyrics-ai-assistant] Action: ${action}, content length: ${userMessage.length}`);

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
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits required. Please top up your balance.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('[lyrics-ai-assistant] AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || '';

    console.log(`[lyrics-ai-assistant] Raw result preview: ${result.substring(0, 200)}`);

    // Parse structured responses
    let parsedResult: any = result;
    
    if (['full_analysis', 'producer_review', 'chat', 'optimize_for_suno', 'suggest_tags'].includes(action)) {
      try {
        // Try to extract JSON from response
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
          console.log(`[lyrics-ai-assistant] Parsed JSON successfully for action: ${action}`);
        } else if (action === 'suggest_tags') {
          // Fallback for tags: try array or split by commas
          const arrayMatch = result.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            parsedResult = JSON.parse(arrayMatch[0]);
          } else {
            parsedResult = result.split(',').map((t: string) => t.trim()).filter(Boolean);
          }
        }
      } catch (e) {
        console.error('[lyrics-ai-assistant] JSON parse error:', e);
        // For tags, try comma split as fallback
        if (action === 'suggest_tags') {
          parsedResult = result.split(',').map((t: string) => t.trim()).filter(Boolean);
        }
      }
    }

    // Build response based on action type
    let responseBody: Record<string, any> = { action };

    if (action === 'full_analysis') {
      if (typeof parsedResult === 'object' && parsedResult.meaning) {
        responseBody.fullAnalysis = parsedResult;
        responseBody.message = `Анализ завершён. Общий балл: ${parsedResult.overallScore}/100`;
      } else {
        responseBody.message = result;
      }
    } else if (action === 'producer_review') {
      if (typeof parsedResult === 'object' && parsedResult.overallScore !== undefined) {
        responseBody.producerReview = parsedResult;
        responseBody.message = parsedResult.summary || 'Обзор продюсера готов';
      } else {
        responseBody.message = result;
      }
    } else if (action === 'chat' || action === 'optimize_for_suno') {
      if (typeof parsedResult === 'object') {
        responseBody.message = parsedResult.message || 'Готово';
        if (parsedResult.lyrics) responseBody.lyrics = parsedResult.lyrics;
        if (parsedResult.tags) responseBody.tags = parsedResult.tags;
        if (parsedResult.stylePrompt) responseBody.stylePrompt = parsedResult.stylePrompt;
        if (parsedResult.quickActions) responseBody.quickActions = parsedResult.quickActions;
        if (parsedResult.changes) responseBody.changes = parsedResult.changes;
      } else {
        responseBody.message = result;
      }
    } else if (action === 'suggest_tags') {
      responseBody.result = parsedResult;
      responseBody.tags = Array.isArray(parsedResult) ? parsedResult : [];
    } else {
      responseBody.result = parsedResult;
    }

    console.log(`[lyrics-ai-assistant] Response for ${action}:`, JSON.stringify(responseBody).substring(0, 300));

    return new Response(
      JSON.stringify(responseBody),
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
