import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Users, FolderOpen, FileText, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArtistsTab } from './tabs/ArtistsTab';
import { ProjectsTab } from './tabs/ProjectsTab';
import { LyricsTab } from './tabs/LyricsTab';
import { CloudTab } from './tabs/CloudTab';

interface ContentHubTabsProps {
  defaultTab?: string;
}

const tabs = [
  { id: 'artists', label: 'Артисты', icon: Users },
  { id: 'projects', label: 'Проекты', icon: FolderOpen },
  { id: 'lyrics', label: 'Тексты', icon: FileText },
  { id: 'cloud', label: 'Облако', icon: Cloud },
];

export function ContentHubTabs({ defaultTab = 'projects' }: ContentHubTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const isMobile = useIsMobile();

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
              "flex items-center justify-center gap-1.5 rounded-lg py-2 px-2 text-xs font-medium transition-all",
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
              "data-[state=active]:shadow-sm"
            )}
          >
            <tab.icon className="w-4 h-4 shrink-0" />
            {!isMobile && <span>{tab.label}</span>}
          </TabsTrigger>
        ))}
      </TabsList>

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
    </Tabs>
  );
}
