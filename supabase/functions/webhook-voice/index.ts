/**
 * Voice Webhook Handler
 * Supabase Edge Function for handling Suno Voice API callbacks
 *
 * This Edge Function handles:
 * - voice.validate_success - When validation phrase is ready
 * - voice.generate_success - When custom voice is generated
 * - voice.validate_fail - When validation fails
 * - voice.generate_fail - When generation fails
 *
 * Webhook format from Suno:
 * {
 *   event: "voice.validate_success" | "voice.generate_success" | "voice.validate_fail" | "voice.generate_fail",
 *   data: { ... },
 *   timestamp: "2026-06-25T12:34:56Z"
 * }
 *
 * Environment Variables Required:
 * - SUNO_WEBHOOK_SECRET - For webhook signature verification
 * - SUPABASE_URL - Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY - Supabase service role key
 *
 * @see https://docs.sunoapi.org/suno-api/callbacks for callback specifications
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { crypto } from 'https://deno.land/std@0.208.0/crypto/crypto.ts';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WEBHOOK_SECRET = Deno.env.get('SUNO_WEBHOOK_SECRET');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables');
}

// ============================================================================
// WEBHOOK SIGNATURE VERIFICATION
// ============================================================================

/**
 * Verify webhook signature from Suno
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string
): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('No webhook secret configured, skipping verification');
    return true; // Allow if no secret configured
  }

  // Create expected signature
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(`${payload}${timestamp}`)
    .toString();

  // Compare signatures
  return signature === expectedSignature;
}

/**
 * Extract signature from headers
 */
function getSignatureFromHeaders(headers: Headers): {
  signature: string | null;
  timestamp: string | null;
} {
  const signature = headers.get('X-Suno-Signature') || headers.get('x-suno-signature');
  const timestamp = headers.get('X-Suno-Timestamp') || headers.get('x-suno-timestamp');

  return { signature: signature || null, timestamp: timestamp || null };
}

// ============================================================================
// DATABASE HELPERS
// ============================================================================

/**
 * Update voice task with validation phrase
 */
async function updateVoiceTaskWithPhrase(
  validateTaskId: string,
  phrase: string
): Promise<void> {
  const response = await fetch(`${SUPABASE_URL}/rest/voice_tasks`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      validate_task_id: validateTaskId,
      validate_phrase: phrase,
      validate_status: 'completed',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update voice task: ${response.statusText}`);
  }
}

/**
 * Update voice task with voice ID
 */
async function updateVoiceTaskWithVoiceId(
  generateTaskId: string,
  voiceId: string
): Promise<void> {
  const response = await fetch(`${SUPABASE_URL}/rest/voice_tasks`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      generate_task_id: generateTaskId,
      provider_voice_id: voiceId,
      generate_status: 'completed',
      completed_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update voice task with voice ID: ${response.statusText}`);
  }

  // Also verify the voice
  await verifyVoice(voiceId);
}

/**
 * Create or update custom voice
 */
async function createOrUpdateVoice(voiceId: string, userId: string): Promise<void> {
  // First, check if voice already exists
  const existingResponse = await fetch(
    `${SUPABASE_URL}/rest/voices?provider_voice_id=eq.${voiceId}&user_id=eq.${userId}`,
    {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
      },
    }
  );

  if (existingResponse.ok && existingResponse.status === 200) {
    const existingData = await existingResponse.json();

    if (existingData.length > 0) {
      // Voice exists, just verify it
      await verifyVoice(voiceId);
      return;
    }
  }

  // Create new voice record
  const response = await fetch(`${SUPABASE_URL}/rest/voices`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      user_id: userId,
      provider_voice_id: voiceId,
      name: `Custom Voice (${voiceId.slice(0, 8)}...`,
      description: 'Custom voice created via Suno Voice API',
      sample_url: '', // Will be updated when available
      is_verified: true,
      metadata: {
        created_via: 'voice_cloning',
        created_at: new Date().toISOString(),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create voice: ${response.statusText}`);
  }
}

/**
 * Verify custom voice
 */
async function verifyVoice(voiceId: string): Promise<void> {
  const response = await fetch(`${SUPABASE_URL}/rest/voices?id=eq.${voiceId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      is_verified: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to verify voice: ${response.statusText}`);
  }
}

/**
 * Mark voice task as failed
 */
async function failVoiceTask(
  taskId: string,
  status: 'processing_validate_fail' | 'processing_record_fail',
  errorMessage: string
): Promise<void> {
  const response = await fetch(`${SUPABASE_URL}/rest/voice_tasks`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      id: taskId,
      validate_status: status.includes('validate') ? status : undefined,
      generate_status: status.includes('record') ? status : undefined,
      metadata: {
        error: errorMessage,
        failed_at: new Date().toISOString(),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to mark task as failed: ${response.statusText}`);
  }
}

/**
 * Broadcast realtime update to user
 */
