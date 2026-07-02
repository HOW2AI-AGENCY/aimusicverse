/**
 * useSpecialChallenges — TanStack Query wrapper for SpecialChallenges panel.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchSpecialChallengeStats, type SpecialChallengeStats } from "@/services/gamification/missions.service";

export type { SpecialChallengeStats };

export function useSpecialChallenges() {
  const { user } = useAuth();
  return useQuery<SpecialChallengeStats | null>({
    queryKey: ["special-challenge-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return fetchSpecialChallengeStats(user.id);
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}
