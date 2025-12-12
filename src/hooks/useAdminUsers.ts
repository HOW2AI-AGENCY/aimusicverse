import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserWithRoles {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  created_at: string;
  roles: string[];
  subscription_tier?: string;
  subscription_expires_at?: string | null;
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Fetch profiles with subscription info
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*, subscription_tier, subscription_expires_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Merge roles with profiles
      const rolesByUser = new Map<string, string[]>();
      roles?.forEach((r) => {
        const existing = rolesByUser.get(r.user_id) || [];
        existing.push(r.role);
        rolesByUser.set(r.user_id, existing);
      });

      return profiles?.map((p) => ({
        ...p,
        roles: rolesByUser.get(p.user_id) || [],
      })) as UserWithRoles[];
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: totalTracks },
        { count: totalProjects },
        { count: totalPlaylists },
        { count: publicTracks },
        { count: generationTasks },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("tracks").select("*", { count: "exact", head: true }),
        supabase.from("music_projects").select("*", { count: "exact", head: true }),
        supabase.from("playlists").select("*", { count: "exact", head: true }),
        supabase.from("tracks").select("*", { count: "exact", head: true }).eq("is_public", true),
        supabase.from("generation_tasks").select("*", { count: "exact", head: true }),
      ]);

      return {
        totalUsers: totalUsers || 0,
        totalTracks: totalTracks || 0,
        totalProjects: totalProjects || 0,
        totalPlaylists: totalPlaylists || 0,
        publicTracks: publicTracks || 0,
        generationTasks: generationTasks || 0,
      };
    },
  });
}

export function useToggleUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role, action }: { userId: string; role: "admin" | "moderator"; action: "add" | "remove" }) => {
      if (action === "add") {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Роль обновлена");
    },
    onError: (error) => {
      toast.error("Ошибка обновления роли: " + error.message);
    },
  });
}
