import { useState, useEffect, lazy, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mic, PenLine, Layers, Headphones, ArrowLeft } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { cn } from '@/lib/utils';

// Lazy load studio components
const MusicLab = lazy(() => import('./MusicLab'));
const LyricsStudio = lazy(() => import('./LyricsStudio'));
const StudioHubPage = lazy(() => import('./studio-v2/StudioHubPage'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const STUDIO_TABS = [
  { id: 'record', label: 'Запись', icon: Mic, description: 'Микрофон, гитара, загрузка аудио' },
  { id: 'write', label: 'Текст', icon: PenLine, description: 'AI-помощник для лирики' },
  { id: 'edit', label: 'Редактор', icon: Layers, description: 'DAW, стемы, секции' },
  { id: 'mix', label: 'Микс', icon: Headphones, description: 'PromptDJ, эффекты' },
] as const;

type StudioTab = typeof STUDIO_TABS[number]['id'];

export default function Studio() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabParam = searchParams.get('tab') as StudioTab | null;
  const [activeTab, setActiveTab] = useState<StudioTab>(tabParam || 'record');

  // Telegram BackButton
  useTelegramBackButton({
    visible: true,
    fallbackPath: '/',
  });

  // Sync tab with URL
  useEffect(() => {
    if (tabParam && STUDIO_TABS.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    const newTab = value as StudioTab;
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Студия</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {STUDIO_TABS.find(t => t.id === activeTab)?.description}
          </p>
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
        <div className="border-b border-border bg-muted/30">
          <TabsList className="h-12 w-full justify-start rounded-none bg-transparent p-0 gap-0">
            {STUDIO_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "h-full rounded-none border-b-2 border-transparent px-4 gap-2",
                  "data-[state=active]:border-primary data-[state=active]:bg-transparent",
                  "data-[state=active]:text-primary data-[state=active]:shadow-none"
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          <TabsContent value="record" className="h-full m-0">
            <Suspense fallback={<LoadingFallback />}>
              <MusicLab />
            </Suspense>
          </TabsContent>

          <TabsContent value="write" className="h-full m-0">
            <Suspense fallback={<LoadingFallback />}>
              <LyricsStudio />
            </Suspense>
          </TabsContent>

          <TabsContent value="edit" className="h-full m-0">
            <Suspense fallback={<LoadingFallback />}>
              <StudioHubPage />
            </Suspense>
          </TabsContent>

          <TabsContent value="mix" className="h-full m-0">
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
              <Headphones className="h-16 w-16 text-muted-foreground/50" />
              <div>
                <h2 className="text-xl font-semibold mb-2">PromptDJ</h2>
                <p className="text-muted-foreground max-w-md">
                  Микширование и эффекты скоро будут доступны. 
                  Пока используйте редактор для работы со стемами.
                </p>
              </div>
              <Button onClick={() => handleTabChange('edit')}>
                Открыть редактор
              </Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
