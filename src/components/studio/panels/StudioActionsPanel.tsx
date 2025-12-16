/**
 * Unified Studio Actions Panel
 * Organized actions by category for both studio modes
 */

import { useState } from 'react';
import { 
  Scissors, Split, Mic, Music, Shuffle, Clock, 
  Wand2, Download, ArrowRight, BrainCircuit, Piano,
  ChevronDown, ChevronUp, Loader2, FileAudio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Track } from '@/types/track';

interface ActionItem {
  id: string;
  icon: React.ElementType;
  label: string;
  description?: string;
  onClick?: () => void;
  available: boolean;
  processing?: boolean;
  badge?: string;
  variant?: 'default' | 'primary';
  submenu?: { label: string; onClick: () => void }[];
}

interface ActionCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  actions: ActionItem[];
}

interface StudioActionsPanelProps {
  track: Track;
  hasStems: boolean;
  stemsCount?: number;
  isSeparating?: boolean;
  onSeparate?: (mode: 'simple' | 'detailed') => void;
  onReplaceSection?: () => void;
  onReplaceVocal?: () => void;
  onReplaceArrangement?: () => void;
  onRemix?: () => void;
  onExtend?: () => void;
  onTrim?: () => void;
  onMIDI?: () => void;
  onTranscribe?: () => void;
  onAnalyze?: () => void;
  className?: string;
  variant?: 'horizontal' | 'vertical';
}

