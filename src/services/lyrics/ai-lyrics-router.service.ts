/**
 * AI Lyrics Router
 *
 * Smart router that automatically selects between Supabase edge functions
 * and 9Router gateway based on availability.
 */

import * as supabaseLyrics from "./ai-tools.service";
import * as ninerouterLyrics from "./ninerouter-lyrics.service";
import { healthCheck } from "@/services/ninerouter/ninerouter.service";
import { logger } from "@/lib/logger";

const routerLogger = logger.child({ module: "AILyricsRouter" });

// ==========================================
// Provider Selection
// ==========================================

type Provider = "ninerouter" | "supabase";

let cachedProvider: Provider | null = null;
let lastCheck = 0;
const CHECK_INTERVAL = 60_000; // 1 minute

async function getProvider(): Promise<Provider> {
  const now = Date.now();
  if (cachedProvider && now - lastCheck < CHECK_INTERVAL) {
    return cachedProvider;
  }

  try {
    const isHealthy = await healthCheck();
    cachedProvider = isHealthy ? "ninerouter" : "supabase";
    routerLogger.info(`AI provider selected: ${cachedProvider}`);
  } catch {
    cachedProvider = "supabase";
    routerLogger.info("9Router unavailable, falling back to Supabase");
  }

  lastCheck = now;
  return cachedProvider;
}

// ==========================================
// Exported Functions (drop-in replacements)
// ==========================================

export interface GenerateLyricsParams {
  theme: string;
  genre: string;
  mood: string;
  structure: string;
  language: string;
}

export interface ImproveLyricsParams {
  existingLyrics: string;
  language: string;
}

export interface AddLyricsTagsParams {
  existingLyrics: string;
}

export interface ChatParams {
  message: string;
  context: Record<string, unknown>;
}

export async function generateLyrics(params: GenerateLyricsParams) {
  const provider = await getProvider();
  routerLogger.info(`generateLyrics via ${provider}`);

  if (provider === "ninerouter") {
    return ninerouterLyrics.generateLyrics(params);
  }
  return supabaseLyrics.generateLyrics(params);
}

export async function improveLyrics(params: ImproveLyricsParams) {
  const provider = await getProvider();
  routerLogger.info(`improveLyrics via ${provider}`);

  if (provider === "ninerouter") {
    return ninerouterLyrics.improveLyrics(params);
  }
  return supabaseLyrics.improveLyrics(params);
}

export async function addLyricsTags(params: AddLyricsTagsParams) {
  const provider = await getProvider();
  routerLogger.info(`addLyricsTags via ${provider}`);

  if (provider === "ninerouter") {
    return ninerouterLyrics.addLyricsTags(params);
  }
  return supabaseLyrics.addLyricsTags(params);
}

export async function sendAiChatMessage(params: ChatParams) {
  const provider = await getProvider();
  routerLogger.info(`sendAiChatMessage via ${provider}`);

  if (provider === "ninerouter") {
    return ninerouterLyrics.sendAiChatMessage(params);
  }
  return supabaseLyrics.sendAiChatMessage(params);
}