async function broadcastVoiceUpdate(userId: string, event: string, data: any): Promise<void> {
  // Broadcast via Supabase Realtime
  const channel = `voice_cloning:${userId}`;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/channel/${channel}/broadcast`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('Failed to broadcast realtime update:', await response.text());
    }
  } catch (error) {
    console.error('Failed to broadcast realtime update:', error);
  }
}

/**
 * Get user ID from voice task
 */
async function getUserIdFromTask(taskId: string, taskType: 'validate' | 'generate'): Promise<string | null> {
  const endpoint = taskType === 'validate' ? 'validate_task_id' : 'generate_task_id';

  const response = await fetch(
    `${SUPABASE_URL}/rest/voice_tasks?${endpoint}=eq.${taskId}&select=user_id`,
    {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
      },
    }
  );

  if (!response.ok) {
    console.error('Failed to get user ID from task:', await response.text());
    return null;
  }

  const data = await response.json();
  return data.length > 0 ? data[0].user_id : null;
}

// ============================================================================
// WEBHOOK HANDLERS
// ============================================================================

/**
 * Handle voice.validate_success event
 */
async function handleValidateSuccess(data: any): Promise<Response> {
  console.log('Handling voice.validate_success:', data);

  try {
    const { validate_task_id, validate_phrase } = data;

    if (!validate_task_id || !validate_phrase) {
      throw new Error('Missing required fields in validate_success webhook');
    }

    // Update database
    await updateVoiceTaskWithPhrase(validate_task_id, validate_phrase);

    // Get user ID for notification
    const userId = await getUserIdFromTask(validate_task_id, 'validate');

    if (userId) {
      // Broadcast realtime update
      await broadcastVoiceUpdate(userId, 'voice.validate_success', {
        validate_task_id,
        validate_phrase,
        message: 'Validation phrase is ready! Please record it.',
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Validation success handled',
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to handle validate_success:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
}

/**
 * Handle voice.generate_success event
 */
async function handleGenerateSuccess(data: any): Promise<Response> {
  console.log('Handling voice.generate_success:', data);

  try {
    const { generate_task_id, voice_id } = data;

    if (!generate_task_id || !voice_id) {
      throw new Error('Missing required fields in generate_success webhook');
    }

    // Get user ID for notification
    const userId = await getUserIdFromTask(generate_task_id, 'generate');

    if (!userId) {
      throw new Error('User not found for task');
    }

    // Update database with voice ID
    await updateVoiceTaskWithVoiceId(generate_task_id, voice_id);

    // Create or update voice record
    await createOrUpdateVoice(voice_id, userId);

    // Broadcast realtime update
    await broadcastVoiceUpdate(userId, 'voice.generate_success', {
      generate_task_id,
      voice_id,
      message: 'Custom voice created successfully!',
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Generate success handled',
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to handle generate_success:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
}

/**
 * Handle voice.validate_fail event
 */
async function handleValidateFail(data: any): Promise<Response> {
  console.error('Handling voice.validate_fail:', data);

  try {
    const { validate_task_id, error: errorMessage } = data;

    if (!validate_task_id) {
      throw new Error('Missing validate_task_id in validate_fail webhook');
    }

    // Mark task as failed
    await failVoiceTask(validate_task_id, 'processing_validate_fail', errorMessage || 'Validation failed');

    // Get user ID for notification
    const userId = await getUserIdFromTask(validate_task_id, 'validate');

    if (userId) {
      // Broadcast realtime update
      await broadcastVoiceUpdate(userId, 'voice.validate_fail', {
        validate_task_id,
        error: errorMessage,
        message: 'Voice validation failed. Please try a different audio segment.',
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Validate failure handled',
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to handle validate_fail:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
}

/**
 * Handle voice.generate_fail event
 */
async function handleGenerateFail(data: any): Promise<Response> {
  console.error('Handling voice.generate_fail:', data);

  try {
    const { generate_task_id, error: errorMessage } = data;

    if (!generate_task_id) {
      throw new Error('Missing generate_task_id in generate_fail webhook');
    }

    // Mark task as failed
    await failVoiceTask(generate_task_id, 'processing_record_fail', errorMessage || 'Generation failed');

    // Get user ID for notification
    const userId = await getUserIdFromTask(generate_task_id, 'generate');

    if (userId) {
      // Broadcast realtime update
      await broadcastVoiceUpdate(userId, 'voice.generate_fail', {
        generate_task_id,
        error: errorMessage,
        message: 'Voice generation failed. Please try recording the phrase again.',
      });

      // TODO: Refund credits if applicable
      // await refundVoiceCloningCredits(userId, generate_task_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Generate failure handled',
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to handle generate_fail:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
}

// ============================================================================
// MAIN SERVER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Suno-Signature, X-Suno-Timestamp',
      },
    });
  }

  // Only POST requests allowed
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Get raw body
    const rawBody = await req.text();

    // Parse JSON
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      throw new Error('Invalid JSON payload');
    }

    // Verify webhook signature
    const { signature, timestamp } = getSignatureFromHeaders(req.headers);

    if (!signature || !timestamp) {
      console.warn('Missing signature headers, skipping verification');
    } else {
      const isValid = verifyWebhookSignature(rawBody, signature, timestamp);

      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response('Invalid signature', { status: 401 });
      }
    }

    // Handle based on event type
    const { event, data } = payload;

    switch (event) {
      case 'voice.validate_success':
        return await handleValidateSuccess(data);

      case 'voice.generate_success':
        return await handleGenerateSuccess(data);

      case 'voice.validate_fail':
        return await handleValidateFail(data);

      case 'voice.generate_fail':
        return await handleGenerateFail(data);

      default:
        console.warn('Unknown webhook event:', event);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Unknown event type',
          }),
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500 }
    );
  }
});