export function StudioActionsPanel({
  track,
  hasStems,
  stemsCount = 0,
  isSeparating,
  onSeparate,
  onReplaceSection,
  onReplaceVocal,
  onReplaceArrangement,
  onRemix,
  onExtend,
  onTrim,
  onMIDI,
  onTranscribe,
  onAnalyze,
  className,
  variant = 'horizontal',
}: StudioActionsPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['editing']);

  const canSeparate = !!track.suno_id && !hasStems;
  const canReplace = !!track.suno_id && !!track.suno_task_id;
  const hasVocals = track.has_vocals !== false && !track.is_instrumental;

  const categories: ActionCategory[] = [
    {
      id: 'editing',
      title: 'Редактирование',
      icon: Scissors,
      actions: [
        {
          id: 'separate',
          icon: Split,
          label: 'Разделить на стемы',
          description: 'Вокал, барабаны, бас, мелодия',
          available: canSeparate,
          processing: isSeparating,
          variant: 'primary',
          submenu: onSeparate ? [
            { label: 'Простое (2 стема)', onClick: () => onSeparate('simple') },
            { label: 'Детальное (6+ стемов)', onClick: () => onSeparate('detailed') },
          ] : undefined,
        },
        {
          id: 'replace_section',
          icon: Wand2,
          label: 'Заменить секцию',
          description: 'AI перегенерирует часть трека',
          available: canReplace,
          badge: 'AI',
          onClick: onReplaceSection,
        },
        {
          id: 'trim',
          icon: Clock,
          label: 'Обрезать',
          description: 'Выберите фрагмент',
          available: !!track.audio_url,
          onClick: onTrim,
        },
      ],
    },
    {
      id: 'creation',
      title: 'Создание',
      icon: Wand2,
      actions: [
        {
          id: 'replace_vocal',
          icon: Mic,
          label: 'Новый вокал',
          description: 'Сохранить аранжировку',
          available: canReplace && hasVocals && hasStems,
          badge: 'AI',
          onClick: onReplaceVocal,
        },
        {
          id: 'replace_arrangement',
          icon: Music,
          label: 'Новая аранжировка',
          description: 'Сохранить вокал',
          available: canReplace && hasVocals && hasStems,
          badge: 'AI',
          onClick: onReplaceArrangement,
        },
        {
          id: 'remix',
          icon: Shuffle,
          label: 'Ремикс',
          description: 'Новая версия трека',
          available: !!track.suno_id,
          badge: 'AI',
          onClick: onRemix,
        },
        {
          id: 'extend',
          icon: ArrowRight,
          label: 'Расширить',
          description: 'Продлить композицию',
          available: !!track.suno_id,
          badge: 'AI',
          onClick: onExtend,
        },
      ],
    },
    {
      id: 'analysis',
      title: 'Анализ',
      icon: BrainCircuit,
      actions: [
        {
          id: 'midi',
          icon: Piano,
          label: 'MIDI',
          description: 'Транскрипция в MIDI',
          available: hasStems || !!track.suno_id,
          onClick: onMIDI,
        },
        {
          id: 'transcribe',
          icon: FileAudio,
          label: 'Ноты',
          description: 'Транскрипция в ноты',
          available: hasStems || !!track.suno_id,
          onClick: onTranscribe,
        },
        {
          id: 'analyze',
          icon: BrainCircuit,
          label: 'AI Анализ',
          description: 'Определить стиль и настроение',
          available: !!track.audio_url,
          onClick: onAnalyze,
        },
      ],
    },
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Horizontal variant - compact buttons row
  if (variant === 'horizontal') {
    const primaryActions = categories.flatMap(c => c.actions).filter(a => a.available).slice(0, 6);

    return (
      <div className={cn(
        "px-4 sm:px-6 py-2 border-b border-border/30",
        "bg-gradient-to-r from-primary/5 via-transparent to-primary/5",
        className
      )}>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <span className="text-xs text-muted-foreground font-medium shrink-0">Действия:</span>
          
          {primaryActions.map((action) => {
            const Icon = action.icon;
            
            // Actions with submenu
            if (action.submenu) {
              return (
                <DropdownMenu key={action.id}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={action.variant === 'primary' ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        "h-8 gap-1.5 shrink-0",
                        action.variant === 'primary' && "bg-primary text-primary-foreground"
                      )}
                      disabled={action.processing}
                    >
                      {action.processing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">{action.label}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {action.submenu.map((item, idx) => (
                      <DropdownMenuItem key={idx} onClick={item.onClick}>
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            return (
              <Button
                key={action.id}
                variant={action.variant === 'primary' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  "h-8 gap-1.5 shrink-0",
                  action.variant === 'primary' && "bg-primary text-primary-foreground"
                )}
                onClick={action.onClick}
                disabled={action.processing || !action.onClick}
              >
                {action.processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{action.label}</span>
                {action.badge && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                    {action.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical variant - collapsible categories
  return (
    <div className={cn("space-y-2 p-4", className)}>
      {categories.map((category) => {
        const availableActions = category.actions.filter(a => a.available);
        if (availableActions.length === 0) return null;

        const CategoryIcon = category.icon;
        const isExpanded = expandedCategories.includes(category.id);

        return (
          <Collapsible
            key={category.id}
            open={isExpanded}
            onOpenChange={() => toggleCategory(category.id)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between h-10 px-3"
              >
                <div className="flex items-center gap-2">
                  <CategoryIcon className="w-4 h-4" />
                  <span className="font-medium">{category.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    {availableActions.length}
                  </Badge>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-1 mt-1">
              {availableActions.map((action) => {
                const Icon = action.icon;

                if (action.submenu) {
                  return (
                    <DropdownMenu key={action.id}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-auto py-3 px-3"
                          disabled={action.processing}
                        >
                          <div className="flex items-start gap-3 w-full">
                            <div className={cn(
                              "p-2 rounded-lg shrink-0",
                              action.variant === 'primary' ? "bg-primary/10 text-primary" : "bg-muted"
                            )}>
                              {action.processing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Icon className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{action.label}</span>
                                {action.badge && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {action.badge}
                                  </Badge>
                                )}
                              </div>
                              {action.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {action.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        {action.submenu.map((item, idx) => (
                          <DropdownMenuItem key={idx} onClick={item.onClick}>
                            {item.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }

                return (
                  <Button
                    key={action.id}
                    variant="ghost"
                    className="w-full justify-start h-auto py-3 px-3"
                    onClick={action.onClick}
                    disabled={action.processing || !action.onClick}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        action.variant === 'primary' ? "bg-primary/10 text-primary" : "bg-muted"
                      )}>
                        {action.processing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{action.label}</span>
                          {action.badge && (
                            <Badge variant="secondary" className="text-[10px]">
                              {action.badge}
                            </Badge>
                          )}
                        </div>
                        {action.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {action.description}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  </Button>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
