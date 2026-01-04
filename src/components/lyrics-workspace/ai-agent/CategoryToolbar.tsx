/**
 * CategoryToolbar - Compact categorized toolbar for AI tools
 * Replaces two rows of tools with expandable categories
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  PenLine, Wand2, BarChart3, Tag, ChevronDown, ChevronUp,
  ArrowRight, LayoutList, Music2, Quote, Headphones,
  Shuffle, RefreshCw, Anchor, AudioLines, Languages,
  Flame, Crown, CheckCircle2, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';
import { AIToolId } from './types';

interface CategoryToolbarProps {
  activeTool: AIToolId | null;
  onSelectTool: (toolId: AIToolId) => void;
  isLoading?: boolean;
  className?: string;
}

// Tool categories with organized tools
const TOOL_CATEGORIES = [
  {
    id: 'create',
    label: 'Создать',
    icon: PenLine,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    tools: [
      { id: 'write' as AIToolId, icon: PenLine, label: 'Написать', color: 'text-blue-400' },
      { id: 'continue' as AIToolId, icon: ArrowRight, label: 'Продолжить', color: 'text-green-400' },
      { id: 'structure' as AIToolId, icon: LayoutList, label: 'Структура', color: 'text-orange-400' },
      { id: 'rhyme' as AIToolId, icon: Quote, label: 'Рифмы', color: 'text-cyan-400' },
      { id: 'hook_generator' as AIToolId, icon: Anchor, label: 'Хуки', color: 'text-red-400' },
    ],
  },
  {
    id: 'analyze',
    label: 'Анализ',
    icon: BarChart3,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    tools: [
      { id: 'analyze' as AIToolId, icon: BarChart3, label: 'Анализ', color: 'text-purple-400' },
      { id: 'rhythm' as AIToolId, icon: Music2, label: 'Ритм', color: 'text-pink-400' },
      { id: 'producer' as AIToolId, icon: Headphones, label: 'Продюсер', color: 'text-amber-400' },
      { id: 'vocal_map' as AIToolId, icon: AudioLines, label: 'Вокал', color: 'text-violet-400' },
    ],
  },
  {
    id: 'style',
    label: 'Стиль',
    icon: Sparkles,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    tools: [
      { id: 'tags' as AIToolId, icon: Tag, label: 'Теги', color: 'text-emerald-400' },
      { id: 'optimize' as AIToolId, icon: Wand2, label: 'Suno', color: 'text-primary' },
      { id: 'style_convert' as AIToolId, icon: Shuffle, label: 'Конверт', color: 'text-fuchsia-400' },
      { id: 'paraphrase' as AIToolId, icon: RefreshCw, label: 'Перефраз', color: 'text-indigo-400' },
      { id: 'translate' as AIToolId, icon: Languages, label: 'Перевод', color: 'text-teal-400' },
    ],
  },
  {
    id: 'pro',
    label: 'Pro',
    icon: Crown,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    tools: [
      { id: 'drill_builder' as AIToolId, icon: Flame, label: 'Drill', color: 'text-red-400' },
      { id: 'epic_builder' as AIToolId, icon: Crown, label: 'Epic', color: 'text-amber-400' },
      { id: 'validate_v5' as AIToolId, icon: CheckCircle2, label: 'V5 Check', color: 'text-green-400' },
    ],
  },
];

export function CategoryToolbar({ 
  activeTool, 
  onSelectTool, 
  isLoading,
  className 
}: CategoryToolbarProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Find which category contains the active tool
  const activeCategoryId = useMemo(() => {
    if (!activeTool) return null;
    for (const cat of TOOL_CATEGORIES) {
      if (cat.tools.some(t => t.id === activeTool)) {
        return cat.id;
      }
    }
    return null;
  }, [activeTool]);

  const handleCategoryClick = useCallback((categoryId: string) => {
    hapticImpact('light');
    setExpandedCategory(prev => prev === categoryId ? null : categoryId);
  }, []);

  const handleToolClick = useCallback((toolId: AIToolId) => {
    hapticImpact('light');
    onSelectTool(toolId);
    setExpandedCategory(null);
  }, [onSelectTool]);

  const expandedCategoryData = useMemo(() => 
    TOOL_CATEGORIES.find(c => c.id === expandedCategory),
    [expandedCategory]
  );

  return (
    <div className={cn("shrink-0", className)}>
      {/* Category tabs */}
      <div className="px-2 py-1.5 border-b border-border/30 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 min-w-max">
          {TOOL_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isExpanded = expandedCategory === category.id;
            const hasActiveTool = activeCategoryId === category.id;
            
            return (
              <Button
                key={category.id}
                variant={isExpanded || hasActiveTool ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "h-8 px-3 gap-1.5 shrink-0 transition-all",
                  isExpanded && "bg-primary",
                  hasActiveTool && !isExpanded && `${category.bgColor} ${category.borderColor} border`
                )}
                onClick={() => handleCategoryClick(category.id)}
                disabled={isLoading}
              >
                <Icon className={cn(
                  "w-3.5 h-3.5",
                  !isExpanded && !hasActiveTool && category.color
                )} />
                <span className="text-xs font-medium">{category.label}</span>
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3 ml-0.5" />
                ) : (
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Expanded tools panel */}
      <AnimatePresence mode="wait">
        {expandedCategoryData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "border-b border-border/30 overflow-hidden",
              expandedCategoryData.bgColor
            )}
          >
            <div className="px-2 py-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
              {expandedCategoryData.tools.map((tool) => {
                const ToolIcon = tool.icon;
                const isActive = activeTool === tool.id;
                
                return (
                  <motion.button
                    key={tool.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 }}
                    onClick={() => handleToolClick(tool.id)}
                    disabled={isLoading}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-xl border transition-all min-w-[4rem] touch-manipulation",
                      isActive
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background/80 border-border/50 hover:bg-background active:scale-95",
                      isLoading && "opacity-50 pointer-events-none"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center",
                      isActive ? "bg-primary-foreground/20" : "bg-muted/50"
                    )}>
                      <ToolIcon className={cn(
                        "w-4 h-4",
                        isActive ? "text-primary-foreground" : tool.color
                      )} />
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium whitespace-nowrap",
                      isActive ? "text-primary-foreground" : "text-foreground"
                    )}>
                      {tool.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
