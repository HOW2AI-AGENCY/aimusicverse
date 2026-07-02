import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

/**
 * Returns the current user's Telegram identifiers.
 *
 * After the profiles security hardening migration, the columns
 * `telegram_id` and `telegram_chat_id` are no longer readable through the
 * authenticated PostgREST role — only `service_role` (edge functions) and
 * the `get_own_telegram_ids()` SECURITY DEFINER RPC can access them.
 *
 * Use this helper anywhere the client previously did
 *   supabase.from('profiles').select('telegram_id').eq('user_id', user.id)
 */
export interface OwnTelegramIds {
  telegram_id: number | null;
  telegram_chat_id: string | null;
}

export async function getOwnTelegramIds(): Promise<OwnTelegramIds | null> {
  try {
    const { data, error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase typed client lacks get_own_telegram_ids RPC overload
      .rpc("get_own_telegram_ids" as any);

    if (error) {
      logger.error("get_own_telegram_ids RPC failed", error);
      return null;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;

    return {
      telegram_id:
        typeof row.telegram_id === "number"
          ? row.telegram_id
          : row.telegram_id != null
            ? Number(row.telegram_id)
            : null,
      telegram_chat_id: row.telegram_chat_id ?? null,
    };
  } catch (err) {
    logger.error("get_own_telegram_ids threw", err as Error);
    return null;
  }
}
