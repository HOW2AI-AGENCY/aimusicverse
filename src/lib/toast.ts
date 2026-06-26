/**
 * Deduping toast wrapper around sonner.
 *
 * Sonner does not deduplicate identical messages out of the box, so a
 * retry-spam scenario (e.g. audio recovery, network errors) can produce
 * 5-10 stacked toasts on mobile. This wrapper assigns a stable `id`
 * derived from message+description so re-firing the same toast simply
 * replaces the existing one instead of stacking.
 *
 * Drop-in compatible with `toast.success / error / info / warning / message`.
 * Caller can still pass an explicit `id` to override.
 */
import { toast as sonnerToast, type ExternalToast } from "sonner";

type Message = string | React.ReactNode;

function stableId(message: Message, opts?: ExternalToast): string {
  if (opts?.id) return String(opts.id);
  const base = typeof message === "string" ? message : "toast";
  const desc = typeof opts?.description === "string" ? opts.description : "";
  return `t:${base}::${desc}`;
}

function wrap(
  fn: (message: Message, opts?: ExternalToast) => string | number,
): (message: Message, opts?: ExternalToast) => string | number {
  return (message, opts) => fn(message, { ...opts, id: stableId(message, opts) });
}

export const toast = Object.assign(wrap(sonnerToast as never), {
  success: wrap(sonnerToast.success.bind(sonnerToast) as never),
  error: wrap(sonnerToast.error.bind(sonnerToast) as never),
  info: wrap(sonnerToast.info.bind(sonnerToast) as never),
  warning: wrap(sonnerToast.warning.bind(sonnerToast) as never),
  message: wrap(sonnerToast.message.bind(sonnerToast) as never),
  loading: wrap(sonnerToast.loading.bind(sonnerToast) as never),
  dismiss: sonnerToast.dismiss.bind(sonnerToast),
  promise: sonnerToast.promise.bind(sonnerToast),
  custom: sonnerToast.custom.bind(sonnerToast),
});

export type { ExternalToast };

export const notify = toast;

