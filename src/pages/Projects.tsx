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
      
      {/* Header with centered logo on mobile */}
      <div className={cn(
        "sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50",
        isMobile 
          ? "px-4 pt-[max(calc(var(--tg-content-safe-area-inset-top,0px)+0.5rem),calc(env(safe-area-inset-top,0px)+0.5rem))] pb-2" 
          : "px-4 py-2.5"
      )}>
        <div className="max-w-6xl mx-auto">
          {/* Centered Logo - mobile only */}
          {isMobile && (
            <div className="flex justify-center mb-2">
              <div className="flex flex-col items-center">
                <img 
                  src="/lovable-uploads/e2a6a5f1-c3e6-42bc-95c6-fd65dcb9defe.png" 
                  alt="MusicVerse AI" 
                  className="h-10 w-10 rounded-xl shadow-md" 
                />
                <span className="text-xs font-bold text-gradient leading-tight mt-1">
                  MusicVerse AI
                </span>
              </div>
            </div>
          )}
          
          {/* Title row with back button */}
          <div className="flex items-center gap-3">
            {shouldShowUIButton && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <h1 className="text-lg sm:text-xl font-bold">Мой контент</h1>
          </div>
        </div>
      </div>

      <div className={cn("max-w-6xl mx-auto", isMobile ? "px-4 py-3" : "px-4 py-4")}>
        <ContentHubTabs defaultTab={initialTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}
