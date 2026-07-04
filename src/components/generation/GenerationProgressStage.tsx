import { motion } from "@/lib/motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Music2, Wand2, CheckCircle2, Loader2, AlertCircle } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface GenerationProgressStageProps {
  status: "pending" | "processing" | "streaming_ready" | "completed" | "failed";
  prompt?: string;
  estimatedTime?: number;
  className?: string;
}

const stages = [
  {
    id: "pending",
    label: "Анализирую запрос",
    subtitle: "Понимаю настроение и референсы",
    icon: Sparkles,
    progress: 10,
  },
  { id: "analyzing", label: "Подбираю стиль и темп", subtitle: "Стиль · BPM · тональность", icon: Wand2, progress: 25 },
  { id: "processing", label: "Генерирую вокал", subtitle: "Синтез голоса и мелодии", icon: Music2, progress: 50 },
  { id: "streaming_ready", label: "Свожу трек", subtitle: "Микс, мастеринг, обложка", icon: Music2, progress: 80 },
  { id: "completed", label: "Готово!", subtitle: "Трек готов к прослушиванию", icon: CheckCircle2, progress: 100 },
];

function getStageInfo(status: string) {
  const stageMap: Record<string, { label: string; subtitle: string; progress: number; icon: React.ElementType }> = {
    pending: { label: "Анализирую запрос", subtitle: "Понимаю настроение и референсы", progress: 10, icon: Sparkles },
    processing: { label: "Генерирую вокал", subtitle: "Синтез голоса и мелодии", progress: 50, icon: Music2 },
    streaming_ready: { label: "Свожу трек", subtitle: "Микс, мастеринг, обложка", progress: 80, icon: Music2 },
    completed: { label: "Готово!", subtitle: "Трек готов к прослушиванию", progress: 100, icon: CheckCircle2 },
    failed: { label: "Ошибка", subtitle: "Попробуйте снова", progress: 0, icon: AlertCircle },
  };
  return stageMap[status] || { label: "Обработка", subtitle: "Подождите…", progress: 30, icon: Loader2 };
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `~${seconds} сек`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `~${mins} мин ${secs > 0 ? `${secs} сек` : ""}`;
}

export function GenerationProgressStage({ status, prompt, estimatedTime, className }: GenerationProgressStageProps) {
  const stageInfo = getStageInfo(status);
  const Icon = stageInfo.icon;
  const isCompleted = status === "completed";
  const isFailed = status === "failed";

  return (
    <motion.div className={cn("space-y-4", className)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Main stage indicator */}
      <div className="flex items-center gap-4">
        <motion.div
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center",
            isCompleted && "bg-green-500/20",
            isFailed && "bg-destructive/20",
            !isCompleted && !isFailed && "bg-primary/20",
          )}
          animate={
            !isCompleted && !isFailed
              ? {
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    "0 0 0 0 rgba(var(--primary), 0)",
                    "0 0 0 10px rgba(var(--primary), 0.1)",
                    "0 0 0 0 rgba(var(--primary), 0)",
                  ],
                }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            animate={!isCompleted && !isFailed ? { rotate: 360 } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Icon
              className={cn(
                "w-7 h-7",
                isCompleted && "text-green-500",
                isFailed && "text-destructive",
                !isCompleted && !isFailed && "text-primary",
              )}
            />
          </motion.div>
        </motion.div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">{stageInfo.label}</h3>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                isCompleted && "border-green-500/50 text-green-500",
                isFailed && "border-destructive/50 text-destructive",
                !isCompleted && !isFailed && "border-primary/50 text-primary",
              )}
            >
              {stageInfo.progress}%
            </Badge>
          </div>

          {stageInfo.subtitle && <p className="text-sm text-muted-foreground">{stageInfo.subtitle}</p>}

          {estimatedTime && estimatedTime > 0 && !isCompleted && (
            <p className="text-xs text-muted-foreground mt-1">Осталось: {formatTime(estimatedTime)}</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <Progress value={stageInfo.progress} className="h-2" />

        {/* Stage markers */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className={stageInfo.progress >= 10 ? "text-primary" : ""}>Анализ</span>
          <span className={stageInfo.progress >= 50 ? "text-primary" : ""}>Генерация</span>
          <span className={stageInfo.progress >= 80 ? "text-primary" : ""}>Сведение</span>
          <span className={stageInfo.progress >= 100 ? "text-green-500" : ""}>Готово</span>
        </div>
      </div>

      {/* Stage steps visualization */}
      <div className="flex items-center gap-2">
        {stages.slice(0, -1).map((stage, index) => {
          const isActive = stageInfo.progress >= stage.progress;
          const StageIcon = stage.icon;

          return (
            <motion.div
              key={stage.id}
              className="flex items-center flex-1 last:flex-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border transition-all",
                  isActive
                    ? "bg-primary/20 border-primary/50 text-primary"
                    : "border-muted-foreground/30 text-muted-foreground",
                )}
              >
                <StageIcon className="w-4 h-4" />
              </div>

              {index < stages.length - 2 && (
                <div className="flex-1 h-0.5 mx-1">
                  <motion.div
                    className={cn("h-full", isActive ? "bg-primary" : "bg-muted-foreground/30")}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isActive ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
