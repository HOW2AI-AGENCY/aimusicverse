import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { voiceCloneApi, type CustomVoice } from "@/api/voice-clone.api";
import { logger } from "@/lib/logger";

export function useCustomVoices() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["custom-voices", user?.id],
    queryFn: () => voiceCloneApi.list(user!.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  // Realtime subscription with unique channel name (StrictMode-safe)
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`custom_voices-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "custom_voices", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["custom-voices", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  const remove = useMutation({
    mutationFn: (id: string) => voiceCloneApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-voices", user?.id] }),
    onError: (e) => logger.error("Delete voice failed", e as Error),
  });

  return {
    voices: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    deleteVoice: remove.mutate,
    isDeleting: remove.isPending,
  };
}

export type { CustomVoice };
