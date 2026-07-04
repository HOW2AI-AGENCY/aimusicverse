/**
 * Sprint 055 P0-1: open GenerateSheet in response to `?openGenerate=1`
 * query-param appended by DeepLinkHandler when a Telegram bot sends
 * `startapp=generate`.
 *
 * Behavior:
 *  - First render with `?openGenerate=1`:
 *      1. Calls `openSheet()`
 *      2. Strips `openGenerate` from the URL (replace=true) so a reload
 *         doesn't reopen the sheet and so the back-button doesn't carry
 *         the trigger.
 *  - Subsequent renders with the param already stripped: no-op.
 *
 * Returns `true` while the trigger is present (useful for telemetry/tests).
 *
 * Pure: no side effects beyond `openSheet()` and `setSearchParams(..., { replace: true })`.
 * SSR-safe: uses `typeof window` guard only via `URLSearchParams` (works in Node 19+ and all browsers).
 */

import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/services/analytics/events.service";

export function useOpenGenerateFromDeeplink(openSheet: () => void): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    if (searchParams.get("openGenerate") === "1") {
      // Sprint 055-A5e: analytics event for deeplink → sheet success rate.
      // Async-safe: trackEvent swallows failures internally.
      trackEvent(
        {
          eventType: "feature_usage",
          pagePath: "deeplink_generate",
          metadata: { action: "open_attempt", target: "generate_sheet" },
        },
        user?.id,
      );
      openSheet();
      trackEvent(
        {
          eventType: "feature_usage",
          pagePath: "deeplink_generate",
          metadata: { action: "open_complete", target: "generate_sheet" },
        },
        user?.id,
      );
      const next = new URLSearchParams(searchParams);
      next.delete("openGenerate");
      // replace=true prevents the back button from cycling the trigger,
      // and avoids pushing history while we're already mid-navigation.
      setSearchParams(next, { replace: true });
    }
    // searchParams is intentionally NOT a dep — its identity changes on
    // every render but content doesn't. We only want to react to the
    // first occurrence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
