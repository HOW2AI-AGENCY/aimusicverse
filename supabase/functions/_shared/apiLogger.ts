import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ApiLogParams {
  supabase: SupabaseClient;
  userId: string;
  service: string;
  endpoint: string;
  method?: string;
  requestBody: any;
  response: Response;
  startTime: number;
}

const COST_TABLE: Record<string, number> = {
  'suno:generate': 0.05,
  'suno:extend': 0.03,
  'suno:remix': 0.04,
  'suno:vocal-removal': 0.02,
  'suno:add-vocals': 0.03,
  'suno:add-instrumental': 0.03,
  'suno:convert-wav': 0.01,
  'suno:generate-cover': 0.02,
  'replicate:audio-flamingo': 0.01,
  'replicate:transcribe-midi': 0.005,
  'replicate:music-analysis': 0.008,
  'openai:chat': 0.002,
  'openai:embedding': 0.0001,
};

export async function logApiCall({
  supabase,
  userId,
  service,
  endpoint,
  method = 'POST',
  requestBody,
  response,
  startTime,
}: ApiLogParams): Promise<void> {
  try {
    const duration = Date.now() - startTime;
    let responseBody: any = null;
    
    try {
      responseBody = await response.clone().json();
    } catch (e) {
      responseBody = { error: 'Failed to parse response' };
    }

    const costKey = `${service}:${endpoint}`;
    const estimatedCost = COST_TABLE[costKey] || 0;

    const { error } = await supabase.from('api_usage_logs').insert({
      user_id: userId,
      service,
      endpoint,
      method,
      request_body: requestBody,
      response_status: response.status,
      response_body: responseBody,
      duration_ms: duration,
      estimated_cost: estimatedCost,
    });

    if (error) {
      console.error('❌ Failed to log API call:', error);
    } else {
      console.log(`📊 API Log: ${service}/${endpoint} - ${duration}ms - $${estimatedCost.toFixed(4)}`);
    }
  } catch (error) {
    console.error('❌ Error in logApiCall:', error);
  }
}
