/**
 * ProjectQuickActions - Quick action buttons row
 */

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles, Image } from 'lucide-react';
import { ShareProjectCard } from '@/components/project/ShareProjectCard';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  title: string;
  cover_url: string | null;
  genre: string | null;
  project_type?: string | null;
  mood?: string | null;
  concept?: string | null;
}

interface ProjectQuickActionsProps {
  project: Project;
  totalTracks: number;
  tracksWithMaster: number;
  isGenerating?: boolean;
  onAddTrack: () => void;
  onGenerateTracklist: () => void;
  onOpenAiDialog: () => void;
  onOpenMediaGenerator: () => void;
  isMobile?: boolean;
}

export const ProjectQuickActions = memo(function ProjectQuickActions({
  project,
  totalTracks,
  tracksWithMaster,
  isGenerating = false,
  onAddTrack,
  onGenerateTracklist,
  onOpenAiDialog,
  onOpenMediaGenerator,
  isMobile = false,
}: ProjectQuickActionsProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none",
      isMobile ? "px-3" : "px-4"
    )}>
      <Button 
        variant="default" 
        size="sm"
        onClick={onAddTrack}
        className="gap-1 shrink-0 h-7 px-2 text-xs"
      >
        <Plus className="w-3.5 h-3.5" />
        Добавить
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={onGenerateTracklist}
        disabled={isGenerating}
        className="gap-1 shrink-0 h-7 px-2 text-xs"
      >
        <Sparkles className="w-3.5 h-3.5" />
        {isGenerating ? 'Генерация...' : 'AI'}
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={onOpenAiDialog}
        className="gap-1 shrink-0 h-7 px-2 text-xs"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Действия
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={onOpenMediaGenerator}
        className="gap-1 shrink-0 h-7 px-2 text-xs"
      >
        <Image className="w-3.5 h-3.5" />
        Медиа
      </Button>
      
      <ShareProjectCard 
        project={{
          id: project.id,
          title: project.title,
          cover_url: project.cover_url,
          genre: project.genre,
          total_tracks_count: totalTracks,
          approved_tracks_count: tracksWithMaster,
        }}
        variant="button"
        className="gap-1 shrink-0 h-7 px-2 text-xs"
      />
    </div>
  );
});

export default ProjectQuickActions;
