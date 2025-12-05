import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminAuth() {
  return useQuery({
    queryKey: ["admin-auth"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { isAdmin: false };

      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      return { isAdmin: !!data, userId: user.id };
    },
    staleTime: 1000 * 60 * 5,
  });
}
