/**
 * Dialog for publishing a music project
 */
import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Globe, Lock, Music, ImageIcon } from 'lucide-react';
import { Project } from '@/hooks/useProjects';
import { usePublishProject } from '@/hooks/useProjectGeneratedTracks';
import { ProjectTrack } from '@/hooks/useProjectTracks';
import { BannerRequiredDialog } from './BannerRequiredDialog';

interface PublishProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  tracks: ProjectTrack[];
}

export function PublishProjectDialog({ 
  open, 
  onOpenChange, 
  project, 
  tracks 
}: PublishProjectDialogProps) {
  const { mutate: publishProject, isPending } = usePublishProject();
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);

  const completedTracks = tracks.filter(t => t.status === 'completed' || t.track_id);
  const totalTracks = tracks.length;
  const isReadyToPublish = completedTracks.length > 0;
  const hasBanner = !!project.banner_url;

  const handlePublish = () => {
    // Check if banner exists
    if (!hasBanner) {
      setBannerDialogOpen(true);
      return;
    }
    
    publishProject(project.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const handlePublishWithoutBanner = () => {
    setBannerDialogOpen(false);
    publishProject(project.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <>
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Опубликовать проект
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-left">
                <p>
                  Вы собираетесь опубликовать проект "{project.title}".
                  После публикации проект станет доступен всем пользователям.
                </p>

                {/* Status overview */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  {/* Tracks status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Готовность треков:</span>
                    <Badge variant={isReadyToPublish ? "default" : "secondary"}>
                      {completedTracks.length} / {totalTracks}
                    </Badge>
                  </div>

                  {/* Banner status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      Баннер:
                    </span>
                    <Badge variant={hasBanner ? "default" : "outline"}>
                      {hasBanner ? 'Добавлен' : 'Отсутствует'}
                    </Badge>
                  </div>

                  {/* Track list */}
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    {tracks.map((track) => {
                      const isComplete = track.status === 'completed' || track.track_id;
                      return (
                        <div 
                          key={track.id} 
                          className="flex items-center gap-2 text-sm"
                        >
                          {isComplete ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Music className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className={isComplete ? '' : 'text-muted-foreground'}>
                            {track.position}. {track.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {!isReadyToPublish && (
                  <div className="flex items-start gap-2 text-amber-500 bg-amber-500/10 rounded-lg p-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                      Для публикации требуется хотя бы один готовый трек. 
                      Сгенерируйте треки перед публикацией.
                    </p>
                  </div>
                )}

                {project.is_public && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Lock className="w-4 h-4" />
                    <span>Проект уже публичный</span>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePublish}
              disabled={!isReadyToPublish || isPending}
              className="gap-2"
            >
              {isPending ? (
                <>Публикация...</>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  Опубликовать
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BannerRequiredDialog
        open={bannerDialogOpen}
        onOpenChange={setBannerDialogOpen}
        projectTitle={project.title}
        onCreateBanner={() => {
          setBannerDialogOpen(false);
          onOpenChange(false);
          // Navigate to project settings - user can create banner there
        }}
      />
    </>
  );
}
