import { useQuery } from "@tanstack/react-query";
import * as adminApi from "@/api/admin.api";

export function useAdminAuth() {
  return useQuery({
    queryKey: ["admin-auth"],
    queryFn: async () => {
      const { isAdmin, userId } = await adminApi.getCurrentUserAdminStatus();
      return { isAdmin, userId };
    },
    staleTime: 1000 * 60 * 5,
  });
}
