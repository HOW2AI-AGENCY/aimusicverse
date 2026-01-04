/**
 * WorkflowPresets - Quick workflow buttons for common pipelines
 */

import { motion } from '@/lib/motion';
import { 
  Zap, Briefcase, Flame, Music, Sparkles, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';

interface WorkflowPresetsProps {
  onStartWorkflow: (workflow: string) => void;
  hasLyrics?: boolean;
  isLoading?: boolean;
  className?: string;
}

const WORKFLOWS = [
  {
    id: 'quick_start',
    label: 'Быстрый старт',
    description: 'Написать → Теги → Готово',
    icon: Zap,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    steps: ['write', 'tags', 'optimize'],
    requiresLyrics: false,
  },
  {
    id: 'professional',
    label: 'Профессиональный',
    description: 'Полный цикл продюсирования',
    icon: Briefcase,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    steps: ['write', 'analyze', 'producer', 'tags', 'optimize'],
    requiresLyrics: false,
  },
  {
    id: 'drill_track',
    label: 'Drill трек',
    description: 'Drill Builder → V5 Check',
    icon: Flame,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    steps: ['drill_builder', 'validate_v5', 'vocal_map'],
    requiresLyrics: false,
  },
  {
    id: 'improve',
    label: 'Улучшить текст',
    description: 'Анализ → Рифмы → Оптимизация',
    icon: Sparkles,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    steps: ['analyze', 'rhyme', 'paraphrase', 'optimize'],
    requiresLyrics: true,
  },
  {
    id: 'translate_adapt',
    label: 'Перевод',
    description: 'Перевод → Адаптация → Теги',
    icon: Music,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    steps: ['translate', 'paraphrase', 'tags'],
    requiresLyrics: true,
  },
];

export function WorkflowPresets({ 
  onStartWorkflow, 
  hasLyrics = false,
  isLoading,
  className 
}: WorkflowPresetsProps) {
  const availableWorkflows = WORKFLOWS.filter(
    w => !w.requiresLyrics || hasLyrics
  );

  const handleClick = (workflowId: string) => {
    hapticImpact('medium');
    onStartWorkflow(workflowId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-2", className)}
    >
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">Готовые сценарии</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {availableWorkflows.slice(0, 4).map((workflow) => {
          const Icon = workflow.icon;
          
          return (
            <Button
              key={workflow.id}
              variant="outline"
              size="sm"
              onClick={() => handleClick(workflow.id)}
              disabled={isLoading}
              className={cn(
                "h-auto py-2.5 px-3 flex flex-col items-start gap-1 text-left",
                "border-border/50 hover:border-primary/50",
                workflow.bgColor
              )}
            >
              <div className="flex items-center gap-1.5 w-full">
                <Icon className={cn("w-3.5 h-3.5", workflow.color)} />
                <span className="text-xs font-medium truncate">{workflow.label}</span>
              </div>
              <span className="text-[10px] text-muted-foreground line-clamp-1">
                {workflow.description}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Compact additional workflows */}
      {availableWorkflows.length > 4 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {availableWorkflows.slice(4).map((workflow) => {
            const Icon = workflow.icon;
            
            return (
              <Button
                key={workflow.id}
                variant="ghost"
                size="sm"
                onClick={() => handleClick(workflow.id)}
                disabled={isLoading}
                className="h-7 px-2.5 gap-1.5 shrink-0"
              >
                <Icon className={cn("w-3 h-3", workflow.color)} />
                <span className="text-[10px]">{workflow.label}</span>
                <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
              </Button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// Export workflow definitions for use in hooks
export const WORKFLOW_DEFINITIONS = WORKFLOWS;
