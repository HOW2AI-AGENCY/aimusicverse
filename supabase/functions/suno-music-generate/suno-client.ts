// Suno API call with model fallback + exponential backoff.
// Accepts a correlation-aware logger so the whole retry chain is traceable.
import { isSunoSuccessCode } from "../_shared/suno.ts";
import { MODEL_FALLBACK_CHAIN } from "../_shared/suno-models.ts";
import { isRetriableModelError, isTransientError, sleep } from "./errors.ts";
import type { ScopedLogger } from "./log.ts";

export interface SunoCallResult {
  success: boolean;
  response: Response | null;
  data: Record<string, unknown> | null;
  lastErrorMsg: string;
  lastStatus: number | null;
  currentModel: string;
  retryCount: number;
  totalDurationMs: number;
}

export interface CallSunoOptions {
  sunoApiKey: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  userId: string;
  payload: Record<string, unknown>;
  initialModel: string;
  logger: ScopedLogger;
  maxRetries?: number;
  fetchImpl?: typeof fetch;
}

export async function callSunoWithRetry(opts: CallSunoOptions): Promise<SunoCallResult> {
  const { sunoApiKey, supabase, userId, payload, initialModel, logger } = opts;
  const maxRetries = opts.maxRetries ?? 3;
  const fetchImpl = opts.fetchImpl ?? fetch;

  let currentModel = initialModel;
  let retryCount = 0;
  let response: Response | null = null;
  let data: Record<string, unknown> | null = null;
  let lastErrorMsg = "";
  let lastStatus: number | null = null;
  const overallStart = Date.now();

  while (retryCount <= maxRetries) {
    payload.model = currentModel;

    const startTime = Date.now();
    try {
      response = await fetchImpl("https://api.sunoapi.org/api/v1/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sunoApiKey}`,
          "Content-Type": "application/json",
          "X-Correlation-Id": logger.correlationId,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (networkError: any) {
      logger.error("Suno API network error", networkError, {
        attempt: retryCount + 1,
        model: currentModel,
      });
      lastErrorMsg = networkError?.message || "Network error";
      lastStatus = null;
      if (retryCount < maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 8000);
        logger.info("Retrying after network error", { backoffMs, attempt: retryCount + 1 });
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
      request_body: { ...payload, attempt: retryCount + 1, correlationId: logger.correlationId },
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
        totalDurationMs: Date.now() - overallStart,
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
      logger.warn("Transient error, retrying", {
        status: response.status,
        error: lastErrorMsg,
        attempt: retryCount + 1,
        backoffMs,
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
    totalDurationMs: Date.now() - overallStart,
  };
}
