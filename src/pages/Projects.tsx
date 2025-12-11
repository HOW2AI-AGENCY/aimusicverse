import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjectsOptimized';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Search, Plus, Music, ChevronRight } from 'lucide-react';
import { CreateProjectSheet } from '@/components/CreateProjectSheet';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Projects() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { projects, isLoading } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const filteredProjects = projects?.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen pb-20">
      {/* Sticky Header */}
      <div className={cn(
        "sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50",
        isMobile ? "px-3 py-2.5" : "px-4 py-3"
      )}>
        <div className="flex items-center justify-between gap-2 max-w-6xl mx-auto">
          <h1 className="text-lg sm:text-xl font-bold">Проекты</h1>
          <Button 
            size="sm" 
            onClick={() => setCreateSheetOpen(true)}
            className="gap-1 h-9"
          >
            <Plus className="w-4 h-4" />
            {!isMobile && 'Создать'}
          </Button>
        </div>
      </div>

      <div className={cn("max-w-6xl mx-auto", isMobile ? "px-3 py-3" : "px-4 py-4")}>
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Stats - Mobile optimized */}
        <div className="flex gap-1.5 mb-3 text-xs text-muted-foreground">
          <span>{projects?.length || 0} проектов</span>
          <span>•</span>
          <span>{projects?.filter(p => p.status === 'completed').length || 0} завершено</span>
        </div>

        {/* Projects List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          </div>
        ) : filteredProjects.length > 0 ? (
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
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-secondary overflow-hidden shrink-0">
                  <img
                    src={project.cover_url || `https://placehold.co/56x56/1a1a1a/ffffff?text=${project.title.charAt(0)}`}
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
      </div>

      <CreateProjectSheet 
        open={createSheetOpen} 
        onOpenChange={setCreateSheetOpen}
      />
    </div>
  );
}
