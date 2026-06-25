/**
 * VirtualizedProjectsList - Project list with grid/list view modes
 *
 * Uses UnifiedProjectCard for rendering
 * Supports selection for desktop master-detail view
 */

import { UnifiedProjectCard } from "@/components/project/UnifiedProjectCard";
import { cn } from "@/lib/utils";

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
  viewMode: "grid" | "list";
  onDelete: (id: string) => void;
  statusLabels: Record<string, { label: string; color: string }>;
  typeLabels: Record<string, string>;
  onProjectSelect?: (projectId: string) => void;
  selectedProjectId?: string | null;
}

export function VirtualizedProjectsList({
  projects,
  viewMode,
  onDelete,
  statusLabels,
  typeLabels,
  onProjectSelect,
  selectedProjectId,
}: VirtualizedProjectsListProps) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {projects.map((project, index) => (
          <div
            key={project.id}
            onClick={() => onProjectSelect?.(project.id)}
            className={cn(
              "cursor-pointer rounded-xl transition-all",
              selectedProjectId === project.id && "ring-2 ring-primary ring-offset-2 ring-offset-background",
            )}
          >
            <UnifiedProjectCard
              project={project}
              variant="grid"
              index={index}
              onDelete={onDelete}
              statusLabels={statusLabels}
              typeLabels={typeLabels}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((project, index) => (
        <div
          key={project.id}
          onClick={() => onProjectSelect?.(project.id)}
          className={cn(
            "cursor-pointer rounded-xl transition-all",
            selectedProjectId === project.id && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          )}
        >
          <UnifiedProjectCard
            project={project}
            variant="list"
            index={index}
            onDelete={onDelete}
            statusLabels={statusLabels}
            typeLabels={typeLabels}
          />
        </div>
      ))}
    </div>
  );
}
