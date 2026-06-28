import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DeliveryStats {
  totalCompleted: number;
  fullDelivery: number;
  partialDelivery: number;
  deliveryRate: number;
  recentPartials: Array<{
    id: string;
    created_at: string;
    expected_clips: number;
    received_clips: number;
    prompt: string | null;
    model_used: string | null;
  }>;
}

export function useDeliveryTracking(lookbackHours = 24) {
  return useQuery({
    queryKey: ["delivery-tracking", lookbackHours],
    queryFn: async (): Promise<DeliveryStats> => {
      const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();

      const { data: tasks } = await supabase
        .from("generation_tasks")
        .select("id, created_at, expected_clips, received_clips, prompt, model_used, status")
        .gte("created_at", since)
        .in("status", ["completed", "partial_delivery"])
        .order("created_at", { ascending: false });

      const rows = tasks || [];
      let fullDelivery = 0;
      let partialDelivery = 0;
      const recentPartials: DeliveryStats["recentPartials"] = [];

      for (const row of rows) {
        const expected = row.expected_clips ?? 2;
        const received = row.received_clips ?? 0;

        if (received >= expected) {
          fullDelivery++;
        } else {
          partialDelivery++;
          if (recentPartials.length < 10) {
            recentPartials.push({
              id: row.id,
              created_at: row.created_at,
              expected_clips: expected,
              received_clips: received,
              prompt: row.prompt ? row.prompt.slice(0, 80) : null,
              model_used: row.model_used,
            });
          }
        }
      }

      const totalCompleted = fullDelivery + partialDelivery;
      const deliveryRate = totalCompleted > 0 ? (fullDelivery / totalCompleted) * 100 : 100;

      return { totalCompleted, fullDelivery, partialDelivery, deliveryRate, recentPartials };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
