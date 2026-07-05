import type { Options } from "canvas-confetti";

type ConfettiFn = (options?: Options) => Promise<undefined> | null;

let fire: ConfettiFn | null = null;

/**
 * Fire-and-forget wrapper around canvas-confetti that keeps the library out of
 * the eager bundle (~20 KB gzip): the module is dynamically imported on first
 * use and cached. Call sites keep the original `confetti({...})` signature —
 * the burst just starts a tick later on the very first call.
 */
export function confetti(options?: Options): void {
  if (fire) {
    void fire(options);
    return;
  }
  void import("canvas-confetti").then((mod) => {
    fire = mod.default;
    void fire(options);
  });
}
