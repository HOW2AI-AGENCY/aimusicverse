import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Music2, Clock, Layers, MoreVertical, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useStudioProject } from '@/hooks/studio/useStudioProject';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
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
import { StudioTrack } from '@/stores/useUnifiedStudioStore';

interface StudioProjectRow {
  id: string;
  name: string;
  description: string | null;
  bpm: number | null;
  tracks: StudioTrack[] | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  opened_at: string | null;
}

export default function StudioHubPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<StudioProjectRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { deleteProject, isLoading: isDeleting } = useStudioProject();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('studio_projects')
      .select('id, name, description, bpm, tracks, status, created_at, updated_at, opened_at')
      .order('opened_at', { ascending: false, nullsFirst: false });
    
    setProjects((data as StudioProjectRow[]) || []);
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const success = await deleteProject(deleteId);
    if (success) {
      setProjects(prev => prev.filter(p => p.id !== deleteId));
    }
    setDeleteId(null);
  };

  const getTrackCount = (tracks: StudioTrack[] | null) => {
    if (!tracks || !Array.isArray(tracks)) return 0;
    return tracks.length;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <h1 className="text-lg font-semibold">Студия v2</h1>
          <Button size="sm" onClick={() => navigate('/studio-v2/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Новый проект
          </Button>
        </div>
      </header>

      <main className="container px-4 py-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Music2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Нет проектов</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Создайте первый проект студии для работы с треками и сведения
            </p>
            <Button onClick={() => navigate('/studio-v2/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Создать проект
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => (
              <Card 
                key={project.id}
                className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg"
                onClick={() => navigate(`/studio-v2/project/${project.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={e => {
                            e.stopPropagation();
                            setDeleteId(project.id);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      {getTrackCount(project.tracks)} дорожек
                    </span>
                    {project.bpm && (
                      <span>{project.bpm} BPM</span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {project.opened_at || project.updated_at ? (
                      formatDistanceToNow(
                        new Date(project.opened_at || project.updated_at!), 
                        { addSuffix: true, locale: ru }
                      )
                    ) : (
                      'Недавно'
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Все данные проекта будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
