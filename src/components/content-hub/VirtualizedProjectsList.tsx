/**
 * VirtualizedProjectsList - Project list with grid/list view modes
 * 
 * Uses UnifiedProjectCard for rendering
 */

import { UnifiedProjectCard } from '@/components/project/UnifiedProjectCard';

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
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {projects.map((project, index) => (
          <UnifiedProjectCard
            key={project.id}
            project={project}
            variant="grid"
            index={index}
            onDelete={onDelete}
            statusLabels={statusLabels}
            typeLabels={typeLabels}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((project, index) => (
        <UnifiedProjectCard
          key={project.id}
          project={project}
          variant="list"
          index={index}
          onDelete={onDelete}
          statusLabels={statusLabels}
          typeLabels={typeLabels}
        />
      ))}
    </div>
  );
}
