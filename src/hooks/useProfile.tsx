import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { useGuestMode } from "@/contexts/GuestModeContext";

export interface Profile {
  id: string;
  user_id: string;
  telegram_id: number;
  first_name: string;
  last_name?: string | null;
  username?: string | null;
  display_name?: string | null;
  language_code?: string | null;
  photo_url?: string | null;
  banner_url?: string | null;
  bio?: string | null;
  is_public?: boolean | null;
  subscription_tier?: string | null;
  telegram_chat_id?: number | null;
  profile_completeness?: number | null;
  social_links?: Record<string, string> | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdate {
  first_name?: string;
  last_name?: string | null;
  username?: string | null;
  is_public?: boolean;
  photo_url?: string | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const { isScreenshotMode, screenshotProfile } = useGuestMode();

  // Return mock data in screenshot mode
  if (isScreenshotMode && screenshotProfile) {
    return {
      data: screenshotProfile,
      isLoading: false,
      error: null,
      refetch: () => Promise.resolve({ data: screenshotProfile, error: null }),
      isRefetching: false,
      isFetching: false,
    } as const;
  }

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user?.id,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      if (!user?.id) throw new Error("No user");

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
    onError: (error) => {
      toast.error("Не удалось обновить профиль", {
        description: error.message,
      });
    },
  });
};
