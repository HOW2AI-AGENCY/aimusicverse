import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderOpen, Search, Plus, LayoutGrid, LayoutList, Sparkles, TrendingUp } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ProjectCreationWizard } from '@/components/project/ProjectCreationWizard';
import { toast } from 'sonner';
import { VirtualizedProjectsList } from '@/components/content-hub/VirtualizedProjectsList';
import { MobileProjectsToolbar } from '@/components/content-hub/MobileProjectsToolbar';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
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
  published: { label: 'Опубликован', color: 'bg-emerald-500/20 text-emerald-500' },
};

const typeLabels: Record<string, string> = {
  single: 'Сингл',
  ep: 'EP',
  album: 'Альбом',
  compilation: 'Сборник',
};


export function ProjectsTab() {
  const isMobile = useIsMobile();
  const { projects, isLoading, deleteProject, isDeleting } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  const publishedCount = projects?.filter(p => p.status === 'published').length || 0;
  const completedCount = projects?.filter(p => p.status === 'completed').length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div 
          className="relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary" />
        </motion.div>
      </div>
    );
  }
  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Search & Create - different layout for mobile */}
      {isMobile ? (
        <MobileProjectsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onCreateClick={() => setCreateSheetOpen(true)}
        />
      ) : (
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Поиск проектов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm transition-all focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {/* View mode toggle */}
          <div className="flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className={cn(
                "h-8 w-8 transition-all",
                viewMode === 'grid' && "shadow-sm"
              )}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className={cn(
                "h-8 w-8 transition-all",
                viewMode === 'list' && "shadow-sm"
              )}
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="w-4 h-4" />
            </Button>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button size="sm" onClick={() => setCreateSheetOpen(true)} className="gap-1.5 shrink-0 shadow-sm">
              <Plus className="w-4 h-4" />
              Создать
            </Button>
          </motion.div>
        </motion.div>
      )}

      {/* Stats with animations */}
      <motion.div 
        className="flex items-center gap-3 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted/50">
          <FolderOpen className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">{projects?.length || 0} проектов</span>
        </div>
        {publishedCount > 0 && (
          <motion.div 
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400">{publishedCount} опубликовано</span>
          </motion.div>
        )}
        {completedCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-green-500/10">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span className="text-green-600 dark:text-green-400">{completedCount} завершено</span>
          </div>
        )}
      </motion.div>

      {/* Projects Grid/List */}
      {filteredProjects.length > 0 ? (
        <VirtualizedProjectsList
          projects={filteredProjects}
          viewMode={viewMode}
          onDelete={setDeleteConfirmId}
          statusLabels={statusLabels}
          typeLabels={typeLabels}
        />
      ) : (
        <EmptyState
          icon={FolderOpen}
          title={searchQuery ? 'Ничего не найдено' : 'Нет проектов'}
          variant="compact"
          actions={!searchQuery ? [{
            label: 'Создать проект',
            onClick: () => setCreateSheetOpen(true),
            icon: Plus
          }] : undefined}
        />
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

      <ProjectCreationWizard 
        open={createSheetOpen} 
        onOpenChange={setCreateSheetOpen}
      />
    </motion.div>
  );
}
