/**
 * ProjectDetailPreview - Desktop preview panel for selected project
 * Shows project details, tracks, and quick actions
 */

import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Music2, ExternalLink, Play, Edit, MoreHorizontal, FolderOpen } from "lucide-react";
import { ProjectCover } from "@/components/project/ProjectCover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { surface } from "@/lib/overlay-colors";

interface Project {
  id: string;
  title: string;
  cover_url: string | null;
  status: string | null;
  project_type: string | null;
  genre: string | null;
  description?: string | null;
  created_at: string | null;
  total_tracks_count?: number | null;
  approved_tracks_count?: number | null;
}

interface ProjectDetailPreviewProps {
  project: Project;
  statusLabels: Record<string, { label: string; color: string }>;
  typeLabels: Record<string, string>;
  onClose?: () => void;
}

export const ProjectDetailPreview = memo(function ProjectDetailPreview({
  project,
  statusLabels,
  typeLabels,
}: ProjectDetailPreviewProps) {
  const navigate = useNavigate();

  const statusInfo = statusLabels[project.status || "draft"] || statusLabels.draft;
  const typeLabel = typeLabels[project.project_type || "single"] || "Проект";

  const handleOpenProject = () => {
    navigate(`/project/${project.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Cover & Title */}
      <div className="space-y-4">
        <div className="relative aspect-square max-w-[280px] mx-auto rounded-xl overflow-hidden shadow-lg">
          <ProjectCover coverUrl={project.cover_url} alt={project.title} variant="card" className="w-full h-full" />
          {/* Play button overlay */}
          <button
            onClick={handleOpenProject}
            className={cn(
              "absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity",
              surface.imageDark,
            )}
          >
            <div className="w-16 h-16 rounded-full bg-background/90 flex items-center justify-center shadow-xl">
              <Play className="w-7 h-7 text-primary fill-primary ml-1" />
            </div>
          </button>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold truncate">{project.title}</h2>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {typeLabel}
            </Badge>
            <Badge className={cn("text-xs", statusInfo.color)}>{statusInfo.label}</Badge>
            {project.genre && (
              <Badge variant="secondary" className="text-xs">
                {project.genre}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-sm text-muted-foreground text-center line-clamp-3">{project.description}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <Music2 className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-lg font-semibold">{project.total_tracks_count || 0}</p>
          <p className="text-xs text-muted-foreground">Треков</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <Calendar className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-sm font-medium">
            {project.created_at ? format(new Date(project.created_at), "d MMM yyyy", { locale: ru }) : "—"}
          </p>
          <p className="text-xs text-muted-foreground">Создан</p>
        </div>
      </div>

      {/* Progress */}
      {(project.total_tracks_count || 0) > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Прогресс</span>
            <span className="font-medium">
              {project.approved_tracks_count || 0} / {project.total_tracks_count || 0}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{
                width: `${Math.min(100, ((project.approved_tracks_count || 0) / (project.total_tracks_count || 1)) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <Button className="w-full gap-2" onClick={handleOpenProject}>
          <ExternalLink className="w-4 h-4" />
          Открыть проект
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Edit className="w-3.5 h-3.5" />
            Редактировать
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <MoreHorizontal className="w-3.5 h-3.5" />
            Ещё
          </Button>
        </div>
      </div>
    </div>
  );
});
