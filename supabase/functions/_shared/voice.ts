// Shared helpers for Suno Voice Cloning edge functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const SUNO_VOICE_BASE = 'https://api.sunoapi.org/api/v1/voice';

export function getSunoKey(): string {
  const key = Deno.env.get('SUNO_API_KEY');
  if (!key) throw new Error('SUNO_API_KEY not configured');
  return key;
}

export function getServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

export async function getAuthUser(req: Request) {
  const auth = req.headers.get('Authorization');
  if (!auth) return null;
  const supabase = getServiceClient();
  const { data: { user } } = await supabase.auth.getUser(auth.replace('Bearer ', ''));
  return user;
}

export function callbackUrl(name: string): string {
  return `${Deno.env.get('SUPABASE_URL')}/functions/v1/${name}`;
}

export async function sunoFetch(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${SUNO_VOICE_BASE}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${getSunoKey()}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    throw new Error(`Suno ${path} failed (${res.status}): ${text.slice(0, 500)}`);
  }
  return json;
}
