import { useState, useEffect } from 'react';
import { 
  Lightbulb, X, Split, Scissors, Mic, Music, 
  Shuffle, ArrowRight, ChevronRight, Piano,
  PlayCircle, GitCompare, Tag, Volume2, Clock, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Track } from '@/types/track';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';

interface StudioContextTipsProps {
  track: Track;
  hasStems: boolean;
  className?: string;
}

interface Tip {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: string;
  condition: boolean;
  priority: number;
}

export const StudioContextTips = ({ track, hasStems, className }: StudioContextTipsProps) => {
  const [dismissedTips, setDismissedTips] = useState<string[]>([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const { editMode, latestCompletion } = useSectionEditorStore();

  // Load dismissed tips from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('studio_dismissed_tips');
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
  const isEditing = editMode === 'editing';
  const hasCompletion = !!latestCompletion;

  const allTips: Tip[] = [
    // Context-aware tips that appear based on current state
    {
      id: 'preview_section',
      icon: <PlayCircle className="w-4 h-4" />,
      title: 'Прослушайте перед заменой',
      description: 'Нажмите кнопку воспроизведения, чтобы прослушать выбранную секцию перед её заменой.',
      condition: isEditing,
      priority: 0,
    },
    {
      id: 'compare_versions',
      icon: <GitCompare className="w-4 h-4" />,
      title: 'Сравните результаты',
      description: 'После генерации сравните оригинал с новой версией. Переключайтесь между A и B для выбора лучшего варианта.',
      condition: hasCompletion,
      priority: 0,
    },
    {
      id: 'use_tags',
      icon: <Tag className="w-4 h-4" />,
      title: 'Используйте теги',
      description: 'Добавьте музыкальные теги (rock, electronic, acoustic) для более точной генерации новой секции.',
      condition: isEditing,
      priority: 1,
    },
    // Standard tips
    {
      id: 'separate_stems',
      icon: <Split className="w-4 h-4" />,
      title: 'Разделите на стемы',
      description: 'Выделите вокал, бас, ударные и мелодию в отдельные дорожки для детального микширования.',
      action: 'Разделить',
      condition: canSeparate && !isEditing,
      priority: 2,
    },
    {
      id: 'replace_section',
      icon: <Scissors className="w-4 h-4" />,
      title: 'Замените часть трека',
      description: 'Не нравится куплет или припев? Выберите секцию и перегенерируйте её с новым текстом.',
      action: 'Заменить секцию',
      condition: canReplace && !isEditing,
      priority: 3,
    },
    {
      id: 'replace_vocal',
      icon: <Mic className="w-4 h-4" />,
      title: 'Смените вокал',
      description: 'Замените голос в треке на другой AI-вокал, сохранив оригинальную аранжировку.',
      condition: canReplace && hasVocals && !isEditing,
      priority: 4,
    },
    {
      id: 'replace_arrangement',
      icon: <Music className="w-4 h-4" />,
      title: 'Новая аранжировка',
      description: 'Сохраните вокал и создайте полностью новую инструментальную часть.',
      condition: canReplace && hasVocals && !isEditing,
      priority: 5,
    },
    {
      id: 'remix',
      icon: <Shuffle className="w-4 h-4" />,
      title: 'Создайте ремикс',
      description: 'Переосмыслите трек в другом стиле - от EDM до джаза.',
      condition: !!track.suno_id && !isEditing,
      priority: 6,
    },
    {
      id: 'extend',
      icon: <ArrowRight className="w-4 h-4" />,
      title: 'Расширьте трек',
      description: 'Добавьте новые части к существующему треку, продолжая его историю.',
      condition: !!track.suno_id && !isEditing,
      priority: 7,
    },
    {
      id: 'midi_transcription',
      icon: <Piano className="w-4 h-4" />,
      title: 'MIDI транскрипция',
      description: 'Создайте MIDI файл для редактирования нот в DAW. Выберите модель: MT3 для барабанов, ByteDance для пианино, Basic Pitch для вокала.',
      condition: (hasStems || !!track.suno_id) && !isEditing,
      priority: 8,
    },
    {
      id: 'keyboard_shortcuts',
      icon: <Sparkles className="w-4 h-4" />,
      title: 'Горячие клавиши',
      description: 'Space - воспроизведение, M - mute, ← → - перемотка, Esc - отмена выделения.',
      condition: !isEditing,
      priority: 9,
    },
  ];

  const availableTips = allTips
    .filter(tip => tip.condition && !dismissedTips.includes(tip.id))
    .sort((a, b) => a.priority - b.priority);

  const dismissTip = (tipId: string) => {
    const newDismissed = [...dismissedTips, tipId];
    setDismissedTips(newDismissed);
    localStorage.setItem('studio_dismissed_tips', JSON.stringify(newDismissed));
    
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

  return (
    <div className={cn(
      "px-4 sm:px-6 py-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/30",
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-primary/20 text-primary shrink-0">
          <Lightbulb className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-primary/10">
              {currentTip.icon}
            </span>
            <h4 className="text-sm font-medium">{currentTip.title}</h4>
          </div>
          <p className="text-xs text-muted-foreground">{currentTip.description}</p>
        </div>

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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => dismissTip(currentTip.id)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

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
};
