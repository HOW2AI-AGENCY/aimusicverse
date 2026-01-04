/**
 * ContextIndicator - Always visible bar showing current lyrics context
 */

import { useMemo } from 'react';
import { motion } from '@/lib/motion';
import { FileText, Music2, Sparkles, Tag, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIAgentContext } from './types';

interface ContextIndicatorProps {
  context: AIAgentContext;
  className?: string;
}

export function ContextIndicator({ context, className }: ContextIndicatorProps) {
  const stats = useMemo(() => {
    const lyrics = context.existingLyrics || '';
    const charCount = lyrics.length;
    const lineCount = lyrics ? lyrics.split('\n').filter(l => l.trim()).length : 0;
    const tagCount = (context.globalTags?.length || 0) + (context.sectionTags?.length || 0);
    
    // Estimate duration based on typical 3 words per second singing
    const wordCount = lyrics ? lyrics.split(/\s+/).filter(w => w.trim()).length : 0;
    const estimatedSeconds = Math.round(wordCount / 2.5);
    const minutes = Math.floor(estimatedSeconds / 60);
    const seconds = estimatedSeconds % 60;
    
    return {
      charCount,
      lineCount,
      tagCount,
      duration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      hasLyrics: charCount > 0,
    };
  }, [context.existingLyrics, context.globalTags, context.sectionTags]);

  const genre = context.genre || context.projectContext?.genre;
  const mood = context.mood || context.projectContext?.mood;

  if (!stats.hasLyrics && !genre && !mood) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-3 px-3 py-1.5 bg-muted/30 border-b border-border/30",
        "overflow-x-auto scrollbar-hide",
        className
      )}
    >
      {/* Character/Line count */}
      {stats.hasLyrics && (
        <div className="flex items-center gap-1.5 shrink-0">
          <FileText className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            {stats.charCount > 1000 
              ? `${(stats.charCount / 1000).toFixed(1)}k` 
              : stats.charCount} симв
          </span>
          <span className="text-[10px] text-muted-foreground/50">•</span>
          <span className="text-[10px] text-muted-foreground">{stats.lineCount} строк</span>
        </div>
      )}

      {/* Estimated duration */}
      {stats.hasLyrics && (
        <div className="flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">~{stats.duration}</span>
        </div>
      )}

      {/* Genre */}
      {genre && (
        <div className="flex items-center gap-1 shrink-0">
          <Music2 className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-medium text-primary capitalize">{genre}</span>
        </div>
      )}

      {/* Mood */}
      {mood && (
        <div className="flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] font-medium text-amber-400 capitalize">{mood}</span>
        </div>
      )}

      {/* Tags count */}
      {stats.tagCount > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          <Tag className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-medium text-emerald-400">{stats.tagCount} тегов</span>
        </div>
      )}
    </motion.div>
  );
}
