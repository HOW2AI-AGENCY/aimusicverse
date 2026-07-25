import { GenerateModal } from "./primitives";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import { FolderOpen, Music, Play } from "@/lib/icons";
import { LazyImage } from "@/components/ui/lazy-image";
import { motion } from "@/lib/motion";
import { EASE_OUT } from "@/lib/motion-presets";
import { cn } from "@/lib/utils";

const listContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const listItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: EASE_OUT },
};

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
  type: "project" | "track";
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
    // Keep dialog open for project selection to allow track selection, close for track selection
    if (type === "track") {
      onOpenChange(false);
    }
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <GenerateModal
      open={open}
      onOpenChange={onOpenChange}
      title={type === "project" ? "Выберите проект" : "Выберите трек"}
      description={type === "project" ? "Контекст проекта для генерации" : "Трек-референс из проекта"}
      icon={type === "project" ? FolderOpen : Music}
      size="md"
      className="z-[200]"
    >
      <>

          {type === "project" && (!projects || projects.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">Нет доступных проектов</p>
            </div>
          )}

          {type === "track" && (!tracks || tracks.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Music className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">Нет треков в этом проекте</p>
            </div>
          )}

          {type === "project" && projects && projects.length > 0 && (
            <motion.div variants={listContainer} initial="hidden" animate="show" className="grid gap-3">
              {projects.map((project) => (
                <motion.div key={project.id} variants={listItem} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    variant={selectedId === project.id ? "default" : "outline"}
                    className="h-auto p-4 justify-start w-full transition-transform hover:translate-x-0.5"
                    onClick={() => handleSelect(project.id)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {project.cover_url ? (
                          <LazyImage
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
                              {project.project_type.replace("_", " ")}
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
                </motion.div>
              ))}
            </motion.div>
          )}

          {type === "track" && tracks && tracks.length > 0 && (
            <motion.div variants={listContainer} initial="hidden" animate="show" className="grid gap-3">
              {tracks.map((track) => (
                <motion.div
                  key={track.id}
                  variants={listItem}
                  whileTap={track.status === "completed" ? { scale: 0.98 } : undefined}
                >
                  <Button
                    type="button"
                    variant={selectedId === track.id ? "default" : "outline"}
                    className={cn(
                      "h-auto p-4 justify-start w-full transition-transform",
                      track.status === "completed" && "hover:translate-x-0.5",
                    )}
                    onClick={() => handleSelect(track.id)}
                    disabled={track.status !== "completed"}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {track.cover_url ? (
                          <LazyImage
                            src={track.cover_url}
                            alt={track.title || "Track"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Music className="w-8 h-8 text-primary" />
                        )}
                      </div>

                      <div className="flex-1 text-left">
                        <div className="font-medium mb-1 flex items-center gap-2">
                          {track.title || "Без названия"}
                          {track.audio_url && <Play className="w-3 h-3 text-muted-foreground" />}
                        </div>
                        <div className="flex gap-2 items-center">
                          <Badge variant="secondary" className="text-xs">
                            {formatDuration(track.duration_seconds)}
                          </Badge>
                          {track.status && (
                            <Badge variant={track.status === "completed" ? "default" : "outline"} className="text-xs">
                              {track.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          )}
      </>
    </GenerateModal>
  );

}
