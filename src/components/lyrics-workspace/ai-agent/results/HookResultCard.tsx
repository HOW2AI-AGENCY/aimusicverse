/**
 * HookResultCard - Display hook analysis and suggestions
 */

import { motion } from '@/lib/motion';
import { Zap, Copy, Check, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';
import { hapticImpact } from '@/lib/haptic';

interface HookData {
  currentHooks?: Array<{
    text: string;
    score: number;
    location?: string;
  }>;
  suggestedHooks?: string[];
  hookScore?: number;
  recommendations?: string[];
}

interface HookResultCardProps {
  data: HookData;
  onApplyHook?: (hook: string) => void;
}

export function HookResultCard({ data, onApplyHook }: HookResultCardProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      hapticImpact('light');
      toast.success('Скопировано!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/20';
    if (score >= 60) return 'bg-amber-500/20';
    return 'bg-red-500/20';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 p-3 bg-background/80 rounded-xl border border-border/50 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <h4 className="text-sm font-medium">Анализ хуков</h4>
            <p className="text-[10px] text-muted-foreground">
              Запоминающиеся фразы и припевы
            </p>
          </div>
        </div>
        
        {data.hookScore !== undefined && (
          <div className={cn(
            "px-2 py-1 rounded-lg text-lg font-bold",
            getScoreBg(data.hookScore),
            getScoreColor(data.hookScore)
          )}>
            {data.hookScore}%
          </div>
        )}
      </div>

      {/* Current Hooks */}
      {data.currentHooks && data.currentHooks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Текущие хуки:</p>
          <div className="space-y-1.5">
            {data.currentHooks.map((hook, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">"{hook.text}"</p>
                  {hook.location && (
                    <p className="text-[10px] text-muted-foreground">{hook.location}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-2.5 h-2.5",
                          i < Math.ceil(hook.score / 20)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Hooks */}
      {data.suggestedHooks && data.suggestedHooks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400" />
            Предложенные хуки:
          </p>
          <div className="space-y-1.5">
            {data.suggestedHooks.map((hook, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group flex items-center justify-between p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/15 transition-colors"
              >
                <p className="text-xs font-medium text-yellow-100 flex-1 min-w-0 truncate">
                  "{hook}"
                </p>
                <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => handleCopy(hook, idx)}
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                  {onApplyHook && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        onApplyHook(hook);
                        hapticImpact('medium');
                      }}
                    >
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Рекомендации:</p>
          {data.recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="text-yellow-400 shrink-0">💡</span>
              <span>{rec}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
