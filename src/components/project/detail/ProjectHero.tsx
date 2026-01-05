/**
 * ProjectHero - Project cover and header section
 */

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Settings, Disc, Music, Globe, Calendar } from 'lucide-react';
import { motion } from '@/lib/motion';
import { format, ru } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  title: string;
  cover_url: string | null;
  description: string | null;
  genre: string | null;
  mood: string | null;
  status: string | null;
  project_type: string | null;
  created_at: string | null;
  is_public: boolean | null;
}

interface ProjectHeroProps {
  project: Project;
  totalTracks: number;
  tracksWithMaster: number;
  onBack: () => void;
  onOpenSettings: () => void;
  isMobile?: boolean;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Черновик', color: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'В работе', color: 'bg-blue-500/20 text-blue-500' },
  review: { label: 'На проверке', color: 'bg-amber-500/20 text-amber-500' },
  published: { label: 'Опубликован', color: 'bg-emerald-500/20 text-emerald-500' },
};

const TYPE_LABELS: Record<string, string> = {
  album: 'Альбом',
  ep: 'EP',
  single: 'Сингл',
  compilation: 'Сборник',
};

export const ProjectHero = memo(function ProjectHero({
  project,
  totalTracks,
  tracksWithMaster,
  onBack,
  onOpenSettings,
  isMobile = false,
}: ProjectHeroProps) {
  const status = STATUS_LABELS[project.status || 'draft'] || STATUS_LABELS.draft;
  const projectType = TYPE_LABELS[project.project_type || 'album'] || project.project_type;
  const isPublished = project.status === 'published';

  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5">
        {project.cover_url ? (
          <motion.img
            src={project.cover_url}
            alt={project.title}
            className="w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
            >
              <Disc className="w-24 h-24 text-primary/30" />
            </motion.div>
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Navigation buttons */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 bg-background/80 backdrop-blur-sm"
            onClick={onBack}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 bg-background/80 backdrop-blur-sm"
            onClick={onOpenSettings}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Project Info - overlaid on cover bottom */}
      <div className={cn("px-4 pb-4 -mt-16 relative z-10", isMobile && "px-3")}>
        <div className="space-y-3">
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground drop-shadow-sm">
            {project.title}
          </h1>
          
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type badge */}
            <Badge className="bg-background/80 backdrop-blur-sm border-0 text-xs">
              {projectType}
            </Badge>
            
            {/* Status badge */}
            <Badge className={cn(
              "border-0 text-xs backdrop-blur-sm",
              status.color,
              isPublished && "flex items-center gap-1"
            )}>
              {isPublished && <Globe className="w-3 h-3" />}
              {status.label}
            </Badge>
            
            {/* Genre */}
            {project.genre && (
              <Badge variant="secondary" className="text-xs">
                <Music className="w-3 h-3 mr-1" />
                {project.genre}
              </Badge>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Music className="w-4 h-4" />
              {tracksWithMaster}/{totalTracks} треков
            </span>
            {project.created_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(project.created_at), 'd MMM yyyy', { locale: ru })}
              </span>
            )}
          </div>

          {/* Description */}
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

export default ProjectHero;
