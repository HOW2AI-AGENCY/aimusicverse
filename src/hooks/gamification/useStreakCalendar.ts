/**
 * useStreakCalendar — TanStack Query wrapper for StreakCalendar panel.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchStreakCalendarDays, type CheckinDay } from "@/services/gamification/missions.service";

export type { CheckinDay };

export function useStreakCalendar() {
  const { user } = useAuth();
  return useQuery<CheckinDay[]>({
    queryKey: ["user-checkins-calendar", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const since = new Date();
      since.setDate(since.getDate() - 30);
      return fetchStreakCalendarDays(user.id, since.toISOString().split("T")[0]);
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}
