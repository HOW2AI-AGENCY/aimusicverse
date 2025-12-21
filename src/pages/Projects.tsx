import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ContentHubTabs } from '@/components/content-hub/ContentHubTabs';
import { SEOHead, SEO_PRESETS } from '@/components/SEOHead';

export default function Projects() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen pb-20">
      <SEOHead {...SEO_PRESETS.projects} />
      {/* Header - simplified to avoid duplication with tabs */}
      <div className={cn(
        "sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50",
        isMobile ? "px-3 py-2" : "px-4 py-2.5"
      )}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-lg sm:text-xl font-bold">Мой контент</h1>
        </div>
      </div>

      <div className={cn("max-w-6xl mx-auto", isMobile ? "px-3 py-3" : "px-4 py-4")}>
        <ContentHubTabs defaultTab="projects" />
      </div>
    </div>
  );
}
