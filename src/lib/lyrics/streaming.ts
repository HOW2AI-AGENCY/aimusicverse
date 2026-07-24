/**
 * Stream lyrics generation from the ai-lyrics-assistant edge function.
 *
 * The function returns Server-Sent Events with two event types:
 *   event: chunk        — data: { delta: "raw text delta" }
 *   event: done         — data: { ...final parsed action response }
 *
 * We accumulate raw text and progressively extract the `lyrics` JSON field so
 * the UI can update the editor as tokens arrive without waiting for the JSON
 * envelope to close.
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { LyricsAssistantResponse } from "@/api/lyrics.api";

export interface StreamLyricsOptions {
  action: string;
  genre?: string;
  mood?: string;
  language?: string;
  theme?: string;
  lyrics?: string;
  section?: string;
  style?: string;
  structure?: string;
  message?: string;
  context?: Record<string, unknown>;
  /** Called with the currently-accumulated `lyrics` field text as it streams. */
  onLyricsProgress?: (partial: string) => void;
  /** Called with the raw text delta straight from the model. */
  onRawDelta?: (delta: string) => void;
  /** Called once when the final parsed response arrives. */
  onDone?: (final: LyricsAssistantResponse) => void;
  /** Called on transport/HTTP error. */
  onError?: (error: Error) => void;
  /** External abort signal for cancellation. */
  signal?: AbortSignal;
}

export interface StreamLyricsResult {
  final: LyricsAssistantResponse | null;
  aborted: boolean;
  raw: string;
}

const SUPABASE_URL: string | undefined = (import.meta as unknown as { env?: Record<string, string> }).env
  ?.VITE_SUPABASE_URL;

/** Extract a partial `"lyrics": "..."` value from an in-progress JSON string. */
export function extractPartialLyrics(accumulated: string): string | null {
  const marker = accumulated.match(/"lyrics"\s*:\s*"/);
  if (!marker) return null;
  const start = marker.index! + marker[0].length;
  let i = start;
  let out = "";
  while (i < accumulated.length) {
    const ch = accumulated[i];
    if (ch === "\\" && i + 1 < accumulated.length) {
      const next = accumulated[i + 1];
      if (next === "n") out += "\n";
      else if (next === "t") out += "\t";
      else if (next === "r") out += "\r";
      else out += next;
      i += 2;
      continue;
    }
    if (ch === '"') return out; // closed
    out += ch;
    i++;
  }
  return out; // still open — partial
}

export async function streamLyricsAssistant(opts: StreamLyricsOptions): Promise<StreamLyricsResult> {
  const {
    onLyricsProgress,
    onRawDelta,
    onDone,
    onError,
    signal,
    ...body
  } = opts;

  if (!SUPABASE_URL) {
    const err = new Error("Supabase URL is not configured");
    onError?.(err);
    return { final: null, aborted: false, raw: "" };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = `${SUPABASE_URL}/functions/v1/ai-lyrics-assistant`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({ ...body, stream: true }),
      signal,
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (err.name !== "AbortError") onError?.(err);
    return { final: null, aborted: err.name === "AbortError", raw: "" };
  }

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    const err = new Error(`Lyrics stream failed: ${response.status} ${text}`);
    onError?.(err);
    return { final: null, aborted: false, raw: "" };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let raw = "";
  let final: LyricsAssistantResponse | null = null;
  let lastPartial = "";
  let aborted = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split(/\n\n/);
      buffer = events.pop() ?? "";
      for (const evt of events) {
        const parsed = parseSseEvent(evt);
        if (!parsed) continue;
        if (parsed.event === "chunk" && typeof parsed.data?.delta === "string") {
          raw += parsed.data.delta;
          onRawDelta?.(parsed.data.delta);
          const partial = extractPartialLyrics(raw);
          if (partial !== null && partial !== lastPartial) {
            lastPartial = partial;
            onLyricsProgress?.(partial);
          }
        } else if (parsed.event === "done") {
          final = parsed.data as LyricsAssistantResponse;
          onDone?.(final);
        } else if (parsed.event === "error") {
          const msg = typeof parsed.data?.error === "string" ? parsed.data.error : "stream error";
          onError?.(new Error(msg));
        }
      }
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (err.name === "AbortError") {
      aborted = true;
    } else {
      logger.warn("streamLyricsAssistant read error", { error: err.message });
      onError?.(err);
    }
  }

  return { final, aborted, raw };
}

function parseSseEvent(block: string): { event: string; data: Record<string, unknown> } | null {
  const lines = block.split("\n").map((l) => l.trimEnd());
  let event = "message";
  const dataLines: string[] = [];
  for (const l of lines) {
    if (l.startsWith("event:")) event = l.slice(6).trim();
    else if (l.startsWith("data:")) dataLines.push(l.slice(5).trim());
  }
  if (dataLines.length === 0) return null;
  try {
    const data = JSON.parse(dataLines.join("\n"));
    return { event, data };
  } catch {
    return null;
  }
}
