/**
 * Lightweight performance marks/measures for hunting blank frames.
 * No-op in production builds for zero overhead.
 *
 * Usage:
 *   perfMark('fullscreen:mount');
 *   perfMeasure('fullscreen:firstPaint', 'fullscreen:mount');
 */

import { logger } from "@/lib/logger";

const ENABLED = typeof performance !== "undefined" && (import.meta.env?.DEV ?? false);

export function perfMark(name: string): void {
  if (!ENABLED) return;
  try {
    performance.mark(name);
  } catch {
    /* noop */
  }
}

export function perfMeasure(name: string, startMark: string, endMark?: string): number | null {
  if (!ENABLED) return null;
  try {
    const measure = performance.measure(name, startMark, endMark);
    const duration = Math.round(measure.duration);
    logger.info(`[perf] ${name}`, { duration_ms: duration, start: startMark, end: endMark ?? "now" });
    return duration;
  } catch {
    return null;
  }
}

/** Sugar: mark "<scope>:<event>" and measure from "<scope>:mount". */
export function perfEvent(scope: string, event: string): void {
  if (!ENABLED) return;
  const mark = `${scope}:${event}`;
  perfMark(mark);
  perfMeasure(`${scope}:${event} since mount`, `${scope}:mount`, mark);
}
