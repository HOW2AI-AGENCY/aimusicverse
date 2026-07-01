/**
 * useCloudAudioList
 *
 * TanStack Query wrapper for listing the current user's reference audio.
 * Replaces the direct `supabase.from('reference_audio')` call in
 * CloudAudioPicker.
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { listCloudAudio, type CloudAudio } from "@/services/audio-reference/cloud-audio.service";

interface UseCloudAudioListOptions {
  enabled?: boolean;
  limit?: number;
}

export function useCloudAudioList({ enabled, limit = 50 }: UseCloudAudioListOptions = {}) {
  const { user } = useAuth();

  return useQuery<CloudAudio[]>({
    queryKey: ["cloud-audio", user?.id, limit],
    queryFn: () => listCloudAudio(user!.id, limit),
    enabled: enabled !== false && !!user,
    staleTime: 30_000,
  });
}
