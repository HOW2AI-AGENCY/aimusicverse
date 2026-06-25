/**
 * Toast Adapter — Phase 8 UI unification
 *
 * Canonical API for showing user-visible feedback. Wraps `sonner` so callers
 * never depend on the underlying library directly and we can swap or augment
 * it later (analytics, Sentry breadcrumbs, telemetry) in a single place.
 *
 * @example
 *   import { notify } from '@/lib/toast';
 *   notify.success('Трек сохранён');
 *   notify.error('Не удалось сгенерировать', { description: err.message });
 *   const id = notify.progress('Шаг 1/3 — проверка голоса');
 *   notify.update(id, { type: 'success', message: 'Готово' });
 */

import { toast as sonner, type ExternalToast } from "sonner";

type ToastOptions = Pick<ExternalToast, "description" | "duration" | "action" | "id" | "icon" | "className">;

type ProgressUpdate =
  | { type: "success"; message: string; description?: string }
  | { type: "error"; message: string; description?: string }
  | { type: "info"; message: string; description?: string }
  | { type: "dismiss" };

const DEFAULT_DURATION = 4000;
const ERROR_DURATION = 6000;

export const notify = {
  success(message: string, options?: ToastOptions) {
    return sonner.success(message, { duration: DEFAULT_DURATION, ...options });
  },
  error(message: string, options?: ToastOptions) {
    return sonner.error(message, { duration: ERROR_DURATION, ...options });
  },
  info(message: string, options?: ToastOptions) {
    return sonner.message(message, { duration: DEFAULT_DURATION, ...options });
  },
  warning(message: string, options?: ToastOptions) {
    return sonner.warning(message, { duration: ERROR_DURATION, ...options });
  },
  /** Long-running operation. Returns a toast id you can update with `update()`. */
  progress(message: string, options?: ToastOptions) {
    return sonner.loading(message, { duration: Infinity, ...options });
  },
  /** Update or dismiss a previously shown toast (typically a progress one). */
  update(id: string | number, change: ProgressUpdate) {
    if (change.type === "dismiss") {
      sonner.dismiss(id);
      return;
    }
    const payload = {
      id,
      description: change.description,
      duration: change.type === "error" ? ERROR_DURATION : DEFAULT_DURATION,
    };
    if (change.type === "success") sonner.success(change.message, payload);
    else if (change.type === "error") sonner.error(change.message, payload);
    else sonner.message(change.message, payload);
  },
  dismiss(id?: string | number) {
    sonner.dismiss(id);
  },
};

export type Notify = typeof notify;
