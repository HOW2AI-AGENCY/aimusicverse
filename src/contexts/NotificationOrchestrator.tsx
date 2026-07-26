/**
 * NotificationOrchestrator — единая система оповещений.
 *
 * Объединяет:
 *   - sonner (всплывающие toast-уведомления)
 *   - AnnouncementContext (системные объявления с приоритетами)
 *   - OfflineBanner (статус соединения)
 *
 * Порядок показа:
 *   1. critical → system banner (блокирующий)
 *   2. high    → toast + banner
 *   3. normal  → toast (если не было high)
 *   4. low     → toast (если тихо)
 *   5. tips    → показывать в свободное время
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

const notifyLogger = logger.child({ module: "NotificationOrch" });

// ── Types ───────────────────────────────────────────────────────────────────
export type NotificationType = "info" | "warning" | "success" | "error" | "beta" | "feature" | "system" | "tip";
export type NotificationPriority = "critical" | "high" | "normal" | "low";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  /** Показывать как system banner (не toast) */
  asBanner?: boolean;
  /** Не показывать до следующего визита */
  dismissPersist?: boolean;
  autoDismissMs?: number;
  action?: { label: string; onClick: () => void };
  onDismiss?: () => void;
}

export interface NotificationContextType {
  currentBanner: Notification | null;
  queueLength: number;
  notify: (n: Notification) => void;
  dismissBanner: () => void;
  wasDismissed: (id: string) => boolean;
}

// ── Context ─────────────────────────────────────────────────────────────────
const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotification(): NotificationContextType {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────────────────────
const DISMISSED_KEY = "mv_dismissed_notifications";

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
  } catch {
    return [];
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Notification[]>([]);
  const [banner, setBanner] = useState<Notification | null>(null);
  const pausedRef = useRef(false);
  const dismissedRef = useRef<string[]>(getDismissed());

  const wasDismissed = useCallback((id: string) => dismissedRef.current.includes(id), []);

  const dismissBanner = useCallback(() => {
    setBanner((prev) => {
      prev?.onDismiss?.();
      return null;
    });
  }, []);

  /** Process next in queue — show banner or toast */
  const processQueue = useCallback(() => {
    setQueue((q) => {
      if (q.length === 0 || pausedRef.current) return q;

      const [next, ...rest] = q;

      // Skip dismissed
      if (dismissedRef.current.includes(next.id)) return rest;

      // Critical → always banner
      if (next.priority === "critical" || next.asBanner) {
        setBanner(next);
        // Auto-dismiss
        if (next.autoDismissMs && next.autoDismissMs > 0) {
          setTimeout(() => dismissBanner(), next.autoDismissMs);
        }
        return rest;
      }

      // High/normal/low → toast
      const toastFn = next.type === "error" ? toast.error
        : next.type === "warning" ? toast.warning
        : next.type === "success" ? toast.success
        : toast.info;

      const id = next.action
        ? toastFn(next.title, {
            description: next.message,
            duration: next.autoDismissMs ?? 5000,
            action: { label: next.action.label, onClick: next.action.onClick },
          })
        : toastFn(next.title, {
            description: next.message,
            duration: next.autoDismissMs ?? 5000,
          });

      next.onDismiss?.();

      return rest;
    });
  }, [dismissBanner]);

  // Process queue when it changes
  useEffect(() => {
    processQueue();
  }, [queue, processQueue]);

  const notify = useCallback((n: Notification) => {
    const notif: Notification = {
      priority: "normal",
      autoDismissMs: 5000,
      ...n,
    };

    // If it's a tip and already dismissed, skip
    if (notif.type === "tip" && dismissedRef.current.includes(notif.id)) {
      notifyLogger.debug("Tip already dismissed, skipping", { id: notif.id });
      return;
    }

    setQueue((q) => [...q, notif]);
  }, []);

  const value: NotificationContextType = {
    currentBanner: banner,
    queueLength: queue.length,
    notify,
    dismissBanner,
    wasDismissed,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Banner render slot */}
      {banner && (
        <div
          role="alert"
          className={`fixed top-0 left-0 right-0 z-[100] px-4 py-2.5 text-sm text-center shadow-lg animate-in slide-in-from-top
            ${banner.type === "error" ? "bg-destructive text-destructive-foreground"
            : banner.type === "warning" ? "bg-amber-600 text-white"
            : banner.type === "success" ? "bg-emerald-600 text-white"
            : banner.type === "system" ? "bg-blue-600 text-white"
            : banner.type === "beta" ? "bg-purple-600 text-white"
            : "bg-primary text-primary-foreground"}`}
        >
          <div className="flex items-center justify-center gap-3 max-w-2xl mx-auto">
            <span className="font-medium truncate">{banner.title}</span>
            {banner.message && <span className="opacity-90 hidden sm:inline truncate">{banner.message}</span>}
            {banner.action && (
              <button
                onClick={banner.action.onClick}
                className="shrink-0 underline underline-offset-2 hover:no-underline font-medium"
              >
                {banner.action.label}
              </button>
            )}
            <button
              onClick={dismissBanner}
              className="shrink-0 ml-auto opacity-70 hover:opacity-100 text-lg leading-none"
              aria-label="Закрыть"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

// ── Helper для блока приветствия / фичи / совета ────────────────────────────

export function useFeatureNotification(): {
  showFeature: (id: string, title: string, message: string, action?: Notification["action"]) => void;
  showTip: (id: string, title: string, message: string) => void;
} {
  const { notify, wasDismissed } = useNotification();

  const showFeature = useCallback(
    (id: string, title: string, message: string, action?: Notification["action"]) => {
      if (wasDismissed(id)) return;
      notify({ id, title, message, type: "feature", priority: "normal", action, dismissPersist: true });
    },
    [notify, wasDismissed],
  );

  const showTip = useCallback(
    (id: string, title: string, message: string) => {
      if (wasDismissed(id)) return;
      notify({ id, title, message, type: "tip", priority: "low", dismissPersist: true });
    },
    [notify, wasDismissed],
  );

  return { showFeature, showTip };
}
