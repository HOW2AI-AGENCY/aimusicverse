/**
 * Context Recommendations Component
 * Dynamic AI-powered recommendations based on project/track context
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, RefreshCw, Lightbulb, Music, Tag } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface Recommendation {
  type: 'theme' | 'style' | 'structure' | 'tag';
  label: string;
  value: string;
  description?: string;
}

interface ContextRecommendationsProps {
  recommendations: Recommendation[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelect: (recommendation: Recommendation) => void;
  className?: string;
}

const TYPE_ICONS = {
  theme: Lightbulb,
  style: Sparkles,
  structure: Music,
  tag: Tag,
};

const TYPE_LABELS = {
  theme: 'Тема',
  style: 'Стиль',
  structure: 'Структура',
  tag: 'Теги',
};

export function ContextRecommendations({
  recommendations,
  isLoading,
  onRefresh,
  onSelect,
  className
}: ContextRecommendationsProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Group recommendations by type
  const groupedRecs = recommendations.reduce((acc, rec) => {
    if (!acc[rec.type]) acc[rec.type] = [];
    acc[rec.type].push(rec);
    return acc;
  }, {} as Record<string, Recommendation[]>);

  const handleSelect = (rec: Recommendation, index: number) => {
    setSelectedIndex(index);
    onSelect(rec);
    
    // Reset selection visual after animation
    setTimeout(() => setSelectedIndex(null), 300);
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-xs font-medium">AI рекомендации</span>
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-8 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className="h-4 w-4 text-primary" />
          </motion.div>
          <span className="text-xs font-medium">AI рекомендации</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
        </Button>
      </div>

      {/* Recommendations by type */}
      <div className="space-y-3">
        {Object.entries(groupedRecs).map(([type, recs]) => {
          const Icon = TYPE_ICONS[type as keyof typeof TYPE_ICONS] || Lightbulb;
          const label = TYPE_LABELS[type as keyof typeof TYPE_LABELS] || type;
          
          return (
            <div key={type} className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="h-3 w-3" />
                <span>{label}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <AnimatePresence mode="popLayout">
                  {recs.map((rec, idx) => {
                    const globalIdx = recommendations.indexOf(rec);
                    return (
                      <motion.button
                        key={`${rec.type}-${rec.value}-${idx}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ 
                          opacity: 1, 
                          scale: selectedIndex === globalIdx ? 1.05 : 1 
                        }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelect(rec, globalIdx)}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium',
                          'bg-primary/10 hover:bg-primary/20 text-primary',
                          'border border-primary/20 hover:border-primary/40',
                          'transition-all duration-200',
                          selectedIndex === globalIdx && 'bg-primary text-primary-foreground'
                        )}
                        title={rec.description}
                      >
                        {rec.label}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Export types
export type { Recommendation, ContextRecommendationsProps };
