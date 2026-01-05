/**
 * UnifiedProjectCard - Unified project card with grid/list variants
 * 
 * Replaces:
 * - ProjectGridCard (from VirtualizedProjectsList)
 * - ProjectListItem (from VirtualizedProjectsList)
 * 
 * @see ADR-011 for architecture decisions
 */

import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, MoreVertical, Trash2, Music, Calendar, ChevronRight, Globe, Disc } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, ru } from '@/lib/date-utils';
import { motion } from '@/lib/motion';
import { useIsMobile } from '@/hooks/use-mobile';
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

interface UnifiedProjectCardProps {
  /** Project data */
  project: Project;
  /** Display variant */
  variant: 'grid' | 'list' | 'compact';
  /** Animation index for staggered effects */
  index?: number;
  /** Delete handler */
  onDelete?: (id: string) => void;
  /** Custom navigation handler */
  onNavigate?: (id: string) => void;
  /** Whether to show action menu */
  showActions?: boolean;
  /** Status labels mapping */
  statusLabels?: Record<string, { label: string; color: string }>;
  /** Type labels mapping */
  typeLabels?: Record<string, string>;
  /** Additional className */
  className?: string;
}

const DEFAULT_STATUS = { label: 'Черновик', color: 'bg-muted text-muted-foreground' };

const DEFAULT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Черновик', color: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'В работе', color: 'bg-blue-500/20 text-blue-500' },
  review: { label: 'Проверка', color: 'bg-amber-500/20 text-amber-500' },
  published: { label: 'Опубликован', color: 'bg-emerald-500/20 text-emerald-500' },
};

const DEFAULT_TYPE_LABELS: Record<string, string> = {
  album: 'Альбом',
  ep: 'EP',
  single: 'Сингл',
  compilation: 'Сборник',
};

export const UnifiedProjectCard = memo(function UnifiedProjectCard({
  project,
  variant,
  index = 0,
  onDelete,
  onNavigate,
  showActions = true,
  statusLabels = DEFAULT_STATUS_LABELS,
  typeLabels = DEFAULT_TYPE_LABELS,
  className,
}: UnifiedProjectCardProps) {
  const navigate = useNavigate();
  
  const status = statusLabels[project.status || 'draft'] || DEFAULT_STATUS;
  const projectType = typeLabels[project.project_type || 'album'] || project.project_type;
  const isPublished = project.status === 'published';

  const handleClick = useCallback(() => {
    if (onNavigate) {
      onNavigate(project.id);
    } else {
      navigate(`/projects/${project.id}`);
    }
  }, [onNavigate, navigate, project.id]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(project.id);
  }, [onDelete, project.id]);

  if (variant === 'grid') {
    return (
      <GridCard
        project={project}
        index={index}
        status={status}
        projectType={projectType}
        isPublished={isPublished}
        showActions={showActions}
        onClick={handleClick}
        onDelete={handleDelete}
        className={className}
      />
    );
  }

  if (variant === 'list') {
    return (
      <ListCard
        project={project}
        index={index}
        status={status}
        projectType={projectType}
        isPublished={isPublished}
        showActions={showActions}
        onClick={handleClick}
        onDelete={handleDelete}
        className={className}
      />
    );
  }

  // Compact variant
  return (
    <CompactCard
      project={project}
      status={status}
      projectType={projectType}
      isPublished={isPublished}
      onClick={handleClick}
      className={className}
    />
  );
});

// ========== Grid Variant ==========
interface CardVariantProps {
  project: Project;
  index?: number;
  status: { label: string; color: string };
  projectType: string | null | undefined;
  isPublished: boolean;
  showActions?: boolean;
  onClick: () => void;
  onDelete?: (e: React.MouseEvent) => void;
  className?: string;
}

