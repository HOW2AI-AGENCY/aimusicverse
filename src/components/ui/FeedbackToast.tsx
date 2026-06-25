/**
 * @deprecated Use `notify` from `@/lib/toast` (canonical Phase 8 adapter)
 * or import `toast` directly from `sonner`. Will be removed in Phase 10 of
 * `docs/UI_AUDIT.md`.
 */
import { toast as sonnerToast } from "sonner";
import { notify } from "@/lib/toast";

export type ToastType = "success" | "error" | "info" | "warning" | "loading";

export interface ToastOptions {
  type?: ToastType;
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

/** Backwards-compatible facade. New code should call `notify.*` directly. */
export function showToast(message: string, opts: ToastOptions = {}) {
  const { type = "info", ...rest } = opts;
  switch (type) {
    case "success":
      return notify.success(message, rest);
    case "error":
      return notify.error(message, rest);
    case "warning":
      return notify.warning(message, rest);
    case "loading":
      return notify.progress(message, rest);
    default:
      return notify.info(message, rest);
  }
}

export const toast = sonnerToast;
