/**
 * 9Router AI Gateway Service
 *
 * OpenAI-compatible REST client for local/remote AI gateway.
 * Provides unified access to multiple AI providers with auto-fallback.
 *
 * @see https://github.com/decolua/9router
 */

import { logger } from "@/lib/logger";

const ninerouterLogger = logger.child({ module: "NineRouter" });

// ==========================================
// Configuration
// ==========================================

const NINEROUTER_URL = import.meta.env.VITE_NINEROUTER_URL || "http://localhost:20128";
const NINEROUTER_KEY = import.meta.env.VITE_NINEROUTER_KEY || "";

// ==========================================
// Types
// ==========================================

export interface NineRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
  /** Model that produced this message (assistant only) */
  model?: string;
  /** Provider that produced this message (assistant only) */
  provider?: string;
}

export interface NineRouterChatRequest {
  model: string;
  messages: NineRouterMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface NineRouterChatResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
      reasoning_content?: string;
    };
    finish_reason: string;
  }[];
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cached_tokens?: number;
    reasoning_tokens?: number;
  };
}

export interface NineRouterImageRequest {
  model: string;
  prompt: string;
  n?: number;
  size?: string;
  response_format?: "url" | "b64_json";
}

export interface NineRouterImageResponse {
  data: {
    url?: string;
    b64_json?: string;
  }[];
}

export interface NineRouterModel {
  id: string;
  object: string;
  owned_by: string;
  created?: number;
  kind?: string;
  capabilities?: {
    thinking?: boolean;
    agentic?: boolean;
  };
}

// ==========================================
// API Client
// ==========================================

async function ninerouterFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${NINEROUTER_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(NINEROUTER_KEY ? { Authorization: `Bearer ${NINEROUTER_KEY}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  ninerouterLogger.info(`9Router request: ${endpoint}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    ninerouterLogger.error(`9Router error: ${response.status} ${error}`);
    throw new Error(`9Router API error: ${response.status} ${error}`);
  }

  return response.json() as Promise<T>;
}

// ==========================================
// Chat Completions
// ==========================================

export async function chatCompletion(request: NineRouterChatRequest): Promise<NineRouterChatResponse> {
  return ninerouterFetch<NineRouterChatResponse>("/v1/chat/completions", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function chatCompletionStream(request: NineRouterChatRequest): Promise<ReadableStream<Uint8Array>> {
  const url = `${NINEROUTER_URL}/v1/chat/completions`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(NINEROUTER_KEY ? { Authorization: `Bearer ${NINEROUTER_KEY}` } : {}),
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...request, stream: true }),
  });

  if (!response.ok) {
    throw new Error(`9Router stream error: ${response.status}`);
  }

  return response.body!;
}

// ==========================================
// Image Generation
// ==========================================

export async function generateImage(request: NineRouterImageRequest): Promise<NineRouterImageResponse> {
  return ninerouterFetch<NineRouterImageResponse>("/v1/images/generations", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// ==========================================
// Models
// ==========================================

export async function listModels(kind?: string): Promise<NineRouterModel[]> {
  const endpoint = kind ? `/v1/models/${kind}` : "/v1/models";
  const response = await ninerouterFetch<{ data: NineRouterModel[] }>(endpoint);
  return response.data;
}

export async function listChatModels(): Promise<NineRouterModel[]> {
  return listModels();
}

export async function listImageModels(): Promise<NineRouterModel[]> {
  return listModels("image");
}

export async function listTTSModels(): Promise<NineRouterModel[]> {
  return listModels("tts");
}

export async function listEmbeddingModels(): Promise<NineRouterModel[]> {
  return listModels("embedding");
}

// ==========================================
// Health Check
// ==========================================

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${NINEROUTER_URL}/api/health`);
    const data = await response.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

// ==========================================
// Predefined Models
// ==========================================

export const MODELS = {
  // LLM
  MIMO_PRO: "xmtp/mimo-v2.5-pro",
  MIMO_STANDARD: "xmtp/mimo-v2.5",
  GEMINI_PRO: "gc/gemini-3.1-pro-preview",
  GEMINI_FLASH: "gc/gemini-3-flash-preview",
  CLAUDE_OPUS: "cc/claude-opus-4-8",
  CLAUDE_SONNET: "cc/claude-sonnet-5",
  DEEPSEEK_PRO: "ds/deepseek-v4-pro",
  DEEPSEEK_FLASH: "ds/deepseek-v4-flash",

  // Image
  SEED_2_PRO: "bpm/seed-2-0-pro-260328",
  SEED_2_MINI: "bpm/seed-2-0-mini-260215",

  // TTS
  MIMO_TTS: "xmtp/mimo-v2.5-tts",
  MIMO_TTS_VOICECLONE: "xmtp/mimo-v2.5-tts-voiceclone",
  MIMO_TTS_VOICEDESIGN: "xmtp/mimo-v2.5-tts-voicedesign",

  // STT
  PARAKEET_ASR: "nvidia/parakeet-ctc-1.1b-asr",

  // Embeddings
  TEXT_EMBEDDING_3: "text-embedding-3-small",
} as const;

// ==========================================
// Helpers
// ==========================================

export function parseModelId(modelId: string): { provider: string; model: string } {
  const separatorIndex = modelId.indexOf("/");
  if (separatorIndex === -1) {
    return { provider: "unknown", model: modelId };
  }
  return {
    provider: modelId.slice(0, separatorIndex),
    model: modelId.slice(separatorIndex + 1),
  };
}

// ==========================================
// Convenience Functions
// ==========================================

export async function askAI(prompt: string, model: string = MODELS.MIMO_PRO, systemPrompt?: string): Promise<string> {
  const messages: NineRouterMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  messages.push({ role: "user", content: prompt });

  const response = await chatCompletion({
    model,
    messages,
    max_tokens: 2048,
  });

  return response.choices[0]?.message?.content || "";
}

export async function askAIWithMeta(
  prompt: string,
  model: string = MODELS.MIMO_PRO,
  systemPrompt?: string,
): Promise<NineRouterMessage> {
  const messages: NineRouterMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  messages.push({ role: "user", content: prompt });

  const response = await chatCompletion({
    model,
    messages,
    max_tokens: 2048,
  });

  const actualModel = response.model || model;
  const { provider, model: modelName } = parseModelId(actualModel);

  return {
    role: "assistant",
    content: response.choices[0]?.message?.content || "",
    model: modelName,
    provider,
  };
}

export async function generateLyrics(theme: string, genre: string, mood: string): Promise<string> {
  const systemPrompt = `You are a professional songwriter. Write song lyrics based on the given theme, genre, and mood. 
Return ONLY the lyrics, no explanations. Use proper song structure (verse, chorus, bridge).`;

  const userPrompt = `Theme: ${theme}
Genre: ${genre}
Mood: ${mood}

Write the lyrics:`;

  return askAI(userPrompt, MODELS.MIMO_PRO, systemPrompt);
}

export async function generateCoverPrompt(trackTitle: string, genre: string, mood: string): Promise<string> {
  const systemPrompt = `You are an AI image prompt engineer. Create a detailed image generation prompt for an album cover.
Return ONLY the prompt, no explanations.`;

  const userPrompt = `Track: ${trackTitle}
Genre: ${genre}
Mood: ${mood}

Create an image prompt for the album cover:`;

  return askAI(userPrompt, MODELS.MIMO_PRO, systemPrompt);
}
