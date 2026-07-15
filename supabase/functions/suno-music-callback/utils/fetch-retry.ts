/**
 * Fetch with exponential backoff retry.
 * ponytail: inline in index.ts → extracted so handlers can share it.
 */

import { createLogger } from "../../_shared/logger.ts";

const logger = createLogger("fetch-retry");

export async function fetchWithRetry(url: string, maxRetries = 3, initialDelay = 2000): Promise<Response> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      logger.warn("Fetch bad status", { attempt, status: response.status });
    } catch (error: any) {
      lastError = error;
      logger.warn("Fetch exception", { attempt, error: error.message });
    }

    if (attempt < maxRetries) {
      const delay = initialDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("All fetch attempts failed");
}
