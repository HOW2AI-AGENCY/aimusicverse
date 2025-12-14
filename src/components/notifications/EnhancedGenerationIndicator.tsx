import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "@/lib/motion";
import { Loader2, Music2, ChevronDown, ChevronUp, Clock, Sparkles, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useNotificationHub, GenerationProgress } from "@/contexts/NotificationContext";

const statusColors = {
  pending: "text-yellow-500 border-yellow-500/30",
  processing: "text-primary border-primary/30",
  streaming_ready: "text-green-500 border-green-500/30",
  completed: "text-green-500 border-green-500/30",
  failed: "text-destructive border-destructive/30",
};

const statusLabels = {
  pending: "В очереди",
  processing: "Генерация",
  streaming_ready: "Превью готово",
  completed: "Готово",
  failed: "Ошибка",
};

function formatTime(seconds: number): string {
  if (seconds < 60) return `~${seconds}с`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `~${mins}м ${secs}с`;
}

function GenerationCard({ generation }: { generation: GenerationProgress }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="p-3 rounded-lg bg-muted/50 border border-border/50"
    >
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Music2 className="w-5 h-5 text-primary" />
          </div>
          {generation.status === "processing" && (
            <div className="absolute -top-1 -right-1">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {generation.prompt.slice(0, 40)}
            {generation.prompt.length > 40 ? "..." : ""}
          </p>

          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5", statusColors[generation.status])}>
              {statusLabels[generation.status]}
            </Badge>

            {generation.estimated_time && generation.estimated_time > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(generation.estimated_time)}
              </span>
            )}
          </div>

          <div className="mt-2">
            <Progress value={generation.progress} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground mt-1">{generation.stage}</p>
          </div>
        </div>

        {generation.status === "streaming_ready" && generation.track_id && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => navigate(`/library?track=${generation.track_id}`)}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export function EnhancedGenerationIndicator() {
  const navigate = useNavigate();
  const { activeGenerations, generationCount } = useNotificationHub();
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when new generations appear
  const [lastGenerationIds, setLastGenerationIds] = useState<string>("");

  const currentGenerationIds = useMemo(
    () =>
      activeGenerations
        .map((g) => g.id)
        .sort()
        .join(","),
    [activeGenerations],
  );

  useEffect(() => {
    if (currentGenerationIds.length > 0 && currentGenerationIds !== lastGenerationIds) {
      setLastGenerationIds(currentGenerationIds);
      setDismissed(false);
    } else if (currentGenerationIds.length === 0 && lastGenerationIds.length > 0) {
      // Reset when all generations are removed
      setLastGenerationIds("");
    }
  }, [currentGenerationIds, lastGenerationIds]);

  if (generationCount === 0 || dismissed) return null;

  const mainGeneration = activeGenerations[0];
  const overallProgress = activeGenerations.reduce((sum, g) => sum + g.progress, 0) / generationCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100vw-2rem)] max-w-md"
    >
      <div className="bg-background/95 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-lg shadow-primary/10 overflow-hidden">
        {/* Main indicator */}
        <div className="relative">
          <Button
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            // pr-12 padding provides space for the close button positioned at top-2 right-2
            className="h-auto py-3 px-4 pr-12 gap-3 hover:bg-primary/5 rounded-none w-full justify-between"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/30"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {generationCount === 1 ? "Генерация трека" : `Генерация ${generationCount} треков`}
                  </span>
                  <Badge className="h-5 px-1.5 text-xs bg-primary/20 text-primary border-0">
                    {Math.round(overallProgress)}%
                  </Badge>
                </div>

                {mainGeneration && (
                  <p className="text-xs text-muted-foreground truncate">
                    {mainGeneration.stage}
                    {mainGeneration.estimated_time &&
                      mainGeneration.estimated_time > 0 &&
                      ` • ${formatTime(mainGeneration.estimated_time)}`}
                  </p>
                )}
              </div>
            </div>

            {generationCount > 1 ? (
              expanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )
            ) : null}
          </Button>

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 hover:bg-background/50 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(true);
            }}
            aria-label="Скрыть уведомление"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-2">
          <Progress value={overallProgress} className="h-1" />
        </div>

        {/* Expanded list */}
        <AnimatePresence>
          {expanded && generationCount > 1 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-2 max-h-[250px] overflow-y-auto">
                {activeGenerations.map((generation) => (
                  <GenerationCard key={generation.id} generation={generation} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer actions */}
        <div className="border-t border-border/50 flex">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/library")}
            className="flex-1 h-10 text-xs text-primary hover:text-primary hover:bg-primary/5 rounded-none"
          >
            Открыть библиотеку →
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
