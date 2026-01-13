// Edge Function: moderate-content - Sprint 011 Task T020
// Server-side content validation for comments and user-generated content

import { getSupabaseClient } from '../_shared/supabase-client.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface ModerationRequest {
  content: string;
  userId: string;
  contentType: 'comment' | 'profile_bio' | 'profile_display_name';
}

interface ModerationResponse {
  approved: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high';
}

// Profanity and spam detection (server-side)
const PROFANITY_LIST = [
  'spam', 'scam', 'porn', 'xxx', 'drugs', 'viagra',
  // Add comprehensive list in production
];

function containsProfanity(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return PROFANITY_LIST.some(word => lowerContent.includes(word));
}

function detectSpam(content: string): { isSpam: boolean; score: number } {
  let spamScore = 0;

  // Multiple URLs
  const urlMatches = content.match(/http[s]?:\/\/[^\s]+/gi);
  if (urlMatches && urlMatches.length > 2) spamScore += 2;

  // Phone numbers
  if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(content)) spamScore += 2;

  // Excessive caps
  const capsCount = (content.match(/[A-Z]/g) || []).length;
  const totalLetters = (content.match(/[A-Za-z]/g) || []).length;
  if (totalLetters > 10 && capsCount / totalLetters > 0.5) spamScore += 1;

  // Repeated characters
  if (/(.)\1{5,}/.test(content)) spamScore += 1;

  return { isSpam: spamScore >= 3, score: spamScore };
}

async function checkRateLimit(
  supabase: any,
  userId: string,
  contentType: string
): Promise<{ exceeded: boolean; reason?: string }> {
  const now = new Date();
  
  if (contentType === 'comment') {
    // Check comment rate limit (10 per minute)
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const { data, error } = await supabase
      .from('comments')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', oneMinuteAgo.toISOString());

    if (error) {
      console.error('Rate limit check error:', error);
      return { exceeded: false };
    }

    if (data && data.length >= 10) {
      return {
        exceeded: true,
        reason: 'Too many comments in a short time. Please slow down.',
      };
    }
  }

  return { exceeded: false };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = getSupabaseClient();

    // Get user from JWT token in Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body: ModerationRequest = await req.json();
    const { content, userId, contentType } = body;

    // Validate input
    if (!content || !userId || !contentType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user matches authenticated user
    if (user.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'User ID mismatch' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const result: ModerationResponse = { approved: true };

    // Check content length
    const trimmed = content.trim();
    if (trimmed.length === 0) {
      return new Response(
        JSON.stringify({
          approved: false,
          reason: 'Content cannot be empty',
          severity: 'low',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check max length based on content type
    const maxLengths = {
      comment: 2000,
      profile_bio: 500,
      profile_display_name: 50,
    };

    if (trimmed.length > maxLengths[contentType]) {
      return new Response(
        JSON.stringify({
          approved: false,
          reason: `Content exceeds maximum length of ${maxLengths[contentType]} characters`,
          severity: 'low',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check for profanity
    if (containsProfanity(trimmed)) {
      return new Response(
        JSON.stringify({
          approved: false,
          reason: 'Content contains inappropriate language',
          severity: 'medium',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check for spam (only for comments)
    if (contentType === 'comment') {
      const { isSpam, score } = detectSpam(trimmed);
      if (isSpam) {
        return new Response(
          JSON.stringify({
            approved: false,
            reason: 'Content appears to be spam',
            severity: score > 4 ? 'high' : 'medium',
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Check rate limits
    const rateLimitCheck = await checkRateLimit(
      supabaseClient,
      userId,
      contentType
    );

    if (rateLimitCheck.exceeded) {
      return new Response(
        JSON.stringify({
          approved: false,
          reason: rateLimitCheck.reason,
          severity: 'medium',
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // All checks passed
    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Moderation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
