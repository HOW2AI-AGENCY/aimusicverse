/**
 * useNineRouter - React hook for 9Router AI Gateway
 *
 * Provides chat completion, image generation, and model management
 * through the local 9Router gateway.
 */

import { useState, useCallback } from "react";
import {
  chatCompletion,
  generateImage,
  listModels,
  healthCheck,
  askAI,
  generateLyrics,
  generateCoverPrompt,
  type NineRouterMessage,
  type NineRouterChatResponse,
  type NineRouterImageResponse,
  type NineRouterModel,
  MODELS,
} from "@/services/ninerouter/ninerouter.service";
import { logger } from "@/lib/logger";

const hookLogger = logger.child({ module: "useNineRouter" });

// ==========================================
// Chat Hook
// ==========================================

export function useNineRouterChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<NineRouterChatResponse | null>(null);

  const chat = useCallback(
    async (messages: NineRouterMessage[], model: string = MODELS.MIMO_PRO, maxTokens: number = 2048) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await chatCompletion({
          model,
          messages,
          max_tokens: maxTokens,
        });
        setResponse(result);
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        hookLogger.error("Chat completion failed", err instanceof Error ? err : new Error(errorMsg));
        setError(errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const ask = useCallback(async (prompt: string, model?: string, systemPrompt?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await askAI(prompt, model, systemPrompt);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      hookLogger.error("Ask AI failed", err instanceof Error ? err : new Error(errorMsg));
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    chat,
    ask,
    isLoading,
    error,
    response,
    clearError: () => setError(null),
  };
}

// ==========================================
// Image Generation Hook
// ==========================================

export function useNineRouterImage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<NineRouterImageResponse | null>(null);

  const generate = useCallback(
    async (prompt: string, model: string = MODELS.SEED_2_PRO, size: string = "1024x1024") => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await generateImage({
          model,
          prompt,
          size,
        });
        setImages(result);
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        hookLogger.error("Image generation failed", err instanceof Error ? err : new Error(errorMsg));
        setError(errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    generate,
    isLoading,
    error,
    images,
    clearError: () => setError(null),
  };
}

// ==========================================
// Lyrics Generation Hook
// ==========================================

export function useNineRouterLyrics() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateLyricsHook = useCallback(async (theme: string, genre: string, mood: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateLyrics(theme, genre, mood);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      hookLogger.error("Lyrics generation failed", err instanceof Error ? err : new Error(errorMsg));
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateCover = useCallback(async (trackTitle: string, genre: string, mood: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateCoverPrompt(trackTitle, genre, mood);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      hookLogger.error("Cover prompt generation failed", err instanceof Error ? err : new Error(errorMsg));
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    generateLyrics: generateLyricsHook,
    generateCover,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}

// ==========================================
// Models Hook
// ==========================================

export function useNineRouterModels() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<NineRouterModel[]>([]);

  const fetchModels = useCallback(async (kind?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listModels(kind);
      setModels(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      hookLogger.error("Failed to fetch models", err instanceof Error ? err : new Error(errorMsg));
      setError(errorMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchModels,
    isLoading,
    error,
    models,
    clearError: () => setError(null),
  };
}

// ==========================================
// Health Check Hook
// ==========================================

export function useNineRouterHealth() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsChecking(true);
    try {
      const healthy = await healthCheck();
      setIsHealthy(healthy);
      return healthy;
    } catch {
      setIsHealthy(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    checkHealth,
    isHealthy,
    isChecking,
  };
}
