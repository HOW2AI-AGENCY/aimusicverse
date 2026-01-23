/**
 * QuickActionChips - Contextual quick actions for AI agent
 * Shows relevant actions based on current state
 */

import { memo, useMemo } from 'react';
import { motion } from '@/lib/motion';
import { 
  Wand2, RefreshCw, Sparkles, BarChart3, 
  PenLine, Quote, Languages, Shuffle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';
import { AIToolId } from './types';

interface QuickActionChipsProps {
  hasLyrics: boolean;
  hasAnalysis: boolean;
  onAction: (action: QuickAction) => void;
  disabled?: boolean;
  className?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: typeof Wand2;
  toolId?: AIToolId;
  workflowId?: string;
  color: string;
}

export const QuickActionChips = memo(function QuickActionChips({
  hasLyrics,
  hasAnalysis,
  onAction,
  disabled = false,
  className,
}: QuickActionChipsProps) {
  const actions = useMemo<QuickAction[]>(() => {
    if (!hasLyrics) {
      // No lyrics - show creation actions
      return [
        { id: 'write', label: 'Написать текст', icon: PenLine, toolId: 'write', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
        { id: 'quick_start', label: 'Быстрый старт', icon: Wand2, workflowId: 'quick_start', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      ];
    }
    
    if (!hasAnalysis) {
      // Has lyrics, no analysis - suggest analysis first
      return [
        { id: 'analyze', label: 'Проанализировать', icon: BarChart3, toolId: 'analyze', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
        { id: 'optimize', label: 'Оптимизировать', icon: Sparkles, toolId: 'optimize', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
        { id: 'rhyme', label: 'Проверить рифмы', icon: Quote, toolId: 'rhyme', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
      ];
    }
    
    // Has lyrics and analysis - show improvement actions
    return [
      { id: 'improve', label: 'Улучшить', icon: RefreshCw, workflowId: 'improve', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      { id: 'style_convert', label: 'Сменить стиль', icon: Shuffle, toolId: 'style_convert', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
      { id: 'translate', label: 'Перевести', icon: Languages, toolId: 'translate', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
    ];
  }, [hasLyrics, hasAnalysis]);

  const handleClick = (action: QuickAction) => {
    if (disabled) return;
    hapticImpact('light');
    onAction(action);
  };

  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-1 scrollbar-hide", className)}>
      {actions.map((action, index) => {
        const Icon = action.icon;
        
        return (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleClick(action)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
              "text-xs font-medium whitespace-nowrap",
              "border transition-all touch-manipulation",
              "hover:scale-105 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              action.color
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {action.label}
          </motion.button>
        );
      })}
    </div>
  );
});

export default QuickActionChips;
