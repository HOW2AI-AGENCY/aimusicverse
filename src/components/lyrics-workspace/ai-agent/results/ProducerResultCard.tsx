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
  Star
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

function getCommercialScoreLabel(score: number) {
  if (score >= 85) return { label: 'Хит-потенциал', color: 'text-green-500', emoji: '🔥' };
  if (score >= 70) return { label: 'Высокий', color: 'text-green-400', emoji: '⭐' };
  if (score >= 50) return { label: 'Средний', color: 'text-amber-500', emoji: '📈' };
  return { label: 'Низкий', color: 'text-red-500', emoji: '📉' };
}

export function ProducerResultCard({ 
  review, 
  onQuickAction,
  onApplyStylePrompt,
  onApplyTags,
  className 
}: ProducerResultCardProps) {
  const [copiedStyle, setCopiedStyle] = useState(false);
  const scoreInfo = getCommercialScoreLabel(review.commercialScore);

  const handleCopyStyle = async () => {
    await navigator.clipboard.writeText(review.stylePrompt);
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
      {/* Header with Commercial Score */}
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
                {review.commercialScore}%
              </span>
              <p className="text-[10px] text-muted-foreground">{scoreInfo.label}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hooks Analysis */}
      <div className="p-3 border-b border-border/30">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-rose-400" />
          <span className="text-sm font-medium">Хуки и зацепки</span>
        </div>
        <p className="text-xs text-muted-foreground mb-2">{review.hooks.current}</p>
        {review.hooks.suggestions.length > 0 && (
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
      <div className="p-3 border-b border-border/30">
        <div className="flex items-center gap-2 mb-2">
          <Music2 className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium">Аранжировка</span>
        </div>
        <div className="space-y-2 text-xs">
          {review.arrangement.add.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-green-500 shrink-0">+ Добавить:</span>
              <div className="flex flex-wrap gap-1">
                {review.arrangement.add.map((item, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] bg-green-500/10 text-green-400">{item}</Badge>
                ))}
              </div>
            </div>
          )}
          {review.arrangement.dynamics.length > 0 && (
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

      {/* Style Prompt */}
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
          <p className="text-sm font-medium text-primary">{review.stylePrompt}</p>
        </div>
        {onApplyStylePrompt && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 text-xs"
            onClick={() => onApplyStylePrompt(review.stylePrompt)}
          >
            Применить Style Prompt
          </Button>
        )}
      </div>

      {/* Genre Tags */}
      {review.genreTags && review.genreTags.length > 0 && (
        <div className="p-3 border-b border-border/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium">Рекомендуемые теги</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {review.genreTags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
          {onApplyTags && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={() => onApplyTags(review.genreTags)}
            >
              Добавить все теги
            </Button>
          )}
        </div>
      )}

      {/* Top Recommendations */}
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
