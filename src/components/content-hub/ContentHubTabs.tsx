import { useState, useEffect, lazy, Suspense } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Users, FolderOpen, FileText, Cloud, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// Lazy load tabs to prevent circular dependencies and improve initial load
const ArtistsTab = lazy(() => import('./tabs/ArtistsTab').then(m => ({ default: m.ArtistsTab })));
const ProjectsTab = lazy(() => import('./tabs/ProjectsTab').then(m => ({ default: m.ProjectsTab })));
const LyricsTab = lazy(() => import('./tabs/LyricsTab').then(m => ({ default: m.LyricsTab })));
const CloudTab = lazy(() => import('./tabs/CloudTab').then(m => ({ default: m.CloudTab })));

interface ContentHubTabsProps {
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
}

const tabs = [
  { id: 'artists', label: 'Артисты', shortLabel: 'Арт.', icon: Users },
  { id: 'projects', label: 'Проекты', shortLabel: 'Проек.', icon: FolderOpen },
  { id: 'lyrics', label: 'Тексты', shortLabel: 'Текс.', icon: FileText },
  { id: 'cloud', label: 'Облако', shortLabel: 'Обл.', icon: Cloud },
];

const TabLoader = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

export function ContentHubTabs({ defaultTab = 'projects', onTabChange }: ContentHubTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const isMobile = useIsMobile();

  useEffect(() => {
    onTabChange?.(activeTab);
  }, [activeTab, onTabChange]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className={cn(
        "w-full grid bg-secondary/50 backdrop-blur-sm border border-border/50 rounded-xl p-1",
        "grid-cols-4"
      )}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className={cn(
              "flex items-center justify-center rounded-lg font-medium transition-all",
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
              "data-[state=active]:shadow-sm",
              isMobile 
                ? "flex-col gap-0.5 py-1.5 px-1 text-[10px]" 
                : "gap-1.5 py-2 px-2 text-xs"
            )}
          >
            <tab.icon className={cn("shrink-0", isMobile ? "w-4 h-4" : "w-4 h-4")} />
            <span className={isMobile ? "leading-tight" : ""}>
              {isMobile ? tab.shortLabel : tab.label}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      <Suspense fallback={<TabLoader />}>
        <TabsContent value="artists" className="mt-4 focus-visible:outline-none">
          <ArtistsTab />
        </TabsContent>

        <TabsContent value="projects" className="mt-4 focus-visible:outline-none">
          <ProjectsTab />
        </TabsContent>

        <TabsContent value="lyrics" className="mt-4 focus-visible:outline-none">
          <LyricsTab />
        </TabsContent>

        <TabsContent value="cloud" className="mt-4 focus-visible:outline-none">
          <CloudTab />
        </TabsContent>
      </Suspense>
    </Tabs>
  );
}
