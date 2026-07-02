/**
 * useChangeUserSubscription — mutation hook for the admin dialog that
 * overrides a user's subscription tier. Persists via the service layer and
 * invalidates the admin users list when complete.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changeUserSubscriptionTier } from "@/services/admin.service";

export interface ChangeUserSubscriptionInput {
  userId: string;
  tier: string;
  expiresAt: string | null;
  currentTier?: string;
  reason?: string;
}

export function useChangeUserSubscription() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ChangeUserSubscriptionInput>({
    mutationFn: async (input) => changeUserSubscriptionTier(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["user-credits"] });
    },
  });
}
