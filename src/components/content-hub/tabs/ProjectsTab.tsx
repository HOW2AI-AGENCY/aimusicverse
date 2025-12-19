import { useState, useEffect } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderOpen, Search, Plus, LayoutGrid, LayoutList } from 'lucide-react';
import { ProjectCreationWizard } from '@/components/project/ProjectCreationWizard';
import { toast } from 'sonner';
import { VirtualizedProjectsList } from '@/components/content-hub/VirtualizedProjectsList';
import { ProjectsOnboarding } from '@/components/content-hub/ProjectsOnboarding';
import { AnimatePresence } from '@/lib/motion';
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

const ONBOARDING_KEY = 'projects-onboarding-dismissed';

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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const dismissed = localStorage.getItem(ONBOARDING_KEY);
    if (!dismissed) {
      setShowOnboarding(true);
    }
  }, []);

  const handleDismissOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

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
      {/* Onboarding */}
      <AnimatePresence>
        {showOnboarding && (
          <ProjectsOnboarding
            onDismiss={handleDismissOnboarding}
            onCreateProject={() => {
              handleDismissOnboarding();
              setCreateSheetOpen(true);
            }}
            onCreateArtist={() => {
              handleDismissOnboarding();
              navigate('/projects?tab=artists');
            }}
          />
        )}
      </AnimatePresence>

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
        <VirtualizedProjectsList
          projects={filteredProjects}
          viewMode={viewMode}
          onDelete={setDeleteConfirmId}
          statusLabels={statusLabels}
          typeLabels={typeLabels}
        />
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

      <ProjectCreationWizard 
        open={createSheetOpen} 
        onOpenChange={setCreateSheetOpen}
      />
    </div>
  );
}
