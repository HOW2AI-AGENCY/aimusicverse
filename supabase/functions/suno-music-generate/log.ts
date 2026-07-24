// Correlation-aware structured logger wrapper for suno-music-generate.
// Every log line includes the correlationId so a single request can be traced
// end-to-end across modules (index, suno-client, db, metrics).
import { createLogger } from "../_shared/logger.ts";

type Ctx = Record<string, unknown>;

export interface ScopedLogger {
  correlationId: string;
  debug(msg: string, ctx?: Ctx): void;
  info(msg: string, ctx?: Ctx): void;
  warn(msg: string, ctx?: Ctx): void;
  error(msg: string, err?: unknown, ctx?: Ctx): void;
  success(msg: string, ctx?: Ctx): void;
  apiCall(service: string, endpoint: string, ctx?: Ctx): void;
  child(extra: Ctx): ScopedLogger;
}

export function generateCorrelationId(): string {
  // Prefer crypto.randomUUID when available (Deno supports it).
  try {
    return `smg_${crypto.randomUUID()}`;
  } catch {
    return `smg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function createScopedLogger(correlationId: string, baseCtx: Ctx = {}): ScopedLogger {
  const base = createLogger("suno-music-generate");
  const merge = (ctx?: Ctx): Ctx => ({ correlationId, ...baseCtx, ...(ctx ?? {}) });

  return {
    correlationId,
    debug: (msg, ctx) => base.debug(msg, merge(ctx)),
    info: (msg, ctx) => base.info(msg, merge(ctx)),
    warn: (msg, ctx) => base.warn(msg, merge(ctx)),
    error: (msg, err, ctx) => {
      // Preserve original logger's (msg, err, ctx) shape.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (base as any).error(msg, err, merge(ctx));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    success: (msg, ctx) => ((base as any).success ?? base.info)(msg, merge(ctx)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall: (service, endpoint, ctx) => ((base as any).apiCall ?? base.info)(service, endpoint, merge(ctx)),
    child(extra) {
      return createScopedLogger(correlationId, { ...baseCtx, ...extra });
    },
  };
}
