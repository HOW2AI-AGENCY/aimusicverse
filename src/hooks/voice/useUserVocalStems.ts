/**
 * useUserVocalStems
 *
 * Returns vocal stems from the current user's library so they can be
 * reused as a source for VoiceCloneWizard (instead of re-uploading or
 * re-recording every time).
 *
 * A stem is considered "vocal" when its `stem_type` mentions "vocal" or
 * equals "voice". Tracks are filtered server-side by `user_id`.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserVocalStem {
  id: string;
  trackId: string;
  trackTitle: string;
  stemType: string;
  audioUrl: string;
  createdAt: string | null;
}

const VOCAL_HINTS = ["vocal", "voice", "lead", "backing", "harmony", "harmonies"];

export function useUserVocalStems(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-vocal-stems", user?.id],
    enabled: !!user?.id && enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<UserVocalStem[]> => {
      const { data, error } = await supabase
        .from("track_stems")
        .select("id, track_id, stem_type, audio_url, created_at, tracks!inner(id, title, user_id)")
        .eq("tracks.user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const rows = (data ?? []) as Array<{
        id: string;
        track_id: string;
        stem_type: string;
        audio_url: string;
        created_at: string | null;
        tracks: { title: string | null } | null;
      }>;
      return rows
        .filter((r) => {
          const t = (r.stem_type || "").toLowerCase();
          return VOCAL_HINTS.some((h) => t.includes(h));
        })
        .map((r) => ({
          id: r.id,
          trackId: r.track_id,
          trackTitle: r.tracks?.title ?? "Без названия",
          stemType: r.stem_type,
          audioUrl: r.audio_url,
          createdAt: r.created_at,
        }));
    },
  });
}
