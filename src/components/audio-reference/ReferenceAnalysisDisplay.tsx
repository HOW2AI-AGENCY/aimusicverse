/**
 * Reference Analysis Display Component
 * Shows analysis progress and results for audio reference
 */

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Music, 
  Mic2, 
  Gauge, 
  Heart, 
  Zap,
  Globe,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AudioAnalysis } from '@/services/audio-reference/types';
import { cn } from '@/lib/utils';

interface ReferenceAnalysisDisplayProps {
  analysis: AudioAnalysis | undefined;
  status: 'pending' | 'processing' | 'completed' | 'failed' | null | undefined;
  className?: string;
  compact?: boolean;
}

export const ReferenceAnalysisDisplay = memo(function ReferenceAnalysisDisplay({
  analysis,
  status,
  className,
  compact = false,
}: ReferenceAnalysisDisplayProps) {
  // Render status indicator
  const renderStatusBadge = () => {
    switch (status) {
      case 'processing':
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Анализируем...
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="gap-1 bg-green-500/20 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            Анализ готов
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Ошибка анализа
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Ожидает
          </Badge>
        );
      default:
        return null;
    }
  };

  // Processing state
  if (status === 'processing') {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 animate-pulse text-primary" />
            AI анализирует аудио...
          </span>
          {renderStatusBadge()}
        </div>
        <Progress value={undefined} className="h-1" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-8 rounded" />
          <Skeleton className="h-8 rounded" />
          <Skeleton className="h-8 rounded" />
        </div>
      </div>
    );
  }

  // No analysis data
  if (!analysis || status === 'pending') {
    return (
      <div className={cn("flex items-center justify-between p-3 rounded-lg bg-muted/50", className)}>
        <span className="text-sm text-muted-foreground">Анализ не выполнен</span>
        {renderStatusBadge()}
      </div>
    );
  }

  // Failed state
  if (status === 'failed') {
    return (
      <div className={cn("p-3 rounded-lg bg-destructive/10", className)}>
        <div className="flex items-center gap-2 text-destructive">
          <XCircle className="h-4 w-4" />
          <span className="text-sm">Не удалось проанализировать аудио</span>
        </div>
      </div>
    );
  }

  // Compact view
  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-1.5", className)}>
        {analysis.bpm && (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Gauge className="h-3 w-3" />
            {analysis.bpm} BPM
          </Badge>
        )}
        {analysis.genre && (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Music className="h-3 w-3" />
            {analysis.genre}
          </Badge>
        )}
        {analysis.mood && (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Heart className="h-3 w-3" />
            {analysis.mood}
          </Badge>
        )}
        {analysis.hasVocals && (
          <Badge variant="outline" className="gap-1 text-xs">
            <Mic2 className="h-3 w-3" />
            Вокал
          </Badge>
        )}
        {analysis.energy && (
          <Badge variant="outline" className="gap-1 text-xs">
            <Zap className="h-3 w-3" />
            {analysis.energy}
          </Badge>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className={cn("space-y-4", className)}>
      {/* Status header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Результаты анализа</span>
        {renderStatusBadge()}
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {analysis.bpm && (
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Gauge className="h-4 w-4" />
              <span className="text-xs">Темп</span>
            </div>
            <span className="text-lg font-semibold">{analysis.bpm} BPM</span>
          </div>
        )}
        
        {analysis.genre && (
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Music className="h-4 w-4" />
              <span className="text-xs">Жанр</span>
            </div>
            <span className="text-lg font-semibold">{analysis.genre}</span>
          </div>
        )}

        {analysis.mood && (
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Heart className="h-4 w-4" />
              <span className="text-xs">Настроение</span>
            </div>
            <span className="text-lg font-semibold">{analysis.mood}</span>
          </div>
        )}

        {analysis.energy && (
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Zap className="h-4 w-4" />
              <span className="text-xs">Энергия</span>
            </div>
            <span className="text-lg font-semibold capitalize">{analysis.energy}</span>
          </div>
        )}

        {analysis.detectedLanguage && (
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Globe className="h-4 w-4" />
              <span className="text-xs">Язык</span>
            </div>
            <span className="text-lg font-semibold uppercase">{analysis.detectedLanguage}</span>
          </div>
        )}
      </div>

      {/* Vocal info */}
      {(analysis.hasVocals !== undefined || analysis.vocalStyle) && (
        <div className="flex items-center gap-2">
          <Mic2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {analysis.hasVocals ? (
              <>Вокал{analysis.vocalStyle ? `: ${analysis.vocalStyle}` : ''}</>
            ) : (
              'Инструментал'
            )}
          </span>
        </div>
      )}

      {/* Instruments */}
      {analysis.instruments && analysis.instruments.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">Инструменты</span>
          <div className="flex flex-wrap gap-1.5">
            {analysis.instruments.map((instrument, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {instrument}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Style description */}
      {analysis.styleDescription && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-sm leading-relaxed">{analysis.styleDescription}</p>
        </div>
      )}

      {/* Transcription */}
      {analysis.transcription && (
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">Текст / Транскрипция</span>
          <div className="p-3 rounded-lg bg-muted/50 max-h-32 overflow-y-auto">
            <p className="text-sm whitespace-pre-wrap">{analysis.transcription}</p>
          </div>
        </div>
      )}
    </div>
  );
});
