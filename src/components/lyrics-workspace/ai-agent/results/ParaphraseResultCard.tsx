/**
 * ParaphraseResultCard - Display paraphrase variants
 */

import { motion } from '@/lib/motion';
import { RefreshCw, Copy, Check, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';
import { hapticImpact } from '@/lib/haptic';

interface ParaphraseVariant {
  text: string;
  tone?: string;
  style?: string;
}

interface ParaphraseResultCardProps {
  originalText?: string;
  variants: ParaphraseVariant[] | string[];
  onApplyVariant?: (text: string) => void;
}

export function ParaphraseResultCard({ originalText, variants, onApplyVariant }: ParaphraseResultCardProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const normalizedVariants: ParaphraseVariant[] = variants.map(v => 
    typeof v === 'string' ? { text: v } : v
  );

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

  const handleApply = (text: string, index: number) => {
    setSelectedIndex(index);
    hapticImpact('medium');
    onApplyVariant?.(text);
    toast.success('Вариант применён!');
  };

  const getToneColor = (tone?: string) => {
    if (!tone) return 'bg-muted/50 text-muted-foreground';
    const lowerTone = tone.toLowerCase();
    if (lowerTone.includes('поэт') || lowerTone.includes('poet')) return 'bg-purple-500/20 text-purple-300';
    if (lowerTone.includes('прост') || lowerTone.includes('simple')) return 'bg-green-500/20 text-green-300';
    if (lowerTone.includes('агресс') || lowerTone.includes('aggress')) return 'bg-red-500/20 text-red-300';
    if (lowerTone.includes('романт') || lowerTone.includes('romant')) return 'bg-pink-500/20 text-pink-300';
    if (lowerTone.includes('ирон') || lowerTone.includes('iron')) return 'bg-amber-500/20 text-amber-300';
    return 'bg-blue-500/20 text-blue-300';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 p-3 bg-background/80 rounded-xl border border-border/50 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <RefreshCw className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <h4 className="text-sm font-medium">Варианты перефразирования</h4>
          <p className="text-[10px] text-muted-foreground">
            {normalizedVariants.length} вариантов
          </p>
        </div>
      </div>

      {/* Original Text */}
      {originalText && (
        <div className="p-2 rounded-lg bg-muted/20 border border-border/30">
          <p className="text-[10px] text-muted-foreground mb-1">Оригинал:</p>
          <p className="text-xs text-muted-foreground italic">"{originalText}"</p>
        </div>
      )}

      {/* Variants */}
      <div className="space-y-2">
        {normalizedVariants.map((variant, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "group p-2.5 rounded-lg border transition-all cursor-pointer",
              selectedIndex === idx
                ? "bg-cyan-500/20 border-cyan-500/50"
                : "bg-muted/30 border-border/30 hover:bg-muted/50"
            )}
            onClick={() => onApplyVariant && handleApply(variant.text, idx)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Tone/Style Badge */}
                {(variant.tone || variant.style) && (
                  <Badge
                    variant="secondary"
                    className={cn("text-[9px] mb-1.5", getToneColor(variant.tone || variant.style))}
                  >
                    {variant.tone || variant.style}
                  </Badge>
                )}
                
                {/* Text */}
                <p className="text-xs leading-relaxed">{variant.text}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(variant.text, idx);
                  }}
                >
                  {copiedIndex === idx ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
                {onApplyVariant && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApply(variant.text, idx);
                    }}
                  >
                    {selectedIndex === idx ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <ArrowRight className="w-3 h-3" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tip */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Sparkles className="w-3 h-3 text-cyan-400" />
        <span>Нажмите на вариант, чтобы применить его к тексту</span>
      </div>
    </motion.div>
  );
}
