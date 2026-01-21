import { useState, useEffect, lazy, Suspense } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FolderOpen, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * ContentHubTabs - Simplified to 2 essential tabs
 * Phase 1 UX Improvement: Reduced cognitive load
 * - Projects: Music projects management
 * - Lyrics: Saved lyrics and templates
 * 
 * Artists and Cloud moved to Profile section
 */

// Lazy load tabs to prevent circular dependencies and improve initial load
const ProjectsTab = lazy(() => import('./tabs/ProjectsTab').then(m => ({ default: m.ProjectsTab })));
const LyricsTab = lazy(() => import('./tabs/LyricsTab').then(m => ({ default: m.LyricsTab })));

interface ContentHubTabsProps {
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
}

const tabs = [
  { id: 'projects', label: 'Проекты', icon: FolderOpen },
  { id: 'lyrics', label: 'Тексты', icon: FileText },
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
        "grid-cols-2"
      )}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className={cn(
              "flex items-center justify-center rounded-lg font-medium transition-all",
              "data-[state=active]:bg-background data-[state=active]:shadow-sm",
              isMobile 
                ? "flex-col gap-0.5 py-2.5 px-2 text-xs" 
                : "gap-2 py-2.5 px-4 text-sm"
            )}
          >
            <tab.icon className="shrink-0 w-4 h-4" />
            <span className="leading-tight">
              {tab.label}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      <Suspense fallback={<TabLoader />}>
        <TabsContent value="projects" className="mt-3 focus-visible:outline-none">
          <ProjectsTab />
        </TabsContent>

        <TabsContent value="lyrics" className="mt-3 focus-visible:outline-none">
          <LyricsTab />
        </TabsContent>
      </Suspense>
    </Tabs>
  );
}
