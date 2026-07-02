/**
 * useWeeklyChallenges — TanStack Query wrapper for WeeklyChallenges panel.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchWeeklyChallengeStats, type WeeklyChallengeStats } from "@/services/gamification/missions.service";

export type { WeeklyChallengeStats };

export function useWeeklyChallenges(weekStartIso: string, weekEndIso: string) {
  const { user } = useAuth();
  return useQuery<WeeklyChallengeStats | null>({
    queryKey: ["weekly-stats", user?.id, weekStartIso, weekEndIso],
    queryFn: async () => {
      if (!user?.id) return null;
      return fetchWeeklyChallengeStats(user.id, weekStartIso, weekEndIso);
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}
