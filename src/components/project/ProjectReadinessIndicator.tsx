/**
 * Shows project readiness status for publishing
 * Displays how many tracks have master versions selected
 */
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, Star, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectReadinessIndicatorProps {
  totalTracks: number;
  tracksWithMaster: number;
  className?: string;
}

export function ProjectReadinessIndicator({ 
  totalTracks, 
  tracksWithMaster,
  className 
}: ProjectReadinessIndicatorProps) {
  const progress = totalTracks > 0 ? (tracksWithMaster / totalTracks) * 100 : 0;
  const isReady = totalTracks > 0 && tracksWithMaster === totalTracks;
  const hasAnyMaster = tracksWithMaster > 0;

  if (totalTracks === 0) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Добавьте треки в проект</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isReady ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">Готов к релизу</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-500">В работе</span>
            </>
          )}
        </div>
        <Badge 
          variant={isReady ? "default" : "secondary"}
          className={cn(
            "gap-1",
            isReady && "bg-green-500 hover:bg-green-600"
          )}
        >
          <Star className="w-3 h-3" />
          {tracksWithMaster}/{totalTracks} мастер
        </Badge>
      </div>
      
      <Progress 
        value={progress} 
        className={cn(
          "h-2",
          isReady && "[&>div]:bg-green-500"
        )}
      />
      
      {!isReady && hasAnyMaster && (
        <p className="text-xs text-muted-foreground">
          Выберите мастер-версию для всех треков чтобы опубликовать проект
        </p>
      )}
      
      {!hasAnyMaster && (
        <p className="text-xs text-muted-foreground">
          Сгенерируйте треки и выберите мастер-версии
        </p>
      )}
    </div>
  );
}