const GridCard = memo(function GridCard({
  project,
  index = 0,
  status,
  projectType,
  isPublished,
  showActions,
  onClick,
  onDelete,
  className,
}: CardVariantProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl cursor-pointer touch-manipulation",
        "bg-gradient-to-br from-card/95 to-card/85 border border-border/60",
        "hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10",
        "transition-all duration-300 active:scale-[0.98]",
        className
      )}
    >
      {/* Glow effect for published */}
      {isPublished && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      )}

      {/* Cover */}
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

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <Badge className="bg-black/60 backdrop-blur-sm text-white border-0 text-[10px] h-5 px-2 shadow-lg">
            {projectType}
          </Badge>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 right-2 z-10">
          <motion.div whileHover={{ scale: 1.05 }}>
            {isPublished ? (
              <Badge className={cn("h-5 w-5 p-0 border-0 flex items-center justify-center backdrop-blur-sm shadow-lg", status.color)} title={status.label}>
                <Globe className="w-3 h-3" />
              </Badge>
            ) : (
              <Badge className={cn("text-[10px] h-5 px-2 border-0 backdrop-blur-sm shadow-lg", status.color)}>
                {status.label}
              </Badge>
            )}
          </motion.div>
        </div>

        {/* Actions menu - always visible on mobile */}
        {showActions && onDelete && (
          <div className={cn(
            "absolute bottom-2 right-2 z-10 transition-opacity",
            isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <ProjectActionsMenu
              onOpen={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}`); }}
              onDelete={onDelete}
            />
          </div>
        )}
      </div>

      {/* Info */}
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
});

// ========== List Variant ==========
const ListCard = memo(function ListCard({
  project,
  index = 0,
  status,
  projectType,
  isPublished,
  showActions,
  onClick,
  onDelete,
  className,
}: CardVariantProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      whileHover={{ x: 4 }}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-gradient-to-br from-card/80 to-card/40",
        "border border-border/50 hover:border-primary/30 transition-all duration-200",
        "active:scale-[0.99] touch-manipulation",
        className
      )}
    >
      <div onClick={onClick} className="flex items-center gap-3 p-3 cursor-pointer">
        {/* Thumbnail */}
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

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {isPublished ? (
              <Badge className={cn("h-4 w-4 p-0 border-0 flex items-center justify-center", status.color)} title={status.label}>
                <Globe className="w-2.5 h-2.5" />
              </Badge>
            ) : (
              <Badge className={cn("text-[9px] h-4 px-1.5 border-0", status.color)}>
                {status.label}
              </Badge>
            )}
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

        {/* Actions */}
        {showActions && onDelete && (
          <ProjectActionsMenu
            onOpen={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}`); }}
            onDelete={onDelete}
            variant="ghost"
          />
        )}

        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
    </motion.div>
  );
});

// ========== Compact Variant ==========
const CompactCard = memo(function CompactCard({
  project,
  status,
  projectType,
  isPublished,
  onClick,
  className,
}: Omit<CardVariantProps, 'showActions' | 'onDelete' | 'index'>) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg cursor-pointer",
        "hover:bg-muted/50 transition-colors",
        className
      )}
    >
      <div className="w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
        {project.cover_url ? (
          <img
            src={project.cover_url}
            alt={project.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Disc className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{project.title}</p>
        <p className="text-xs text-muted-foreground">{projectType}</p>
      </div>
    </div>
  );
});

// ========== Actions Menu ==========
interface ProjectActionsMenuProps {
  onOpen: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  variant?: 'secondary' | 'ghost';
}

const ProjectActionsMenu = memo(function ProjectActionsMenu({
  onOpen,
  onDelete,
  variant = 'secondary',
}: ProjectActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button 
          variant={variant} 
          size="icon" 
          className={cn(
            "h-8 w-8",
            variant === 'secondary' && "backdrop-blur-md shadow-lg",
            variant === 'ghost' && "opacity-0 group-hover:opacity-100 transition-opacity"
          )}
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50">
        <DropdownMenuItem onClick={onOpen}>
          <FolderOpen className="w-4 h-4 mr-2" />
          Открыть
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          Удалить
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

export default UnifiedProjectCard;
