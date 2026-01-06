/**
 * ProjectMeta - Project metadata badges and info
 * 
 * Used in:
 * - UnifiedProjectCard
 * - ProjectDetail
 * - Project lists
 */

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Music, Calendar, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, ru } from '@/lib/date-utils';

interface ProjectMetaProps {
  /** Project status */
  status?: string | null;
  /** Project type (album, ep, single) */
  projectType?: string | null;
  /** Genre */
  genre?: string | null;
  /** Created date */
  createdAt?: string | null;
  /** Status labels mapping */
  statusLabels?: Record<string, { label: string; color: string }>;
  /** Type labels mapping */
  typeLabels?: Record<string, string>;
  /** Display variant */
  variant?: 'default' | 'compact' | 'badges-only';
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

export const ProjectMeta = memo(function ProjectMeta({
  status,
  projectType,
  genre,
  createdAt,
  statusLabels = DEFAULT_STATUS_LABELS,
  typeLabels = DEFAULT_TYPE_LABELS,
  variant = 'default',
  className,
}: ProjectMetaProps) {
  const statusConfig = statusLabels[status || 'draft'] || DEFAULT_STATUS;
  const typeLabel = typeLabels[projectType || 'album'] || projectType;
  const isPublished = status === 'published';

  if (variant === 'badges-only') {
    return (
      <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
        {isPublished ? (
          <Badge className={cn("h-4 w-4 p-0 border-0 flex items-center justify-center", statusConfig.color)} title={statusConfig.label}>
            <Globe className="w-2.5 h-2.5" />
          </Badge>
        ) : (
          <Badge className={cn("text-[9px] h-4 px-1.5 border-0", statusConfig.color)}>
            {statusConfig.label}
          </Badge>
        )}
        {genre && (
          <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
            <Music className="w-2.5 h-2.5 mr-0.5" />
            {genre}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Badges row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {isPublished ? (
          <Badge className={cn("h-4 w-4 p-0 border-0 flex items-center justify-center", statusConfig.color)} title={statusConfig.label}>
            <Globe className="w-2.5 h-2.5" />
          </Badge>
        ) : (
          <Badge className={cn("text-[9px] h-4 px-1.5 border-0", statusConfig.color)}>
            {statusConfig.label}
          </Badge>
        )}
        {genre && (
          <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
            <Music className="w-2.5 h-2.5 mr-0.5" />
            {genre}
          </Badge>
        )}
      </div>

      {/* Date row */}
      {createdAt && variant === 'default' && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Calendar className="w-2.5 h-2.5" />
          {format(new Date(createdAt), 'd MMM yyyy', { locale: ru })}
        </div>
      )}
    </div>
  );
});

/**
 * Type badge for cover overlay
 */
export const ProjectTypeBadge = memo(function ProjectTypeBadge({
  projectType,
  typeLabels = DEFAULT_TYPE_LABELS,
  variant = 'overlay',
  className,
}: {
  projectType?: string | null;
  typeLabels?: Record<string, string>;
  variant?: 'overlay' | 'inline';
  className?: string;
}) {
  const typeLabel = typeLabels[projectType || 'album'] || projectType;

  if (variant === 'overlay') {
    return (
      <Badge className={cn(
        "bg-black/60 backdrop-blur-sm text-white border-0 text-[10px] h-5 px-2 shadow-lg",
        className
      )}>
        {typeLabel}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={cn("text-[9px] h-4 px-1.5", className)}>
      {typeLabel}
    </Badge>
  );
});

/**
 * Status badge for cover overlay
 */
export const ProjectStatusBadge = memo(function ProjectStatusBadge({
  status,
  statusLabels = DEFAULT_STATUS_LABELS,
  className,
}: {
  status?: string | null;
  statusLabels?: Record<string, { label: string; color: string }>;
  className?: string;
}) {
  const statusConfig = statusLabels[status || 'draft'] || DEFAULT_STATUS;
  const isPublished = status === 'published';

  return (
    <Badge className={cn(
      "text-[10px] h-5 px-2 border-0 backdrop-blur-sm shadow-lg",
      statusConfig.color,
      isPublished && "flex items-center gap-1",
      className
    )}>
      {isPublished && <Globe className="w-2.5 h-2.5" />}
      {statusConfig.label}
    </Badge>
  );
});

export default ProjectMeta;
