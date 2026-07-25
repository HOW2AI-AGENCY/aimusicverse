/**
 * ProjectMetaSection — метаданные проекта (жанр, прогресс, описание).
 *
 * Извлечено из pages/ProjectDetail.tsx в Sprint 042 (god-page декомпозиция).
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, FileText, ChevronDown, ChevronUp, Rocket } from "@/lib/icons";
import { ProjectDetailsCard } from "@/components/project/ProjectDetailsCard";
import { cn } from "@/lib/utils";
import type { useProjectDetailData } from "@/hooks/project/useProjectDetailData";

interface ProjectMetaSectionProps {
  project: NonNullable<ReturnType<typeof useProjectDetailData>["project"]>;
  isMobile: boolean;
  completedTracks: number;
  totalTracks: number;
  isPublished: boolean;
  descriptionExpanded: boolean;
  projectInfoExpanded: boolean;
  onToggleDescription: () => void;
  onToggleProjectInfo: () => void;
  onOpenSettings: () => void;
}

export function ProjectMetaSection({
  project,
  isMobile,
  completedTracks,
  totalTracks,
  isPublished,
  descriptionExpanded,
  projectInfoExpanded,
  onToggleDescription,
  onToggleProjectInfo,
  onOpenSettings,
}: ProjectMetaSectionProps) {
  return (
    <div className={cn("text-center space-y-1.5", isMobile ? "px-4 -mt-6 relative z-10" : "pt-2")}>
      {isMobile && <h1 className="text-xl font-bold text-foreground mb-1">{project.title}</h1>}

      <div className={cn("flex items-center gap-1.5", isMobile ? "justify-center flex-wrap" : "justify-center")}>
        {project.genre && (
          <Badge
            variant="secondary"
            className="gap-0.5 text-[0.625rem] h-5 px-2 shrink-0 bg-primary/10 text-primary border-0"
          >
            <Music className="w-2.5 h-2.5" />
            {project.genre}
          </Badge>
        )}
        <Badge variant="outline" className="text-[0.625rem] h-5 px-2 shrink-0">
          {completedTracks}/{totalTracks} треков
        </Badge>
        {isPublished && (
          <Badge className="bg-emerald-500/20 text-emerald-500 border-0 h-5 px-2 gap-0.5 shrink-0">
            <Rocket className="w-2.5 h-2.5" />
            Опубликован
          </Badge>
        )}
      </div>

      {project.description && (
        <div className="max-w-sm mx-auto cursor-pointer group" onClick={onToggleDescription}>
          <p className={cn("text-xs text-muted-foreground transition-all", !descriptionExpanded && "line-clamp-2")}>
            {project.description}
          </p>
          {project.description.length > 100 && (
            <span className="text-[0.625rem] text-primary/70 group-hover:text-primary transition-colors">
              {descriptionExpanded ? "Свернуть" : "Читать полностью"}
            </span>
          )}
        </div>
      )}

      {(project.genre || project.mood || project.concept || project.image_style || project.color_palette) && (
        <div className="max-w-sm mx-auto mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleProjectInfo}
            className="w-full h-10 min-h-touch text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            {projectInfoExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Скрыть детали
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Показать детали
              </>
            )}
          </Button>

          {projectInfoExpanded && (
            <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
              <ProjectDetailsCard project={project} onEdit={onOpenSettings} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
