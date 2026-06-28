import { useGenerationQueue } from "@/hooks/generation/useGenerationQueue";
import { Clock, AlertTriangle } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function QueuePosition() {
  const { data: queue } = useGenerationQueue();

  if (!queue || queue.totalPending === 0) return null;

  const waitMinutes = Math.ceil(queue.estimatedWaitSeconds / 60);

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs",
        queue.isRateLimited
          ? "bg-warning/10 text-warning border border-warning/20"
          : "bg-muted/50 text-muted-foreground",
      )}
    >
      {queue.isRateLimited ? (
        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
      ) : (
        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
      )}
      <span>
        {queue.userPosition
          ? `Ваша позиция: ${queue.userPosition}/${queue.totalPending}`
          : `В очереди: ${queue.totalPending}`}
        {waitMinutes > 0 && ` · ~${waitMinutes} мин`}
      </span>
    </div>
  );
}
