import { useState } from 'react';
import { useProjects } from '@/hooks/useProjectsOptimized';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Search, Plus, ChevronRight, Trash2, MoreVertical, Music, Calendar, Disc, LayoutGrid, LayoutList } from 'lucide-react';
import { CreateProjectSheet } from '@/components/CreateProjectSheet';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion } from '@/lib/motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: 'Черновик', color: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'В работе', color: 'bg-blue-500/20 text-blue-500' },
  completed: { label: 'Завершен', color: 'bg-green-500/20 text-green-500' },
  released: { label: 'Выпущен', color: 'bg-purple-500/20 text-purple-500' },
};

const typeLabels: Record<string, string> = {
  single: 'Сингл',
  ep: 'EP',
  album: 'Альбом',
  compilation: 'Сборник',
};

export function ProjectsTab() {
  const { projects, isLoading, deleteProject, isDeleting } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();

  const filteredProjects = projects?.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDelete = async (id: string) => {
    try {
      await deleteProject(id);
      setDeleteConfirmId(null);
      toast.success('Проект удален');
    } catch (error) {
      toast.error('Ошибка при удалении');
    }
  };

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
        {/* View mode toggle */}
        <div className="flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('list')}
          >
            <LayoutList className="w-4 h-4" />
          </Button>
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

      {/* Projects Grid/List */}
      {filteredProjects.length > 0 ? (
        <div className={cn(
          viewMode === 'grid'
            ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
            : "space-y-2"
        )}>
          {filteredProjects.map((project, index) => {
            const status = statusLabels[project.status || 'draft'];
            const projectType = typeLabels[project.project_type || 'album'] || project.project_type;

            if (viewMode === 'grid') {
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl cursor-pointer touch-manipulation",
                    "bg-gradient-to-br from-card/95 to-card/85 border border-border/60",
                    "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10",
                    "transition-all duration-300 active:scale-[0.98]"
                  )}
                >
                  {/* Large Cover Image */}
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary/20 via-generate/10 to-primary/5">
                    {project.cover_url ? (
                      <img
                        src={project.cover_url}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Disc className="w-16 h-16 text-primary/30" />
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Type badge */}
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-black/60 backdrop-blur-sm text-white border-0 text-[10px] h-5 px-2">
                        {projectType}
                      </Badge>
                    </div>

                    {/* Status badge */}
                    <div className="absolute top-2 right-2">
                      <Badge className={cn("text-[10px] h-5 px-2 border-0 backdrop-blur-sm", status.color)}>
                        {status.label}
                      </Badge>
                    </div>

                    {/* Actions menu */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="secondary" size="icon" className="h-8 w-8 backdrop-blur-md">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
                              setDeleteConfirmId(project.id);
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

                  {/* Project Info */}
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
            }

            // List view (existing code)
            return (
              <div
                key={project.id}
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
                  {/* Cover */}
                  <div className="relative w-14 h-14 rounded-lg bg-secondary overflow-hidden shrink-0 shadow-md">
                    {project.cover_url ? (
                      <img
                        src={project.cover_url}
                        alt={project.title}
                        className="w-full h-full object-cover"
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
                      <Badge className={cn("text-[9px] h-4 px-1.5 border-0", status.color)}>
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

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                          setDeleteConfirmId(project.id);
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
              </div>
            );
          })}
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Все треки проекта останутся в библиотеке.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateProjectSheet 
        open={createSheetOpen} 
        onOpenChange={setCreateSheetOpen}
      />
    </div>
  );
}
