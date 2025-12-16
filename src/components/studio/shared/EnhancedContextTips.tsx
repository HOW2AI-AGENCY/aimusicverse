/**
 * Enhanced Studio Context Tips
 * Smart tips that change based on current studio state
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Lightbulb, X, ChevronRight, Split, Scissors, 
  Mic, Music, GitCompare, Tag, PlayCircle, 
  Piano, Sparkles, Volume2, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Track } from '@/types/track';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';

type StudioState = 
  | 'idle'           // No active action
  | 'selecting'      // Selecting section
  | 'editing'        // Editing section lyrics/prompt
  | 'processing'     // Waiting for AI generation
  | 'comparing'      // Comparing A/B versions
  | 'mixing';        // Adjusting stem levels

interface Tip {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
  };
  state: StudioState[];
  priority: number;
  persistent?: boolean; // Don't auto-dismiss
}

interface EnhancedContextTipsProps {
  track: Track;
  hasStems: boolean;
  studioState?: StudioState;
  onAction?: (actionId: string) => void;
  className?: string;
}

export function EnhancedContextTips({ 
  track, 
  hasStems,
  studioState = 'idle',
  onAction,
  className,
}: EnhancedContextTipsProps) {
  const [dismissedTips, setDismissedTips] = useState<string[]>([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const { editMode, latestCompletion } = useSectionEditorStore();

  // Derive actual state from store if not provided
  const actualState = useMemo((): StudioState => {
    if (studioState !== 'idle') return studioState;
    if (editMode === 'comparing' || latestCompletion) return 'comparing';
    if (editMode === 'editing') return 'editing';
    if (editMode === 'selecting') return 'selecting';
    return 'idle';
  }, [studioState, editMode, latestCompletion]);

  // Load dismissed tips
  useEffect(() => {
    const saved = localStorage.getItem('studio_context_tips_dismissed');
    if (saved) {
      try {
        setDismissedTips(JSON.parse(saved));
      } catch {
        // Ignore
      }
    }
  }, []);

  const canSeparate = !!track.suno_id && !hasStems;
  const canReplace = !!track.suno_id && !!track.suno_task_id;
  const hasVocals = track.has_vocals !== false && !track.is_instrumental;

  const allTips: Tip[] = useMemo(() => [
    // State-specific tips (highest priority)
    {
      id: 'preview_before_replace',
      icon: PlayCircle,
      title: 'Прослушайте секцию',
      description: 'Нажмите ▶ чтобы прослушать выделенную секцию перед заменой',
      state: ['selecting', 'editing'],
      priority: 0,
      persistent: true,
    },
    {
      id: 'use_tags',
      icon: Tag,
      title: 'Добавьте теги',
      description: 'Теги (rock, electronic, acoustic) помогут AI точнее сгенерировать новую секцию',
      state: ['editing'],
      priority: 1,
    },
    {
      id: 'compare_ab',
      icon: GitCompare,
      title: 'Сравните версии',
      description: 'Переключайтесь между A (оригинал) и B (новая версия) для выбора лучшего варианта',
      state: ['comparing'],
      priority: 0,
      persistent: true,
    },
    {
      id: 'mixing_balance',
      icon: Volume2,
      title: 'Баланс микса',
      description: 'Регулируйте громкость каждого стема для создания идеального баланса',
      state: ['mixing'],
      priority: 0,
    },
    
    // General tips
    {
      id: 'separate_stems',
      icon: Split,
      title: 'Разделите на стемы',
      description: 'Откройте профессиональные возможности микширования',
      action: canSeparate ? { label: 'Разделить', onClick: () => onAction?.('separate') } : undefined,
      state: ['idle'],
      priority: 2,
    },
    {
      id: 'replace_section',
      icon: Scissors,
      title: 'Замените секцию',
      description: 'Кликните на секцию таймлайна или выделите диапазон',
      action: canReplace ? { label: 'Выбрать', onClick: () => onAction?.('replace_section') } : undefined,
      state: ['idle'],
      priority: 3,
    },
    {
      id: 'new_vocal',
      icon: Mic,
      title: 'Новый вокал',
      description: 'Замените голос, сохранив инструментал (требуются стемы)',
      state: ['idle'],
      priority: hasStems && hasVocals ? 4 : 99,
    },
    {
      id: 'new_arrangement',
      icon: Music,
      title: 'Новая аранжировка',
      description: 'Создайте новую музыку для существующего вокала',
      state: ['idle'],
      priority: hasStems && hasVocals ? 5 : 99,
    },
    {
      id: 'midi_export',
      icon: Piano,
      title: 'MIDI транскрипция',
      description: 'Экспортируйте ноты для работы в DAW',
      state: ['idle'],
      priority: 6,
    },
    {
      id: 'shortcuts',
      icon: Sparkles,
      title: 'Горячие клавиши',
      description: 'Space — воспроизведение, M — mute, ← → — перемотка',
      state: ['idle'],
      priority: 7,
    },
  ], [canSeparate, canReplace, hasStems, hasVocals, onAction]);

  const availableTips = useMemo(() => {
    return allTips
      .filter(tip => 
        tip.state.includes(actualState) && 
        !dismissedTips.includes(tip.id) &&
        tip.priority < 99
      )
      .sort((a, b) => a.priority - b.priority);
  }, [allTips, actualState, dismissedTips]);

  // Reset to first tip when state changes
  useEffect(() => {
    setCurrentTipIndex(0);
  }, [actualState]);

  const dismissTip = (tipId: string) => {
    const tip = allTips.find(t => t.id === tipId);
    if (tip?.persistent) return; // Don't dismiss persistent tips
    
    const newDismissed = [...dismissedTips, tipId];
    setDismissedTips(newDismissed);
    localStorage.setItem('studio_context_tips_dismissed', JSON.stringify(newDismissed));
    
    if (currentTipIndex >= availableTips.length - 1) {
      setCurrentTipIndex(0);
    }
  };

  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % availableTips.length);
  };

  if (availableTips.length === 0) {
    return null;
  }

  const currentTip = availableTips[currentTipIndex];
  const TipIcon = currentTip.icon;

  return (
    <div className={cn(
      "px-4 sm:px-6 py-3",
      "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent",
      "border-b border-border/30",
      className
    )}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTip.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex items-start gap-3"
        >
          {/* Icon */}
          <div className="p-2 rounded-full bg-primary/20 text-primary shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded bg-primary/10">
                <TipIcon className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-medium">{currentTip.title}</h4>
            </div>
            <p className="text-xs text-muted-foreground">{currentTip.description}</p>
            
            {/* Action button */}
            {currentTip.action && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 mt-1 text-xs"
                onClick={currentTip.action.onClick}
              >
                {currentTip.action.label}
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {availableTips.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={nextTip}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
            {!currentTip.persistent && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => dismissTip(currentTip.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      {availableTips.length > 1 && (
        <div className="flex justify-center gap-1 mt-2">
          {availableTips.map((_, idx) => (
            <button
              key={idx}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                idx === currentTipIndex ? "bg-primary" : "bg-primary/30"
              )}
              onClick={() => setCurrentTipIndex(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
