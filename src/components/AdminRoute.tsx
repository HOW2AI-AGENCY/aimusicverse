import { Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { PageSkeleton } from "@/components/skeletons/PageSkeleton";

/**
 * AdminRoute - guards admin pages with server-validated role check.
 * Non-admin authenticated users are redirected to the home page so admin
 * UI structure is never revealed.
 */
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { data, isLoading, isError } = useAdminAuth();

  if (isLoading) return <PageSkeleton variant="default" />;
  if (isError || !data?.isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
};
