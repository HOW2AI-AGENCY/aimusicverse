/**
 * useUpsellThrottle - React hook for upsell throttling
 */

import { useCallback, useMemo } from "react";
import { canShowUpsell, recordUpsellShown } from "@/services/upsell-strategy.service";

type UpsellType = "banner" | "paywall" | "badge";

export function useUpsellThrottle(type: UpsellType) {
  const canShow = useMemo(() => canShowUpsell(type), [type]);

  const recordShown = useCallback(() => {
    recordUpsellShown(type);
  }, [type]);

  return { canShow, recordShown };
}
