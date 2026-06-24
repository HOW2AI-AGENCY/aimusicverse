/**
 * Smart Suggestion Card Component
 * Individual suggestion card with apply/dismiss actions
 */

import { memo, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { 
  Sparkles, 
  Music, 
  Heart, 
  TrendingUp, 
  Shuffle,
  ChevronRight,
  X,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { SmartSuggestion } from './types';

interface SmartSuggestionCardProps {
  suggestion: SmartSuggestion;
  onApply: (suggestion: SmartSuggestion) => void;
  onDismiss: (suggestionId: string) => void;
  compact?: boolean;
  index?: number;
}

const TYPE_ICONS = {
  prompt: Sparkles,
  style: Music,
  mood: Heart,
  continuation: TrendingUp,
  variation: Shuffle,
} as const;

const TYPE_COLORS = {
  prompt: 'text-primary',
  style: 'text-blue-500',
  mood: 'text-pink-500',
  continuation: 'text-green-500',
  variation: 'text-orange-500',
} as const;

const ENERGY_BADGES = {
  low: { label: 'Спокойный', className: 'bg-blue-500/10 text-blue-500' },
  medium: { label: 'Средний', className: 'bg-yellow-500/10 text-yellow-500' },
  high: { label: 'Энергичный', className: 'bg-red-500/10 text-red-500' },
} as const;

export const SmartSuggestionCard = memo(function SmartSuggestionCard({
  suggestion,
  onApply,
  onDismiss,
  compact = false,
  index = 0,
}: SmartSuggestionCardProps) {
  const Icon = TYPE_ICONS[suggestion.type] || Sparkles;
  const iconColor = TYPE_COLORS[suggestion.type] || 'text-primary';
  const energy = suggestion.metadata?.energy;
  const energyBadge = energy ? ENERGY_BADGES[energy] : null;

  const handleApply = useCallback(() => {
    onApply(suggestion);
  }, [onApply, suggestion]);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss(suggestion.id);
  }, [onDismiss, suggestion.id]);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: index * 0.05 }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleApply}
          className="h-8 text-xs gap-1.5 hover:bg-primary/10 hover:text-primary hover:border-primary"
        >
          <Icon className={cn("h-3 w-3", iconColor)} />
          {suggestion.title}
          {suggestion.confidence >= 0.8 && (
            <Zap className="h-3 w-3 text-yellow-500" />
          )}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={cn(
          "p-3 cursor-pointer transition-all group relative",
          "hover:bg-accent hover:border-primary/50",
          "active:scale-[0.98]"
        )}
        onClick={handleApply}
      >
        {/* Dismiss button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleDismiss}
        >
          <X className="h-3 w-3" />
        </Button>

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "mt-0.5 p-2 rounded-md bg-primary/10 transition-colors",
            "group-hover:bg-primary group-hover:text-primary-foreground",
            iconColor
          )}>
            <Icon className="h-4 w-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="font-medium text-sm truncate">{suggestion.title}</h4>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {suggestion.description}
            </p>

            {/* Confidence bar */}
            <div className="flex items-center gap-2 mb-2">
              <Progress 
                value={suggestion.confidence * 100} 
                className="h-1 flex-1"
              />
              <span className="text-[10px] text-muted-foreground w-8 text-right">
                {Math.round(suggestion.confidence * 100)}%
              </span>
            </div>

            {/* Tags & metadata */}
            <div className="flex flex-wrap gap-1">
              {energyBadge && (
                <Badge 
                  variant="secondary" 
                  className={cn("text-[10px] h-5 px-1.5", energyBadge.className)}
                >
                  {energyBadge.label}
                </Badge>
              )}
              {suggestion.tags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[10px] h-5 px-1.5"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Reasoning */}
            <p className="text-[10px] text-muted-foreground/70 mt-1.5 italic">
              {suggestion.reasoning}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});
