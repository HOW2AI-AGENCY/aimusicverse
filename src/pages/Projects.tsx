import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ContentHubTabs } from '@/components/content-hub/ContentHubTabs';
import { SEOHead, SEO_PRESETS } from '@/components/SEOHead';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { useTelegramMainButton } from '@/hooks/telegram/useTelegramMainButton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const TAB_ACTIONS: Record<string, { text: string; action: string }> = {
  artists: { text: 'СОЗДАТЬ АРТИСТА', action: '/artist/create' },
  projects: { text: 'СОЗДАТЬ ПРОЕКТ', action: 'create-project' },
  lyrics: { text: 'НОВЫЙ ТЕКСТ', action: '/lyrics/create' },
  cloud: { text: 'ЗАГРУЗИТЬ ФАЙЛ', action: 'upload-file' },
};

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

  // Handle main button action based on active tab
  const handleMainAction = useCallback(() => {
    const tabAction = TAB_ACTIONS[activeTab];
    if (!tabAction) return;
    
    if (tabAction.action.startsWith('/')) {
      navigate(tabAction.action);
    } else {
      // Dispatch custom event for tab-specific actions
      window.dispatchEvent(new CustomEvent('content-hub-action', { 
        detail: { tab: activeTab, action: tabAction.action } 
      }));
    }
  }, [activeTab, navigate]);

  // Telegram MainButton with dynamic text
  const { shouldShowUIButton: showMainUIButton } = useTelegramMainButton({
    text: TAB_ACTIONS[activeTab]?.text || 'СОЗДАТЬ',
    onClick: handleMainAction,
    visible: true,
    color: 'primary',
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
    <div className={cn("min-h-screen", showMainUIButton ? "pb-24" : "pb-20")}>
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

      {/* UI Fallback Main Button */}
      {showMainUIButton && (
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 z-30">
          <Button 
            className="w-full h-12 text-base font-semibold"
            onClick={handleMainAction}
          >
            {TAB_ACTIONS[activeTab]?.text || 'СОЗДАТЬ'}
          </Button>
        </div>
      )}
    </div>
  );
}
