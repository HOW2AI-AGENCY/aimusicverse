import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Music, Play } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  cover_url?: string | null;
  project_type?: string | null;
  genre?: string | null;
}

interface Track {
  id: string;
  title?: string | null;
  audio_url?: string | null;
  cover_url?: string | null;
  duration_seconds?: number | null;
  status?: string | null;
}

interface ProjectTrackSelectorProps {
  type: 'project' | 'track';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects?: Project[];
  tracks?: Track[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function ProjectTrackSelector({
  type,
  open,
  onOpenChange,
  projects,
  tracks,
  selectedId,
  onSelect,
}: ProjectTrackSelectorProps) {
  const handleSelect = (id: string) => {
    onSelect(id);
    onOpenChange(false);
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'project' ? (
              <>
                <FolderOpen className="w-5 h-5" />
                Выберите проект
              </>
            ) : (
              <>
                <Music className="w-5 h-5" />
                Выберите трек
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {type === 'project' && (!projects || projects.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">Нет доступных проектов</p>
            </div>
          )}

          {type === 'track' && (!tracks || tracks.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Music className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">Нет треков в этом проекте</p>
            </div>
          )}

          {type === 'project' && projects && projects.length > 0 && (
            <div className="grid gap-3">
              {projects.map((project) => (
                <Button
                  key={project.id}
                  type="button"
                  variant={selectedId === project.id ? 'default' : 'outline'}
                  className="h-auto p-4 justify-start"
                  onClick={() => handleSelect(project.id)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {project.cover_url ? (
                        <img
                          src={project.cover_url}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FolderOpen className="w-8 h-8 text-primary" />
                      )}
                    </div>

                    <div className="flex-1 text-left">
                      <div className="font-medium mb-1">{project.title}</div>
                      <div className="flex gap-1 flex-wrap">
                        {project.project_type && (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {project.project_type.replace('_', ' ')}
                          </Badge>
                        )}
                        {project.genre && (
                          <Badge variant="outline" className="text-xs">
                            {project.genre}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {type === 'track' && tracks && tracks.length > 0 && (
            <div className="grid gap-3">
              {tracks.map((track) => (
                <Button
                  key={track.id}
                  type="button"
                  variant={selectedId === track.id ? 'default' : 'outline'}
                  className="h-auto p-4 justify-start"
                  onClick={() => handleSelect(track.id)}
                  disabled={track.status !== 'completed'}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {track.cover_url ? (
                        <img
                          src={track.cover_url}
                          alt={track.title || 'Track'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="w-8 h-8 text-primary" />
                      )}
                    </div>

                    <div className="flex-1 text-left">
                      <div className="font-medium mb-1 flex items-center gap-2">
                        {track.title || 'Без названия'}
                        {track.audio_url && (
                          <Play className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge variant="secondary" className="text-xs">
                          {formatDuration(track.duration_seconds)}
                        </Badge>
                        {track.status && (
                          <Badge
                            variant={track.status === 'completed' ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {track.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
