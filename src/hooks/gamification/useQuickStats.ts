/**
 * useQuickStats — TanStack Query wrapper for QuickStats panel.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchQuickStats, type QuickStatsSummary } from "@/services/gamification/missions.service";

export type { QuickStatsSummary };

export function useQuickStats() {
  const { user } = useAuth();
  return useQuery<QuickStatsSummary | null>({
    queryKey: ["user-quick-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return fetchQuickStats(user.id);
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}
