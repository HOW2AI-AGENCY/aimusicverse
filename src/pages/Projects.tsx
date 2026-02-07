import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ContentHubTabs } from '@/components/content-hub/ContentHubTabs';
import { SEOHead, SEO_PRESETS } from '@/components/SEOHead';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { MobileHeaderBar } from '@/components/mobile/MobileHeaderBar';
import { safeAreaClasses } from '@/hooks/useTelegramSafeArea';
import { DesktopContentHubLayout } from '@/components/content-hub/DesktopContentHubLayout';
import { ProjectDetailPreview } from '@/components/content-hub/ProjectDetailPreview';
import { useProjects } from '@/hooks/useProjects';

const VALID_TABS = ['projects', 'lyrics'];

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: 'Черновик', color: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'В работе', color: 'bg-blue-500/20 text-blue-500' },
  completed: { label: 'Завершен', color: 'bg-green-500/20 text-green-500' },
  released: { label: 'Выпущен', color: 'bg-purple-500/20 text-purple-500' },
  published: { label: 'Опубликован', color: 'bg-emerald-500/20 text-emerald-500' },
};

const typeLabels: Record<string, string> = {
  single: 'Сингл',
  ep: 'EP',
  album: 'Альбом',
  compilation: 'Сборник',
};

export default function Projects() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projects } = useProjects();
  
  // Get initial tab from URL or default to 'projects'
  const urlTab = searchParams.get('tab');
  const initialTab = urlTab && VALID_TABS.includes(urlTab) ? urlTab : 'projects';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Selected project for desktop preview
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const selectedProject = projects?.find(p => p.id === selectedProjectId) || null;
  
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

  // Mobile layout
  if (isMobile) {
    return (
      <div
        className={cn(
          safeAreaClasses.fullHeight,
          safeAreaClasses.containerWithNav
        )}
      >
        <SEOHead {...SEO_PRESETS.projects} />
        <MobileHeaderBar
          title="Мой контент"
          onBack={shouldShowUIButton ? () => navigate('/') : undefined}
          showBack={shouldShowUIButton}
          sticky
        />
        <div className="px-4 py-3">
          <ContentHubTabs 
            defaultTab={initialTab} 
            onTabChange={setActiveTab}
            onProjectSelect={setSelectedProjectId}
          />
        </div>
      </div>
    );
  }

  // Desktop layout with master-detail
  return (
    <div className={cn(safeAreaClasses.fullHeight, safeAreaClasses.containerWithNav)}>
      <SEOHead {...SEO_PRESETS.projects} />

      {/* Desktop Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-2.5">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-lg sm:text-xl font-bold">Мой контент</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <DesktopContentHubLayout
          hasSelection={!!selectedProject && activeTab === 'projects'}
          onCloseDetail={() => setSelectedProjectId(null)}
          detailTitle="Превью проекта"
          detailContent={
            selectedProject ? (
              <ProjectDetailPreview
                project={selectedProject}
                statusLabels={statusLabels}
                typeLabels={typeLabels}
              />
            ) : null
          }
        >
          <ContentHubTabs 
            defaultTab={initialTab} 
            onTabChange={setActiveTab}
            onProjectSelect={setSelectedProjectId}
            selectedProjectId={selectedProjectId}
          />
        </DesktopContentHubLayout>
      </div>
    </div>
  );
}
