/**
 * useDailyMissions — TanStack Query wrappers for DailyMissions panel.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { triggerHapticFeedback } from "@/lib/mobile-utils";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import {
  fetchDailyActivity,
  claimMissionReward,
  type MissionRewardInput,
  type DailyActivity,
} from "@/services/gamification/missions.service";

export type { DailyActivity };

export function useDailyActivity() {
  const { user } = useAuth();
  return useQuery<DailyActivity | null>({
    queryKey: ["daily-activity", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const today = new Date().toISOString().split("T")[0];
      return fetchDailyActivity(user.id, today);
    },
    enabled: !!user?.id,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export interface ClaimMissionVariables {
  missionId: string;
  title: string;
  credits: number;
  xp: number;
}

export function useClaimMissionReward() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: ClaimMissionVariables) => {
      if (!user?.id) throw new Error("Not authenticated");
      const input: MissionRewardInput = {
        userId: user.id,
        missionId: variables.missionId,
        title: variables.title,
        credits: variables.credits,
        xp: variables.xp,
      };
      return claimMissionReward(input);
    },
    onSuccess: (_data, variables) => {
      triggerHapticFeedback("success");
      toast.success(`+${variables.credits} кредитов за миссию "${variables.title}"!`);
      queryClient.invalidateQueries({ queryKey: ["daily-activity"] });
      queryClient.invalidateQueries({ queryKey: ["user-credits"] });
    },
    onError: (error: unknown) => {
      logger.error("Failed to claim mission", error instanceof Error ? error : new Error(String(error)));
      toast.error("Не удалось получить награду");
    },
  });
}
