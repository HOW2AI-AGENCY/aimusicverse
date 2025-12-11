import { useState } from 'react';
import { 
  Scissors, Mic2, Music2, Shuffle, Clock, 
  Split, Download, BrainCircuit, Guitar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useStudioStore, selectTrack, selectMode } from '@/stores/useStudioStore';

/**
 * ToolsTabContent - Quick action tools for Studio
 * Part of Sprint 015-A: Unified Studio Architecture
 */

interface ToolAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'default' | 'primary' | 'warning';
  requiresStems?: boolean;
  requiresSunoId?: boolean;
}

const tools: ToolAction[] = [
  {
    id: 'trim',
    label: 'Обрезать трек',
    description: 'Выберите начало и конец для обрезки',
    icon: Scissors,
    variant: 'default',
  },
  {
    id: 'separate',
    label: 'Разделить на стемы',
    description: 'Разделить на вокал и инструментал',
    icon: Split,
    variant: 'primary',
    requiresSunoId: true,
  },
  {
    id: 'replace-vocal',
    label: 'Заменить вокал',
    description: 'Генерация нового вокала для трека',
    icon: Mic2,
    variant: 'default',
    requiresSunoId: true,
  },
  {
    id: 'replace-arrangement',
    label: 'Заменить аранжировку',
    description: 'Новая аранжировка с тем же вокалом',
    icon: Music2,
    variant: 'default',
    requiresSunoId: true,
  },
  {
    id: 'remix',
    label: 'Создать ремикс',
    description: 'Ремикс на основе этого трека',
    icon: Shuffle,
    variant: 'default',
    requiresSunoId: true,
  },
  {
    id: 'extend',
    label: 'Расширить трек',
    description: 'Добавить продолжение к треку',
    icon: Clock,
    variant: 'default',
    requiresSunoId: true,
  },
  {
    id: 'guitar-analysis',
    label: 'Анализ гитары',
    description: 'Распознать аккорды и ноты',
    icon: Guitar,
    variant: 'default',
  },
];

interface ToolsTabContentProps {
  onToolSelect?: (toolId: string) => void;
  className?: string;
}

export function ToolsTabContent({ onToolSelect, className }: ToolsTabContentProps) {
  const track = useStudioStore(selectTrack);
  const mode = useStudioStore(selectMode);
  const isSeparating = useStudioStore((state) => state.isSeparating);

  const hasSunoId = !!track?.sunoId;
  const hasStems = mode === 'stem';

  const handleToolClick = (tool: ToolAction) => {
    if (tool.requiresSunoId && !hasSunoId) return;
    if (tool.requiresStems && !hasStems) return;
    
    onToolSelect?.(tool.id);
  };

  return (
    <div className={cn("p-4 space-y-3", className)}>
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        Инструменты обработки
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isDisabled = 
            (tool.requiresSunoId && !hasSunoId) || 
            (tool.requiresStems && !hasStems) ||
            (tool.id === 'separate' && isSeparating);
          
          return (
            <Card 
              key={tool.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                "border-border/50 hover:border-border",
                isDisabled && "opacity-50 cursor-not-allowed hover:shadow-none"
              )}
              onClick={() => !isDisabled && handleToolClick(tool)}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    tool.variant === 'primary' 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-sm font-medium">
                    {tool.label}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CardDescription className="text-xs">
                  {tool.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
