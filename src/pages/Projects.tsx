import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
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

export default function Projects() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('projects');

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
      
      {/* Header */}
      <div className={cn(
        "sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50",
        isMobile ? "px-3 py-2" : "px-4 py-2.5"
      )}>
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          {/* UI Fallback Back Button */}
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

      <div className={cn("max-w-6xl mx-auto", isMobile ? "px-3 py-3" : "px-4 py-4")}>
        <ContentHubTabs defaultTab="projects" onTabChange={setActiveTab} />
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
