import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ContentHubTabs } from '@/components/content-hub/ContentHubTabs';
import { SEOHead, SEO_PRESETS } from '@/components/SEOHead';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const VALID_TABS = ['artists', 'projects', 'lyrics', 'cloud'];

export default function Projects() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get initial tab from URL or default to 'projects'
  const urlTab = searchParams.get('tab');
  const initialTab = urlTab && VALID_TABS.includes(urlTab) ? urlTab : 'projects';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Sync tab with URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && VALID_TABS.includes(tab) && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  // Telegram BackButton - returns to home
  const { shouldShowUIButton } = useTelegramBackButton({
    visible: true,
    fallbackPath: '/',
  });

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
      
      {/* Compact Header - no logo on mobile for internal pages */}
      <div className={cn(
        "sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50",
        isMobile 
          ? "px-4 pt-[max(calc(var(--tg-content-safe-area-inset-top,0px)+0.25rem),calc(env(safe-area-inset-top,0px)+0.25rem))] pb-1.5" 
          : "px-4 py-2.5"
      )}>
        <div className="max-w-6xl mx-auto">
          {/* Title row with back button - compact on mobile */}
          <div className="flex items-center gap-2">
            {shouldShowUIButton && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 -ml-1"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <h1 className={cn(
              "font-bold",
              isMobile ? "text-base" : "text-lg sm:text-xl"
            )}>
              Мой контент
            </h1>
          </div>
        </div>
      </div>

      <div className={cn("max-w-6xl mx-auto", isMobile ? "px-4 py-3" : "px-4 py-4")}>
        <ContentHubTabs defaultTab={initialTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}
