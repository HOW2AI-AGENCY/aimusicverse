// Suno API call with model fallback + exponential backoff
import { isSunoSuccessCode } from "../_shared/suno.ts";
import { MODEL_FALLBACK_CHAIN } from "../_shared/suno-models.ts";
import { createLogger } from "../_shared/logger.ts";
import { isRetriableModelError, isTransientError, sleep } from "./errors.ts";

const logger = createLogger("suno-music-generate");

export interface SunoCallResult {
  success: boolean;
  response: Response | null;
  data: Record<string, unknown> | null;
  lastErrorMsg: string;
  lastStatus: number | null;
  currentModel: string;
  retryCount: number;
}

export async function callSunoWithRetry(
  sunoApiKey: string,
  supabase: any,
  userId: string,
  sunoPayload: Record<string, unknown>,
  initialModel: string,
  maxRetries = 3,
): Promise<SunoCallResult> {
  let currentModel = initialModel;
  let retryCount = 0;
  let response: Response | null = null;
  let data: Record<string, unknown> | null = null;
  let lastErrorMsg = "";
  let lastStatus: number | null = null;

  while (retryCount <= maxRetries) {
    sunoPayload.model = currentModel;

    const startTime = Date.now();
    try {
      response = await fetch("https://api.sunoapi.org/api/v1/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sunoApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sunoPayload),
        signal: AbortSignal.timeout(30000),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (networkError: any) {
      logger.error("Suno API network error", networkError, { attempt: retryCount + 1 });
      lastErrorMsg = networkError.message || "Network error";
      lastStatus = null;
      if (retryCount < maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 8000);
        logger.info(`Retrying after network error in ${backoffMs}ms`, { attempt: retryCount + 1 });
        await sleep(backoffMs);
        retryCount++;
        continue;
      }
      break;
    }

    const duration = Date.now() - startTime;
    data = await response.json();

    logger.info("Suno API response", {
      durationMs: duration,
      status: response.status,
      model: currentModel,
      attempt: retryCount + 1,
    });

    await supabase.from("api_usage_logs").insert({
      user_id: userId,
      service: "suno",
      endpoint: "generate",
      method: "POST",
      request_body: { ...sunoPayload, attempt: retryCount + 1 },
      response_status: response.status,
      response_body: data,
      duration_ms: duration,
      estimated_cost: 0.05,
    });

    lastStatus = response.status;
    lastErrorMsg = (data?.msg as string) || (data?.message as string) || "SunoAPI request failed";

    if (response.ok && isSunoSuccessCode(data?.code)) {
      return {
        success: true,
        response,
        data,
        lastErrorMsg,
        lastStatus,
        currentModel,
        retryCount,
      };
    }

    const isModelError = isRetriableModelError(lastErrorMsg);
    const isTransient = isTransientError(response.status, lastErrorMsg);
    const canFallback = isModelError && MODEL_FALLBACK_CHAIN[currentModel];

    if (canFallback) {
      const fallbackModel = MODEL_FALLBACK_CHAIN[currentModel];
      logger.warn("Model error, attempting fallback", {
        from: currentModel,
        to: fallbackModel,
        error: lastErrorMsg,
      });
      currentModel = fallbackModel;
      retryCount++;
      continue;
    }

    if (isTransient && retryCount < maxRetries) {
      const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 8000);
      logger.warn(`Transient error, retrying in ${backoffMs}ms`, {
        status: response.status,
        error: lastErrorMsg,
        attempt: retryCount + 1,
      });
      await sleep(backoffMs);
      retryCount++;
      continue;
    }

    break;
  }

  return {
    success: false,
    response,
    data,
    lastErrorMsg,
    lastStatus,
    currentModel,
    retryCount,
  };
}
