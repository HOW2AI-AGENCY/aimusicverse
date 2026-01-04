import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ModerationReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  entity_type: string;
  entity_id: string;
  reason: string;
  details: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  // Joined data
  reporter?: {
    username: string | null;
    first_name: string;
  };
  reported_user?: {
    username: string | null;
    first_name: string;
  };
  track?: {
    title: string | null;
    cover_url: string | null;
  };
}

export function useAdminModerationReports(status?: string) {
  return useQuery({
    queryKey: ["admin-moderation-reports", status],
    queryFn: async () => {
      let query = supabase
        .from("moderation_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch related profiles and tracks
      if (!data?.length) return [];

      const reporterIds = [...new Set(data.map(r => r.reporter_id))];
      const reportedUserIds = [...new Set(data.map(r => r.reported_user_id))];
      const trackIds = data.filter(r => r.entity_type === 'track').map(r => r.entity_id);

      const [reportersRes, reportedUsersRes, tracksRes] = await Promise.all([
        supabase.from("profiles").select("user_id, username, first_name").in("user_id", reporterIds),
        supabase.from("profiles").select("user_id, username, first_name").in("user_id", reportedUserIds),
        trackIds.length > 0 
          ? supabase.from("tracks").select("id, title, cover_url").in("id", trackIds)
          : Promise.resolve({ data: [] }),
      ]);

      const reportersMap = new Map(reportersRes.data?.map(p => [p.user_id, p]) || []);
      const reportedUsersMap = new Map(reportedUsersRes.data?.map(p => [p.user_id, p]) || []);
      const tracksMap = new Map(tracksRes.data?.map(t => [t.id, t]) || []);

      return data.map(report => ({
        ...report,
        reporter: reportersMap.get(report.reporter_id),
        reported_user: reportedUsersMap.get(report.reported_user_id),
        track: report.entity_type === 'track' ? tracksMap.get(report.entity_id) : undefined,
      })) as ModerationReport[];
    },
  });
}

export function useUpdateReportStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      reportId, 
      status 
    }: { 
      reportId: string; 
      status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("moderation_reports")
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-moderation-reports"] });
      toast.success("Статус жалобы обновлён");
    },
    onError: (error) => {
      toast.error("Ошибка обновления: " + error.message);
    },
  });
}

export function useModerationStats() {
  return useQuery({
    queryKey: ["admin-moderation-stats"],
    queryFn: async () => {
      const [pending, reviewed, resolved, dismissed] = await Promise.all([
        supabase.from("moderation_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("moderation_reports").select("*", { count: "exact", head: true }).eq("status", "reviewed"),
        supabase.from("moderation_reports").select("*", { count: "exact", head: true }).eq("status", "resolved"),
        supabase.from("moderation_reports").select("*", { count: "exact", head: true }).eq("status", "dismissed"),
      ]);

      return {
        pending: pending.count || 0,
        reviewed: reviewed.count || 0,
        resolved: resolved.count || 0,
        dismissed: dismissed.count || 0,
        total: (pending.count || 0) + (reviewed.count || 0) + (resolved.count || 0) + (dismissed.count || 0),
      };
    },
  });
}
