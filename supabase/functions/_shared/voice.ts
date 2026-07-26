// Shared helpers for Suno Voice Cloning edge functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SUNO_VOICE_BASE = "https://api.sunoapi.org/api/v1/voice";

export function getSunoKey(): string {
  const key = Deno.env.get("SUNO_API_KEY");
  if (!key) throw new Error("SUNO_API_KEY not configured");
  return key;
}

export function getServiceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

export async function getAuthUser(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  const supabase = getServiceClient();
  const {
    data: { user },
  } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
  return user;
}

export function callbackUrl(name: string): string {
  return `${Deno.env.get("SUPABASE_URL")}/functions/v1/${name}`;
}

// Map raw Suno/error fragments to user-friendly Russian messages
const ERROR_MAP: Array<{ match: RegExp; msg: string; code: string }> = [
  { match: /unauth|invalid.*key/i, msg: "Сервис Suno: проблема авторизации. Попробуйте позже.", code: "SUNO_AUTH" },
  { match: /rate.*limit|too many/i, msg: "Слишком много запросов к Suno. Подождите минуту.", code: "SUNO_RATE_LIMIT" },
  { match: /credit|insufficient/i, msg: "Недостаточно кредитов в Suno API.", code: "SUNO_NO_CREDIT" },
  { match: /timeout|timed out/i, msg: "Превышено время ожидания Suno. Повторите попытку.", code: "SUNO_TIMEOUT" },
  {
    match: /no vocal|vocal segment|silence/i,
    msg: "В выбранном сегменте не обнаружен вокал. Выберите другой участок.",
    code: "NO_VOCAL",
  },
  {
    match: /noisy|background noise/i,
    msg: "Слишком много шума на фоне. Используйте чистую запись.",
    code: "NOISY_AUDIO",
  },
  {
    match: /phrase|mismatch|not match/i,
    msg: "Запись не совпала с фразой. Перезапишите чётко и без шума.",
    code: "PHRASE_MISMATCH",
  },
  { match: /unsupported|format/i, msg: "Неподдерживаемый формат аудио. Используйте MP3/WAV/WebM.", code: "BAD_FORMAT" },
  { match: /too short/i, msg: "Аудио слишком короткое. Минимум 5 секунд.", code: "TOO_SHORT" },
  { match: /too long/i, msg: "Аудио слишком длинное. Максимум 30 секунд.", code: "TOO_LONG" },
];

export interface VoiceError extends Error {
  code: string;
  status: number;
  raw?: unknown;
}

export function toVoiceError(raw: string, status = 502): VoiceError {
  // Log raw Suno error so we can diagnose from edge function logs
  console.error("[voice] Suno error", { status, raw: raw.slice(0, 500) });
  for (const { match, msg, code } of ERROR_MAP) {
    if (match.test(raw)) {
      const e = new Error(msg) as VoiceError;
      e.code = code;
      e.status = status;
      e.raw = raw;
      return e;
    }
  }
  // Include a short preview of raw so client can display actionable info
  const preview = raw.replace(/\s+/g, " ").slice(0, 160);
  const e = new Error(`Ошибка Suno (${status}): ${preview || "попробуйте позже"}`) as VoiceError;
  e.code = "SUNO_UNKNOWN";
  e.status = status;
  e.raw = raw;
  return e;
}

export async function sunoFetch(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${SUNO_VOICE_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getSunoKey()}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw toVoiceError(text || `HTTP ${res.status}`, res.status);
  }
  // Suno sometimes returns 200 with code != 200 in body
  if (json && typeof json.code === "number" && json.code !== 200 && json.msg) {
    throw toVoiceError(String(json.msg), res.status);
  }
  return json;
}

/**
 * Re-host a (possibly signed) audio URL on Suno's own file storage and return a
 * clean public download URL. Suno's /voice/validate downloader chokes on signed
 * URLs with query strings, so we hand it a plain URL instead.
 * Returns null when re-hosting is unavailable — caller should fall back.
 */
export async function rehostOnSuno(fileUrl: string, fileName: string): Promise<string | null> {
  try {
    const res = await fetch("https://sunoapiorg.redpandaai.co/api/file-url-upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getSunoKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileUrl, uploadPath: "audio/voice-sources", fileName }),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("[voice] file-url-upload failed", { status: res.status, body: text.slice(0, 300) });
      return null;
    }
    const json = JSON.parse(text);
    const url = json?.data?.downloadUrl ?? null;
    if (!url) console.error("[voice] file-url-upload returned no downloadUrl", { body: text.slice(0, 300) });
    return url;
  } catch (e) {
    console.error("[voice] file-url-upload threw", { message: (e as Error)?.message });
    return null;
  }
}

export function errorResponse(e: unknown, fallbackStatus = 500) {
  const err = e as Partial<VoiceError> & Error;
  const status = err?.status || fallbackStatus;
  const code = err?.code || "INTERNAL";
  const message = err?.message || "Внутренняя ошибка";
  return new Response(JSON.stringify({ success: false, error: message, code }), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
