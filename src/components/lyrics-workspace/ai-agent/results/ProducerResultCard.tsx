/**
 * ProducerResultCard - Display professional producer review
 */

import { motion } from '@/lib/motion';
import { 
  Headphones, 
  Target,
  Mic2,
  Music2,
  Sparkles,
  Tag,
  Copy,
  Check,
  Zap,
  Star,
  ThumbsUp,
  ThumbsDown,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ProducerReviewData, QuickAction } from '../types';
import { useState } from 'react';
import { toast } from 'sonner';

interface ProducerResultCardProps {
  review: ProducerReviewData;
  onQuickAction?: (action: string) => void;
  onApplyStylePrompt?: (prompt: string) => void;
  onApplyTags?: (tags: string[]) => void;
  className?: string;
}

function getScoreLabel(score: number) {
  if (score >= 85) return { label: 'Hit potential', color: 'text-green-500', emoji: '🔥' };
  if (score >= 70) return { label: 'High', color: 'text-green-400', emoji: '⭐' };
  if (score >= 50) return { label: 'Medium', color: 'text-amber-500', emoji: '📈' };
  return { label: 'Needs work', color: 'text-red-500', emoji: '📉' };
}

export function ProducerResultCard({ 
  review, 
  onQuickAction,
  onApplyStylePrompt,
  onApplyTags,
  className 
}: ProducerResultCardProps) {
  const [copiedStyle, setCopiedStyle] = useState(false);
  const score = review.overallScore ?? review.commercialScore ?? 0;
  const scoreInfo = getScoreLabel(score);
  const stylePrompt = review.stylePrompt || '';
  const tags = review.suggestedTags || review.genreTags || [];

  const handleCopyStyle = async () => {
    if (!stylePrompt) return;
    await navigator.clipboard.writeText(stylePrompt);
    setCopiedStyle(true);
    toast.success('Style Prompt скопирован');
    setTimeout(() => setCopiedStyle(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden", className)}
    >
      {/* Header with Score */}
      <div className="p-3 border-b border-border/50 bg-gradient-to-r from-amber-500/10 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-amber-400" />
            <span className="font-semibold">Продюсерский разбор</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{scoreInfo.emoji}</span>
            <div className="text-right">
              <span className={cn("text-xl font-bold", scoreInfo.color)}>
                {score}%
              </span>
              <p className="text-[10px] text-muted-foreground">{scoreInfo.label}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      {review.summary && (
        <div className="p-3 border-b border-border/30">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium">Резюме</span>
          </div>
          <p className="text-sm text-muted-foreground">{review.summary}</p>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      {(review.strengths?.length || review.weaknesses?.length) ? (
        <div className="p-3 border-b border-border/30 grid grid-cols-2 gap-3">
          {review.strengths && review.strengths.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <ThumbsUp className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-medium text-green-400">Сильные стороны</span>
              </div>
              <ul className="space-y-1">
                {review.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-muted-foreground">• {s}</li>
                ))}
              </ul>
            </div>
          )}
          {review.weaknesses && review.weaknesses.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <ThumbsDown className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs font-medium text-red-400">Слабые стороны</span>
              </div>
              <ul className="space-y-1">
                {review.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs text-muted-foreground">• {w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {/* Production Notes */}
      {review.productionNotes && (
        <div className="p-3 border-b border-border/30">
          <div className="flex items-center gap-2 mb-2">
            <Music2 className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium">Продакшен-заметки</span>
          </div>
          <p className="text-xs text-muted-foreground">{review.productionNotes}</p>
        </div>
      )}

      {/* Hooks Analysis */}
      {review.hooks && (
        <div className="p-3 border-b border-border/30">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-rose-400" />
            <span className="text-sm font-medium">Хуки и зацепки</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{review.hooks.current}</p>
          {review.hooks.suggestions && review.hooks.suggestions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground">Предложения:</p>
              {review.hooks.suggestions.map((hook, i) => (
                <div key={i} className="p-2 rounded bg-rose-500/10 border border-rose-500/20">
                  <p className="text-xs">"{hook}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vocal Map */}
      {review.vocalMap && review.vocalMap.length > 0 && (
        <div className="p-3 border-b border-border/30">
          <div className="flex items-center gap-2 mb-2">
            <Mic2 className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium">Вокальная карта</span>
          </div>
          <div className="space-y-2">
            {review.vocalMap.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Badge variant="outline" className="text-[10px] shrink-0">{item.section}</Badge>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1 mb-0.5">
                    {item.effects.map((eff, j) => (
                      <span key={j} className="text-cyan-400">{eff}</span>
                    ))}
                  </div>
                  <p className="text-muted-foreground">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Arrangement */}
      {review.arrangement && (
        <div className="p-3 border-b border-border/30">
          <div className="flex items-center gap-2 mb-2">
            <Music2 className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium">Аранжировка</span>
          </div>
          <div className="space-y-2 text-xs">
            {review.arrangement.add && review.arrangement.add.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-green-500 shrink-0">+ Добавить:</span>
                <div className="flex flex-wrap gap-1">
                  {review.arrangement.add.map((item, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] bg-green-500/10 text-green-400">{item}</Badge>
                  ))}
                </div>
              </div>
            )}
            {review.arrangement.dynamics && review.arrangement.dynamics.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-amber-500 shrink-0">⚡ Динамика:</span>
                <div className="flex flex-wrap gap-1">
                  {review.arrangement.dynamics.map((item, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-400">{item}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Style Prompt */}
      {stylePrompt && (
        <div className="p-3 border-b border-border/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Style Prompt</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={handleCopyStyle}
            >
              {copiedStyle ? (
                <Check className="w-3 h-3 mr-1" />
              ) : (
                <Copy className="w-3 h-3 mr-1" />
              )}
              {copiedStyle ? 'Скопировано' : 'Копировать'}
            </Button>
          </div>
          <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm font-medium text-primary">{stylePrompt}</p>
          </div>
          {onApplyStylePrompt && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={() => onApplyStylePrompt(stylePrompt)}
            >
              Применить Style Prompt
            </Button>
          )}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="p-3 border-b border-border/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium">Рекомендуемые теги</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
          {onApplyTags && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={() => onApplyTags(tags)}
            >
              Добавить все теги
            </Button>
          )}
        </div>
      )}

      {/* Recommendations */}
      {review.recommendations && review.recommendations.length > 0 && (
        <div className="p-3 border-b border-border/30 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium">Рекомендации</span>
          </div>
          <div className="space-y-2">
            {review.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Badge 
                  variant={rec.priority === 'high' ? 'destructive' : 'secondary'}
                  className="text-[9px] shrink-0"
                >
                  {rec.category || (typeof rec.priority === 'number' ? `#${rec.priority}` : rec.priority)}
                </Badge>
                <span>{rec.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Recommendations (legacy format) */}
      {review.topRecommendations && review.topRecommendations.length > 0 && (
        <div className="p-3 border-b border-border/30 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium">ТОП рекомендации</span>
          </div>
          <div className="space-y-2">
            {review.topRecommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold">
                  {rec.priority}
                </span>
                <span>{rec.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {review.quickActions && review.quickActions.length > 0 && onQuickAction && (
        <div className="p-3 bg-gradient-to-r from-amber-500/5 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">Быстрые действия</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {review.quickActions.map((qa, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => onQuickAction(qa.action)}
              >
                {qa.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
