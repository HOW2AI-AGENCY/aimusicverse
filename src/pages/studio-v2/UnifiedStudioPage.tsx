import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudioProject } from '@/hooks/studio/useStudioProject';
import { useUnifiedStudioStore } from '@/stores/useUnifiedStudioStore';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { StudioShell } from '@/components/studio/unified/StudioShell';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UnifiedStudioPage() {
  const { projectId, trackId } = useParams<{ projectId?: string; trackId?: string }>();
  const navigate = useNavigate();
  const { loadProject, createFromTrack, isLoading, error } = useStudioProject();
  const project = useUnifiedStudioStore(state => state.project);
  const [initialized, setInitialized] = useState(false);

  // Telegram BackButton - navigate to studio hub
  useTelegramBackButton({
    visible: true,
    fallbackPath: '/studio-v2',
  });

  useEffect(() => {
    const init = async () => {
      if (projectId) {
        // Load existing project
        await loadProject(projectId);
      } else if (trackId) {
        // Create new project from track
        const newProjectId = await createFromTrack(trackId);
        if (newProjectId) {
          // Replace URL without adding to history
          navigate(`/studio-v2/project/${newProjectId}`, { replace: true });
        }
      }
      setInitialized(true);
    };

    init();
  }, [projectId, trackId, loadProject, createFromTrack, navigate]);

  if (isLoading || !initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {trackId ? 'Создание проекта...' : 'Загрузка проекта...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Проект не найден</h2>
          <p className="text-muted-foreground mb-4">
            {error || 'Не удалось загрузить проект студии'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/studio-v2')}>
            К списку проектов
          </Button>
          <Button onClick={() => navigate('/studio-v2/new')}>
            Создать новый
          </Button>
        </div>
      </div>
    );
  }

  return <StudioShell />;
}
