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
  { id: 'projects', label: 'Проекты', shortLabel: 'Проекты', icon: FolderOpen },
  { id: 'artists', label: 'Артисты', shortLabel: 'Артисты', icon: Users },
  { id: 'lyrics', label: 'Тексты', shortLabel: 'Тексты', icon: FileText },
  { id: 'cloud', label: 'Облако', shortLabel: 'Облако', icon: Cloud },
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
        "w-full grid bg-muted/50 border border-border/30 rounded-xl p-1",
        "grid-cols-4"
      )}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className={cn(
              "flex items-center justify-center rounded-lg font-medium transition-all",
              "data-[state=active]:bg-background data-[state=active]:shadow-sm",
              isMobile 
                ? "flex-col gap-0.5 py-2 px-1 text-[11px]" 
                : "gap-1.5 py-2 px-3 text-xs"
            )}
          >
            <tab.icon className={cn("shrink-0", isMobile ? "w-4 h-4" : "w-4 h-4")} />
            <span className="leading-tight truncate">
              {isMobile ? tab.shortLabel : tab.label}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      <Suspense fallback={<TabLoader />}>
        <TabsContent value="projects" className="mt-3 focus-visible:outline-none">
          <ProjectsTab />
        </TabsContent>

        <TabsContent value="artists" className="mt-3 focus-visible:outline-none">
          <ArtistsTab />
        </TabsContent>

        <TabsContent value="lyrics" className="mt-3 focus-visible:outline-none">
          <LyricsTab />
        </TabsContent>

        <TabsContent value="cloud" className="mt-3 focus-visible:outline-none">
          <CloudTab />
        </TabsContent>
      </Suspense>
    </Tabs>
  );
}
