/**
 * TrackDetailsCard - Comprehensive track parameters display
 * Shows all track metadata including generation parameters
 */

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Music, Mic, Guitar, Zap, Clock, Settings,
  FileText, Tag, Volume2, Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectTrack } from '@/hooks/useProjectTracks';

interface TrackDetailsCardProps {
  track: ProjectTrack;
  compact?: boolean;
  className?: string;
}

const VOCAL_STYLE_LABELS: Record<string, string> = {
  soft: 'Мягкий',
  powerful: 'Мощный',
  raspy: 'Хриплый',
  smooth: 'Гладкий',
  emotional: 'Эмоциональный',
  robotic: 'Роботизированный',
  whisper: 'Шёпот',
  operatic: 'Оперный',
};

const LYRICS_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  prompt: { label: 'Промпт', color: 'bg-amber-500/20 text-amber-600' },
  draft: { label: 'Черновик', color: 'bg-blue-500/20 text-blue-600' },
  generated: { label: 'Сгенерирован', color: 'bg-purple-500/20 text-purple-600' },
  approved: { label: 'Готов', color: 'bg-green-500/20 text-green-600' },
};

export function TrackDetailsCard({ 
  track, 
  compact = false,
  className 
}: TrackDetailsCardProps) {
  const hasParams = track.bpm_target || track.key_signature || track.energy_level || 
                   track.vocal_style || track.duration_target;
  const hasTags = track.recommended_tags && track.recommended_tags.length > 0;
  const hasNotes = track.notes;
  const hasStylePrompt = track.style_prompt;
  
  if (!hasParams && !hasTags && !hasNotes && !hasStylePrompt) {
    return null;
  }

  const energyPercent = track.energy_level ? (track.energy_level / 10) * 100 : 0;

  return (
    <div className={cn(
      "rounded-lg bg-muted/30 border border-border/30",
      compact ? "p-2" : "p-2.5",
      className
    )}>
      {/* Main Parameters Row */}
      {hasParams && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {/* BPM */}
          {track.bpm_target && (
            <Badge variant="outline" className="text-[10px] gap-0.5 h-5 px-1.5">
              <Gauge className="w-2.5 h-2.5" />
              {track.bpm_target} BPM
            </Badge>
          )}
          
          {/* Key Signature */}
          {track.key_signature && (
            <Badge variant="outline" className="text-[10px] gap-0.5 h-5 px-1.5">
              <Music className="w-2.5 h-2.5" />
              {track.key_signature}
            </Badge>
          )}
          
          {/* Duration */}
          {track.duration_target && (
            <Badge variant="outline" className="text-[10px] gap-0.5 h-5 px-1.5">
              <Clock className="w-2.5 h-2.5" />
              {Math.floor(track.duration_target / 60)}:{(track.duration_target % 60).toString().padStart(2, '0')}
            </Badge>
          )}
          
          {/* Vocal Style */}
          {track.vocal_style && (
            <Badge variant="secondary" className="text-[10px] gap-0.5 h-5 px-1.5">
              <Mic className="w-2.5 h-2.5" />
              {VOCAL_STYLE_LABELS[track.vocal_style] || track.vocal_style}
            </Badge>
          )}
          
          {/* Instrumental Only */}
          {track.instrumental_only && (
            <Badge variant="secondary" className="text-[10px] gap-0.5 h-5 px-1.5">
              <Guitar className="w-2.5 h-2.5" />
              Инструментал
            </Badge>
          )}
        </div>
      )}

      {/* Energy Level */}
      {track.energy_level && !compact && (
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] text-muted-foreground w-14">Энергия</span>
          <Progress value={energyPercent} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground w-6 text-right">
            {track.energy_level}/10
          </span>
        </div>
      )}

      {/* Lyrics Status */}
      {track.lyrics_status && (
        <div className="flex items-center gap-1.5 mb-2">
          <FileText className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">Текст:</span>
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] h-4 px-1.5 border-0",
              LYRICS_STATUS_CONFIG[track.lyrics_status]?.color || 'bg-muted'
            )}
          >
            {LYRICS_STATUS_CONFIG[track.lyrics_status]?.label || track.lyrics_status}
          </Badge>
          {track.lyrics && (
            <span className="text-[10px] text-muted-foreground/60">
              ({track.lyrics.split(/\s+/).length} слов)
            </span>
          )}
        </div>
      )}

      {/* Style Prompt */}
      {hasStylePrompt && !compact && (
        <div className="mb-2">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
            <Settings className="w-2.5 h-2.5" />
            <span>Стиль:</span>
          </div>
          <p className="text-xs text-foreground/80 line-clamp-2">
            {track.style_prompt}
          </p>
        </div>
      )}

      {/* Recommended Tags */}
      {hasTags && !compact && (
        <div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
            <Tag className="w-2.5 h-2.5" />
            <span>Теги:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {track.recommended_tags!.slice(0, 8).map((tag, i) => (
              <span 
                key={i}
                className="text-[10px] px-1.5 py-0.5 bg-primary/10 rounded text-primary/80"
              >
                {tag}
              </span>
            ))}
            {track.recommended_tags!.length > 8 && (
              <span className="text-[10px] text-muted-foreground/60">
                +{track.recommended_tags!.length - 8}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {hasNotes && !compact && (
        <div className="mt-2 pt-2 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground/70 italic line-clamp-2">
            📝 {track.notes}
          </p>
        </div>
      )}
    </div>
  );
}
