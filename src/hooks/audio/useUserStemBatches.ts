/**
 * useUserStemBatches — realtime tracking of the current user's stem batches.
 *
 * Emits progress + status updates and auto-cleans the Supabase channel when
 * the consumer unmounts. Complements the more focused `useBatchStemProcessing`
 * hook which is scoped to a single sheet-owned batch.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getActiveUserBatches,
  subscribeToUserBatches,
  cancelBatch,
  retryBatch,
  type StemBatchStatus,
} from "@/api/batch.api";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

interface UseUserStemBatchesOptions {
  /** When false, the hook is inert (no fetch, no subscription). */
  enabled?: boolean;
  /** Emit toasts when batches transition to completed / failed / cancelled. */
  notify?: boolean;
}

interface UseUserStemBatchesResult {
  batches: StemBatchStatus[];
  latest: StemBatchStatus | null;
  loading: boolean;
  cancel: (batchId: string) => Promise<void>;
  retry: (batchId: string) => Promise<string | null>;
}

const TERMINAL_STATUSES: StemBatchStatus["status"][] = ["completed", "failed", "cancelled"];

export function useUserStemBatches(
  options: UseUserStemBatchesOptions = {},
): UseUserStemBatchesResult {
  const { enabled = true, notify = true } = options;
  const [batches, setBatches] = useState<StemBatchStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const notifiedRef = useRef<Set<string>>(new Set());
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  const upsert = useCallback(
    (incoming: StemBatchStatus) => {
      setBatches((prev) => {
        const idx = prev.findIndex((b) => b.id === incoming.id);
        const next = idx >= 0 ? [...prev.slice(0, idx), incoming, ...prev.slice(idx + 1)] : [incoming, ...prev];
        // Keep list bounded (5 most recent) to avoid unbounded memory growth.
        return next.slice(0, 5);
      });

      if (!notify) return;
      const key = `${incoming.id}:${incoming.status}`;
      if (TERMINAL_STATUSES.includes(incoming.status) && !notifiedRef.current.has(key)) {
        notifiedRef.current.add(key);
        if (incoming.status === "completed") {
          const { summary } = incoming.results;
          toast.success("Стемы готовы", {
            description: `Успешно: ${summary.success}/${summary.total}`,
          });
        } else if (incoming.status === "failed") {
          toast.error("Ошибка обработки стемов", {
            description: "Попробуйте перезапустить обработку",
          });
        } else if (incoming.status === "cancelled") {
          toast.info("Обработка стемов отменена");
        }
      }
    },
    [notify],
  );

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { data: userResult } = await supabase.auth.getUser();
        const userId = userResult.user?.id;
        if (!userId || cancelled) {
          setLoading(false);
          return;
        }

        try {
          const active = await getActiveUserBatches(userId);
          if (!cancelled) setBatches(active);
        } catch (err) {
          logger.warn("useUserStemBatches: failed to load active batches", {
            error: err instanceof Error ? err.message : String(err),
          });
        }

        if (cancelled) return;

        subscriptionRef.current = subscribeToUserBatches(userId, (status) => {
          upsert(status);
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [enabled, upsert]);

  const cancel = useCallback(async (batchId: string) => {
    try {
      await cancelBatch(batchId);
    } catch (err) {
      logger.warn("useUserStemBatches: cancel failed", {
        batchId,
        error: err instanceof Error ? err.message : String(err),
      });
      toast.error("Не удалось отменить обработку");
    }
  }, []);

  const retry = useCallback(async (batchId: string) => {
    try {
      const newId = await retryBatch(batchId);
      toast.info("Повторный запуск обработки");
      return newId;
    } catch (err) {
      logger.warn("useUserStemBatches: retry failed", {
        batchId,
        error: err instanceof Error ? err.message : String(err),
      });
      toast.error("Не удалось повторить обработку");
      return null;
    }
  }, []);

  // Prefer the freshest non-terminal batch, otherwise the newest terminal one.
  const latest =
    batches.find((b) => !TERMINAL_STATUSES.includes(b.status)) ?? batches[0] ?? null;

  return { batches, latest, loading, cancel, retry };
}
