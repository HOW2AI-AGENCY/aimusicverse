/**
 * Comprehensive Stem Actions Sheet for Mobile
 * Provides all stem-as-reference workflows with clear UI
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Music,
  Music2,
  Wand2,
  Mic2,
  Guitar,
  Loader2,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { TrackStem } from '@/hooks/useTrackStems';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ReferenceManager } from '@/services/audio-reference';
import { logger } from '@/lib/logger';

interface StemActionsSheetProps {
  stems: TrackStem[];
  trackId: string;
  trackTitle: string;
  trackLyrics?: string | null;
  trackStyle?: string | null;
  trackPrompt?: string | null;
  trackTags?: string | null;
  trigger?: React.ReactNode;
}

interface ActionOption {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  requiresVocals?: boolean;
  requiresInstrumental?: boolean;
}

const actionOptions: ActionOption[] = [
  {
    id: 'regenerate-from-stem',
    title: 'Полная регенерация',
    description: 'Создать новый трек на основе выбранного стема',
    icon: RefreshCw,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  },
  {
    id: 'create-instrumental',
    title: 'Создать инструментал',
    description: 'Сгенерировать новую инструментальную композицию',
    icon: Guitar,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
  },
  {
    id: 'add-instrumental-to-vocals',
    title: 'Добавить аранжировку',
    description: 'Создать новый инструментал к вокалу',
    icon: Music,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    requiresVocals: true,
  },
  {
    id: 'add-vocals-to-instrumental',
    title: 'Добавить вокал',
    description: 'Создать новый вокал к инструменталу',
    icon: Mic2,
    color: 'text-green-500 bg-green-500/10 border-green-500/30',
    requiresInstrumental: true,
  },
];

const stemLabels: Record<string, string> = {
  vocals: 'Вокал',
  vocal: 'Вокал',
  backing_vocals: 'Бэк-вокал',
  drums: 'Ударные',
  bass: 'Бас',
  guitar: 'Гитара',
  keyboard: 'Клавишные',
  piano: 'Пианино',
  strings: 'Струнные',
  brass: 'Духовые',
  percussion: 'Перкуссия',
  synth: 'Синтезатор',
  instrumental: 'Инструментал',
  other: 'Другое',
};

const stemColors: Record<string, string> = {
  vocals: 'bg-blue-500/10 border-blue-500/30',
  vocal: 'bg-blue-500/10 border-blue-500/30',
  backing_vocals: 'bg-cyan-500/10 border-cyan-500/30',
  drums: 'bg-orange-500/10 border-orange-500/30',
  bass: 'bg-purple-500/10 border-purple-500/30',
  guitar: 'bg-amber-500/10 border-amber-500/30',
  instrumental: 'bg-green-500/10 border-green-500/30',
  other: 'bg-gray-500/10 border-gray-500/30',
};

const getStemLabel = (stemType: string): string => {
  return stemLabels[stemType.toLowerCase()] || stemType;
};

const getStemColor = (stemType: string): string => {
  return stemColors[stemType.toLowerCase()] || stemColors.other;
};

export const StemActionsSheet = ({
  stems,
  trackId,
  trackTitle,
  trackLyrics,
  trackStyle,
  trackPrompt,
  trackTags,
  trigger,
}: StemActionsSheetProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedStem, setSelectedStem] = useState<TrackStem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const hasVocals = stems.some(s => 
    s.stem_type.toLowerCase().includes('vocal')
  );
  const hasInstrumental = stems.some(s => 
    s.stem_type.toLowerCase() === 'instrumental' || 
    s.stem_type.toLowerCase() === 'other'
  );

  const availableActions = actionOptions.filter(action => {
    if (action.requiresVocals && !hasVocals) return false;
    if (action.requiresInstrumental && !hasInstrumental) return false;
    return true;
  });

  const handleActionSelect = (actionId: string) => {
    setSelectedAction(actionId);
    setSelectedStem(null);
  };

  const handleStemSelect = (stem: TrackStem) => {
    setSelectedStem(stem);
  };

  const handleExecuteAction = async () => {
    if (!selectedAction || !selectedStem) return;

    setIsProcessing(true);
    try {
      const stemLabel = getStemLabel(selectedStem.stem_type);
      
      // Prepare reference data with track context
      // Use unified ReferenceManager
      ReferenceManager.createFromStem({
        audioUrl: selectedStem.audio_url,
        stemType: selectedStem.stem_type,
        trackId,
        trackTitle,
        lyrics: trackLyrics || undefined,
        style: trackStyle || undefined,
        action: selectedAction,
      });

      // Show success message based on action
      const actionMessages: Record<string, string> = {
        'regenerate-from-stem': 'Стем сохранён для полной регенерации',
        'create-instrumental': 'Стем сохранён для создания инструментала',
        'add-instrumental-to-vocals': 'Вокал сохранён для добавления аранжировки',
        'add-vocals-to-instrumental': 'Инструментал сохранён для добавления вокала',
      };

      toast.success(actionMessages[selectedAction] || 'Референс сохранён!');
      setOpen(false);

      // Navigate to generation page
      navigate('/', { state: { openGenerate: true, fromStemAction: selectedAction } });
    } catch (error) {
      logger.error('Error executing stem action', error);
      toast.error('Ошибка при сохранении референса');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (selectedStem && selectedAction) {
      setSelectedStem(null);
    } else if (selectedAction) {
      setSelectedAction(null);
    }
  };

  const renderActionSelection = () => (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        Выберите действие для работы со стемами
      </p>
      {availableActions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={() => handleActionSelect(action.id)}
            className={cn(
              "w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left",
              action.color,
              "hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            <div className="mt-0.5">
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">{action.title}</h3>
              <p className="text-xs opacity-80">{action.description}</p>
            </div>
            <ArrowRight className="w-5 h-5 opacity-50 shrink-0 mt-1" />
          </button>
        );
      })}
    </div>
  );

  const renderStemSelection = () => {
    const action = actionOptions.find(a => a.id === selectedAction);
    if (!action) return null;

    // Filter stems based on action requirements
    let relevantStems = stems;
    if (action.id === 'add-instrumental-to-vocals') {
      relevantStems = stems.filter(s => 
        s.stem_type.toLowerCase().includes('vocal')
      );
    } else if (action.id === 'add-vocals-to-instrumental') {
      relevantStems = stems.filter(s => 
        s.stem_type.toLowerCase() === 'instrumental' ||
        s.stem_type.toLowerCase() === 'other'
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="h-8 w-8 p-0"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Button>
          <div>
            <h3 className="font-semibold text-sm">{action.title}</h3>
            <p className="text-xs text-muted-foreground">Выберите стем</p>
          </div>
        </div>

        {relevantStems.map((stem) => (
          <button
            key={stem.id}
            onClick={() => handleStemSelect(stem)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
              getStemColor(stem.stem_type),
              selectedStem?.id === stem.id && "ring-2 ring-primary border-primary",
              "hover:scale-[1.01] active:scale-[0.99]"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              getStemColor(stem.stem_type)
            )}>
              <Music2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{getStemLabel(stem.stem_type)}</p>
              <p className="text-xs opacity-70">
                {stem.separation_mode === 'detailed' ? 'Детальное' : 'Простое'} разделение
              </p>
            </div>
            {selectedStem?.id === stem.id && (
              <div className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
    );
  };

  const renderConfirmation = () => {
    const action = actionOptions.find(a => a.id === selectedAction);
    if (!action || !selectedStem) return null;

    const Icon = action.icon;
    const stemLabel = getStemLabel(selectedStem.stem_type);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="h-8 w-8 p-0"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Button>
          <h3 className="font-semibold text-sm">Подтверждение</h3>
        </div>

        {/* Summary Card */}
        <div className={cn(
          "p-4 rounded-lg border-2",
          action.color
        )}>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{action.title}</h4>
              <p className="text-xs opacity-70 mt-0.5">{action.description}</p>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-current/20">
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-70">Стем:</span>
              <span className="font-medium">{stemLabel}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-70">Трек:</span>
              <span className="font-medium truncate ml-2">{trackTitle}</span>
            </div>
          </div>
        </div>

        {/* Context Info */}
        {(trackStyle || trackTags) && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs font-medium mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Контекст оригинального трека
            </p>
            {trackStyle && (
              <p className="text-xs opacity-70 mb-1">
                <span className="font-medium">Стиль:</span> {trackStyle}
              </p>
            )}
            {trackTags && (
              <p className="text-xs opacity-70">
                <span className="font-medium">Теги:</span> {trackTags}
              </p>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground">
            Вы будете перенаправлены на страницу генерации с предзаполненными данными.
            Настройте параметры и запустите генерацию.
          </p>
        </div>

        <Button 
          onClick={handleExecuteAction}
          disabled={isProcessing}
          className="w-full gap-2 h-11"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Обработка...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Продолжить
            </>
          )}
        </Button>
      </div>
    );
  };

  const renderContent = () => {
    if (selectedStem && selectedAction) {
      return renderConfirmation();
    } else if (selectedAction) {
      return renderStemSelection();
    } else {
      return renderActionSelection();
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Wand2 className="w-4 h-4" />
            Использовать стемы
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Работа со стемами
          </SheetTitle>
          <SheetDescription>
            Используйте стемы для создания новых треков
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          {renderContent()}
        </div>
      </SheetContent>
    </Sheet>
  );
};
