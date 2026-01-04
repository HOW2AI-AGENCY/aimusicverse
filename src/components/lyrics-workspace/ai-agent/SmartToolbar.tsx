/**
 * SmartToolbar - Minimalist 4-button toolbar with smart popups
 * Replaces CategoryToolbar with cleaner UX
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Zap, PenLine, BarChart3, Sparkles, X,
  CornerDownRight, Quote, LayoutGrid, Tag,
  Activity, Headphones, Target, Shuffle, 
  RefreshCw, Languages, Mic2, Music2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';
import { AIToolId } from './types';

interface SmartToolbarProps {
  onSelectTool: (toolId: AIToolId) => void;
  onStartWorkflow: (workflowId: string) => void;
  activeTool: AIToolId | null;
  isLoading: boolean;
  hasLyrics: boolean;
}

interface ToolAction {
  id: AIToolId;
  label: string;
  icon: typeof PenLine;
}

interface WorkflowAction {
  id: string;
  label: string;
  description: string;
  steps: AIToolId[];
}

const SMART_ACTIONS = [
  {
    id: 'quick',
    label: 'Быстро',
    icon: Zap,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30',
    workflows: [
      { id: 'quick_start', label: 'Написать → Теги', description: 'Генерация + авто-теги', steps: ['write', 'tags'] as AIToolId[] },
      { id: 'improve', label: 'Анализ → Улучшить', description: 'Оценка + оптимизация', steps: ['analyze', 'optimize'] as AIToolId[] },
      { id: 'full_check', label: 'V5 Валидация', description: 'Проверка синтаксиса', steps: ['validate_v5'] as AIToolId[] },
    ],
  },
  {
    id: 'create',
    label: 'Создать',
    icon: PenLine,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30',
    tools: [
      { id: 'write' as AIToolId, label: 'Написать', icon: PenLine },
      { id: 'continue' as AIToolId, label: 'Продолжить', icon: CornerDownRight },
      { id: 'hook_generator' as AIToolId, label: 'Хуки', icon: Zap },
      { id: 'structure' as AIToolId, label: 'Структура', icon: LayoutGrid },
    ],
  },
  {
    id: 'analyze',
    label: 'Анализ',
    icon: BarChart3,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30',
    tools: [
      { id: 'analyze' as AIToolId, label: 'Полный анализ', icon: BarChart3 },
      { id: 'producer' as AIToolId, label: 'Продюсер', icon: Headphones },
      { id: 'rhythm' as AIToolId, label: 'Ритм', icon: Activity },
      { id: 'validate_v5' as AIToolId, label: 'V5 Check', icon: Target },
    ],
  },
  {
    id: 'style',
    label: 'Стиль',
    icon: Sparkles,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30',
    tools: [
      { id: 'tags' as AIToolId, label: 'Теги', icon: Tag },
      { id: 'optimize' as AIToolId, label: 'Suno', icon: Sparkles },
      { id: 'style_convert' as AIToolId, label: 'Конверт', icon: Shuffle },
      { id: 'paraphrase' as AIToolId, label: 'Вариации', icon: RefreshCw },
      { id: 'translate' as AIToolId, label: 'Перевод', icon: Languages },
      { id: 'vocal_map' as AIToolId, label: 'Вокал', icon: Mic2 },
    ],
  },
];

export function SmartToolbar({ 
  onSelectTool, 
  onStartWorkflow, 
  activeTool, 
  isLoading,
  hasLyrics 
}: SmartToolbarProps) {
  const [openPopup, setOpenPopup] = useState<string | null>(null);

  const handleActionClick = useCallback((actionId: string) => {
    hapticImpact('light');
    setOpenPopup(prev => prev === actionId ? null : actionId);
  }, []);

  const handleToolSelect = useCallback((toolId: AIToolId) => {
    hapticImpact('medium');
    onSelectTool(toolId);
    setOpenPopup(null);
  }, [onSelectTool]);

  const handleWorkflowSelect = useCallback((workflowId: string) => {
    hapticImpact('medium');
    onStartWorkflow(workflowId);
    setOpenPopup(null);
  }, [onStartWorkflow]);

  return (
    <div className="relative px-3 py-2 border-b border-border/30">
      {/* Main 4 buttons */}
      <div className="flex gap-2 justify-center">
        {SMART_ACTIONS.map((action) => {
          const Icon = action.icon;
          const isOpen = openPopup === action.id;
          
          return (
            <Button
              key={action.id}
              variant="ghost"
              size="sm"
              disabled={isLoading}
              onClick={() => handleActionClick(action.id)}
              className={cn(
                "flex-1 h-11 flex flex-col gap-0.5 rounded-xl transition-all",
                action.bgColor,
                isOpen && "ring-2 ring-primary/50"
              )}
            >
              <Icon className={cn("w-4 h-4", action.color)} />
              <span className="text-[10px] font-medium text-foreground/80">{action.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Popup */}
      <AnimatePresence>
        {openPopup && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-3 right-3 top-full mt-2 z-50 bg-background/95 backdrop-blur-lg rounded-xl border border-border shadow-xl p-3"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {SMART_ACTIONS.find(a => a.id === openPopup)?.label}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => setOpenPopup(null)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            {/* Workflows (for Quick) */}
            {openPopup === 'quick' && (
              <div className="space-y-2">
                {SMART_ACTIONS[0].workflows?.map((workflow) => (
                  <button
                    key={workflow.id}
                    onClick={() => handleWorkflowSelect(workflow.id)}
                    disabled={!hasLyrics && workflow.id !== 'quick_start'}
                    className={cn(
                      "w-full p-3 rounded-lg text-left transition-all",
                      "bg-muted/50 hover:bg-muted border border-border/50",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{workflow.label}</span>
                      <div className="flex gap-1">
                        {workflow.steps.map((step, i) => (
                          <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{workflow.description}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Tools grid */}
            {openPopup !== 'quick' && (
              <div className="grid grid-cols-3 gap-2">
                {SMART_ACTIONS.find(a => a.id === openPopup)?.tools?.map((tool) => {
                  const ToolIcon = tool.icon;
                  const needsLyrics = ['analyze', 'producer', 'rhythm', 'validate_v5', 'optimize', 'tags', 'style_convert', 'paraphrase', 'vocal_map'].includes(tool.id);
                  const isDisabled = needsLyrics && !hasLyrics;
                  
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleToolSelect(tool.id)}
                      disabled={isDisabled}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all",
                        "bg-muted/50 hover:bg-muted border border-border/50",
                        activeTool === tool.id && "ring-2 ring-primary bg-primary/10",
                        "disabled:opacity-40 disabled:cursor-not-allowed"
                      )}
                    >
                      <ToolIcon className="w-5 h-5 text-foreground/70" />
                      <span className="text-xs font-medium">{tool.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {openPopup && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpenPopup(null)}
        />
      )}
    </div>
  );
}
