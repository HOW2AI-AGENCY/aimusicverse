/**
 * SectionReferenceDisplay - Show analysis results from audio reference for lyrics sections
 */

import { Music2, Gauge, Key, Palette, Zap, Guitar, Tag, Mic } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ReferenceAnalysis } from '@/hooks/useSectionNotes';
import { cn } from '@/lib/utils';

interface SectionReferenceDisplayProps {
  analysis: ReferenceAnalysis;
  compact?: boolean;
  className?: string;
}

export function SectionReferenceDisplay({ 
  analysis, 
  compact = false,
  className 
}: SectionReferenceDisplayProps) {
  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-1.5", className)}>
        {analysis.bpm && (
          <Badge variant="outline" className="text-xs gap-1">
            <Gauge className="w-3 h-3" />
            {analysis.bpm} BPM
          </Badge>
        )}
        {analysis.key && (
          <Badge variant="outline" className="text-xs gap-1">
            <Key className="w-3 h-3" />
            {analysis.key}
          </Badge>
        )}
        {analysis.genre && (
          <Badge variant="secondary" className="text-xs">
            {analysis.genre}
          </Badge>
        )}
        {analysis.mood && (
          <Badge variant="secondary" className="text-xs">
            {analysis.mood}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 p-4 bg-muted/30 rounded-xl", className)}>
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Music2 className="w-4 h-4 text-primary" />
        Анализ референса
      </h4>

      {/* Primary metrics */}
      <div className="grid grid-cols-2 gap-2">
        {analysis.bpm && (
          <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
            <Gauge className="w-4 h-4 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Темп</p>
              <p className="text-sm font-medium">{analysis.bpm} BPM</p>
            </div>
          </div>
        )}
        {analysis.key && (
          <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
            <Key className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Тональность</p>
              <p className="text-sm font-medium">{analysis.key}</p>
            </div>
          </div>
        )}
        {analysis.genre && (
          <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
            <Palette className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">Жанр</p>
              <p className="text-sm font-medium">{analysis.genre}</p>
            </div>
          </div>
        )}
        {analysis.energy && (
          <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
            <Zap className="w-4 h-4 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Энергия</p>
              <p className="text-sm font-medium">{analysis.energy}</p>
            </div>
          </div>
        )}
      </div>

      {/* Mood */}
      {analysis.mood && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Настроение</p>
          <Badge variant="secondary">{analysis.mood}</Badge>
        </div>
      )}

      {/* Vocal style */}
      {analysis.vocal_style && (
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Mic className="w-3 h-3" />
            Вокальный стиль
          </p>
          <p className="text-sm">{analysis.vocal_style}</p>
        </div>
      )}

      {/* Instruments */}
      {analysis.instruments && analysis.instruments.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
            <Guitar className="w-3 h-3" />
            Инструменты
          </p>
          <div className="flex flex-wrap gap-1">
            {analysis.instruments.map(inst => (
              <Badge key={inst} variant="outline" className="text-xs">
                {inst}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Chords */}
      {analysis.chords && analysis.chords.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Аккорды</p>
          <div className="flex flex-wrap gap-1">
            {analysis.chords.map((chord, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-mono">
                {chord}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Style description */}
      {analysis.style_description && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Описание стиля</p>
          <p className="text-sm text-muted-foreground">{analysis.style_description}</p>
        </div>
      )}

      {/* Suggested tags */}
      {analysis.suggested_tags && analysis.suggested_tags.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Предложенные теги
          </p>
          <div className="flex flex-wrap gap-1">
            {analysis.suggested_tags.map(tag => (
              <Badge key={tag} className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
