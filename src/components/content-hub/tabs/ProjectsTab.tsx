import { useState } from 'react';
import { useProjects } from '@/hooks/useProjectsOptimized';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Search, Plus, ChevronRight } from 'lucide-react';
import { CreateProjectSheet } from '@/components/CreateProjectSheet';
import { cn } from '@/lib/utils';

export function ProjectsTab() {
  const { projects, isLoading } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const navigate = useNavigate();

  const filteredProjects = projects?.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Create */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Button size="sm" onClick={() => setCreateSheetOpen(true)} className="gap-1.5 shrink-0">
          <Plus className="w-4 h-4" />
          Создать
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-2 text-xs text-muted-foreground">
        <span>{projects?.length || 0} проектов</span>
        <span>•</span>
        <span>{projects?.filter(p => p.status === 'completed').length || 0} завершено</span>
      </div>

      {/* Projects List */}
      {filteredProjects.length > 0 ? (
        <div className="space-y-2">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className={cn(
                "flex items-center gap-2.5 p-2.5 rounded-xl bg-card/50 border border-border/50",
                "active:bg-card active:border-border cursor-pointer transition-all",
                "active:scale-[0.99] touch-manipulation"
              )}
            >
              {/* Cover */}
              <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden shrink-0">
                <img
                  src={project.cover_url || `https://placehold.co/48x48/1a1a1a/ffffff?text=${project.title.charAt(0)}`}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{project.title}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                    {project.genre || 'Без жанра'}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {project.project_type?.replace('_', ' ') || 'album'}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'Ничего не найдено' : 'Нет проектов'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setCreateSheetOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Создать проект
            </Button>
          )}
        </div>
      )}

      <CreateProjectSheet 
        open={createSheetOpen} 
        onOpenChange={setCreateSheetOpen}
      />
    </div>
  );
}
