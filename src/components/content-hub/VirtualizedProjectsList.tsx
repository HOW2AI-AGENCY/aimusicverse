import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FolderOpen, MoreVertical, Trash2, Music, Calendar, Disc, ChevronRight, Sparkles, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, ru } from '@/lib/date-utils';
import { motion } from '@/lib/motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Project {
  id: string;
  title: string;
  cover_url: string | null;
  status: string | null;
  project_type: string | null;
  genre: string | null;
  created_at: string | null;
}

interface VirtualizedProjectsListProps {
  projects: Project[];
  viewMode: 'grid' | 'list';
  onDelete: (id: string) => void;
  statusLabels: Record<string, { label: string; color: string }>;
  typeLabels: Record<string, string>;
}

export function VirtualizedProjectsList({
  projects,
  viewMode,
  onDelete,
  statusLabels,
  typeLabels,
}: VirtualizedProjectsListProps) {
  const navigate = useNavigate();

  const defaultStatus = { label: 'Черновик', color: 'bg-muted text-muted-foreground' };
  
  const ProjectGridCard = useCallback(({ project, index }: { project: Project; index: number }) => {
    const status = statusLabels[project.status || 'draft'] || defaultStatus;
    const projectType = typeLabels[project.project_type || 'album'] || project.project_type;

    const isPublished = project.status === 'published';

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, delay: index * 0.04 }}
        whileHover={{ y: -4 }}
        onClick={() => navigate(`/projects/${project.id}`)}
        className={cn(
          "group relative overflow-hidden rounded-2xl cursor-pointer touch-manipulation",
          "bg-gradient-to-br from-card/95 to-card/85 border border-border/60",
          "hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10",
          "transition-all duration-300 active:scale-[0.98]"
        )}
      >
        {/* Glow effect for published */}
        {isPublished && (
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] 
            }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        )}

        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5">
          {project.cover_url ? (
            <motion.img
              src={project.cover_url}
              alt={project.title}
              className="w-full h-full object-cover"
              loading="lazy"
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.5 }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Disc className="w-16 h-16 text-primary/30" />
              </motion.div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="absolute top-2 left-2">
            <Badge className="bg-black/60 backdrop-blur-sm text-white border-0 text-[10px] h-5 px-2 shadow-lg">
              {projectType}
            </Badge>
          </div>

          <div className="absolute top-2 right-2 z-10">
            <motion.div whileHover={{ scale: 1.05 }}>
              <Badge className={cn(
                "text-[10px] h-5 px-2 border-0 backdrop-blur-sm shadow-lg",
                status.color,
                isPublished && "flex items-center gap-1"
              )}>
                {isPublished && <Globe className="w-2.5 h-2.5" />}
                {status.label}
              </Badge>
            </motion.div>
          </div>

          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="secondary" size="icon" className="h-8 w-8 backdrop-blur-md shadow-lg">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/projects/${project.id}`);
                }}>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Открыть
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project.id);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="p-3 space-y-2">
          <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            {project.genre && (
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                <Music className="w-2.5 h-2.5 mr-0.5" />
                {project.genre}
              </Badge>
            )}
            {project.created_at && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Calendar className="w-2.5 h-2.5" />
                {format(new Date(project.created_at), 'd MMM', { locale: ru })}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }, [navigate, statusLabels, typeLabels, onDelete]);

  const ProjectListItem = useCallback(({ project, index }: { project: Project; index: number }) => {
    const status = statusLabels[project.status || 'draft'] || defaultStatus;
    const projectType = typeLabels[project.project_type || 'album'] || project.project_type;
    const isPublished = project.status === 'published';

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: index * 0.02 }}
        whileHover={{ x: 4 }}
        className={cn(
          "group relative overflow-hidden rounded-xl bg-gradient-to-br from-card/80 to-card/40",
          "border border-border/50 hover:border-primary/30 transition-all duration-200",
          "active:scale-[0.99] touch-manipulation"
        )}
      >
        <div
          onClick={() => navigate(`/projects/${project.id}`)}
          className="flex items-center gap-3 p-3 cursor-pointer"
        >
          <div className="relative w-14 h-14 rounded-lg bg-secondary overflow-hidden shrink-0 shadow-md">
            {project.cover_url ? (
              <img
                src={project.cover_url}
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <Disc className="w-6 h-6 text-primary/50" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
              <span className="text-[8px] text-white/90 font-medium uppercase tracking-wide">
                {projectType}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
              {project.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge className={cn(
                "text-[9px] h-4 px-1.5 border-0",
                status.color,
                isPublished && "flex items-center gap-0.5"
              )}>
                {isPublished && <Globe className="w-2.5 h-2.5" />}
                {status.label}
              </Badge>
              {project.genre && (
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                  <Music className="w-2.5 h-2.5 mr-0.5" />
                  {project.genre}
                </Badge>
              )}
            </div>
            {project.created_at && (
              <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                <Calendar className="w-2.5 h-2.5" />
                {format(new Date(project.created_at), 'd MMM yyyy', { locale: ru })}
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                navigate(`/projects/${project.id}`);
              }}>
                <FolderOpen className="w-4 h-4 mr-2" />
                Открыть
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project.id);
                }}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
      </motion.div>
    );
  }, [navigate, statusLabels, typeLabels, onDelete]);

  // Simple rendering without virtualization for better reliability
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {projects.map((project, index) => (
          <ProjectGridCard key={project.id} project={project} index={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((project, index) => (
        <ProjectListItem key={project.id} project={project} index={index} />
      ))}
    </div>
  );
}
