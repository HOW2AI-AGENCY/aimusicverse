/**
 * QuickToolPanel - Simple panel for tools that just need context
 * Used for: continue, hook, optimize
 */

import { motion } from '@/lib/motion';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ToolPanelProps, AIToolId } from '../types';
import { AI_TOOLS } from '../constants';
import { useState } from 'react';

interface QuickToolPanelProps extends ToolPanelProps {
  toolId: AIToolId;
}

export function QuickToolPanel({ 
  context, 
  onExecute, 
  onClose, 
  isLoading,
  toolId 
}: QuickToolPanelProps) {
  const tool = AI_TOOLS.find(t => t.id === toolId);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  
  if (!tool) return null;

  const Icon = tool.icon;
  const hasContent = !!(context.existingLyrics || context.selectedSection?.content);

  const handleExecute = () => {
    onExecute({
      existingLyrics: context.existingLyrics,
      sectionContent: context.selectedSection?.content,
      sectionType: context.selectedSection?.type,
      additionalPrompt,
      // Special params for specific tools
      ...(toolId === 'hook' && { sectionType: 'Hook', sectionName: 'Hook' }),
    });
  };

  const getContextDescription = () => {
    if (context.selectedSection) {
      return `Секция: ${context.selectedSection.type} (${context.selectedSection.content.length} симв.)`;
    }
    if (context.existingLyrics) {
      return `Весь текст: ${context.existingLyrics.length} симв.`;
    }
    return 'Нет контекста';
  };

  const getPlaceholder = () => {
    switch (toolId) {
      case 'continue':
        return 'Опционально: добавьте пожелания к продолжению...';
      case 'hook':
        return 'Опционально: опишите желаемый стиль хука...';
      case 'optimize':
        return 'Опционально: укажите особые требования...';
      default:
        return 'Дополнительные инструкции...';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn("border-b border-border/50", tool.bgColor.replace('hover:', ''))}
    >
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", tool.bgColor)}>
              <Icon className={cn("w-4 h-4", tool.color)} />
            </div>
            <div>
              <h3 className="text-sm font-medium">{tool.name}</h3>
              <p className="text-[10px] text-muted-foreground">{tool.description}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Context Indicator */}
        <div className={cn(
          "p-2 rounded-lg border text-xs",
          hasContent ? "bg-muted/30 border-border/50" : "bg-amber-500/10 border-amber-500/30"
        )}>
          {hasContent ? (
            <span className="text-muted-foreground">📋 {getContextDescription()}</span>
          ) : (
            <span className="text-amber-600">⚠️ Добавьте текст для работы с этим инструментом</span>
          )}
        </div>

        {/* Additional Prompt */}
        <div className="space-y-1.5">
          <Label className="text-xs">Дополнительно (опционально)</Label>
          <Textarea
            placeholder={getPlaceholder()}
            value={additionalPrompt}
            onChange={(e) => setAdditionalPrompt(e.target.value)}
            className="min-h-[60px] text-sm resize-none"
          />
        </div>

        {/* Execute Button */}
        <Button
          onClick={handleExecute}
          disabled={isLoading || !hasContent}
          className="w-full gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {tool.name}
        </Button>
      </div>
    </motion.div>
  );
}
