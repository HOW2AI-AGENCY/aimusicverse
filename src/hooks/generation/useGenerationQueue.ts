import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface QueueStatus {
  totalPending: number;
  userPosition: number | null;
  estimatedWaitSeconds: number;
  isRateLimited: boolean;
}

export function useGenerationQueue() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["generation-queue", user?.id],
    queryFn: async (): Promise<QueueStatus> => {
      const { data: pendingTasks, error } = await supabase
        .from("generation_tasks")
        .select("id, user_id, created_at")
        .in("status", ["pending", "processing"])
        .order("created_at", { ascending: true });

      if (error) throw error;

      const tasks = pendingTasks || [];
      const totalPending = tasks.length;

      let userPosition: number | null = null;
      if (user?.id) {
        const idx = tasks.findIndex((t) => t.user_id === user.id);
        if (idx >= 0) userPosition = idx + 1;
      }

      const avgGenerationTime = 45;
      const estimatedWaitSeconds = userPosition
        ? (userPosition - 1) * avgGenerationTime
        : totalPending * avgGenerationTime;

      const isRateLimited = totalPending > 10;

      return { totalPending, userPosition, estimatedWaitSeconds, isRateLimited };
    },
    enabled: !!user?.id,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}
