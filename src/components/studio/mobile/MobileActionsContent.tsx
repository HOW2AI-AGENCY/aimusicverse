/**
 * Mobile Actions Sheet
 * Unified actions panel for mobile studio
 */

import { 
  Scissors, Split, Mic, Music, Shuffle, Clock, 
  Wand2, ArrowRight, Loader2, BrainCircuit, Piano
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Track } from '@/types/track';

interface ActionCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'soon';
  badge?: string;
  processing?: boolean;
}

function ActionCard({ 
  icon: Icon, 
  title, 
  description, 
  onClick, 
  disabled,
  variant = 'default',
  badge,
  processing,
}: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || variant === 'soon' || processing}
      className={cn(
        "w-full p-4 rounded-xl text-left transition-all",
        "border border-border/50 hover:border-border",
        "flex items-start gap-3",
        disabled && "opacity-50 cursor-not-allowed",
        variant === 'primary' && "bg-primary/5 border-primary/30 hover:border-primary/50",
        variant === 'soon' && "opacity-60 cursor-not-allowed"
      )}
    >
      <div className={cn(
        "p-2 rounded-lg flex-shrink-0",
        variant === 'primary' ? "bg-primary/10 text-primary" : "bg-muted"
      )}>
        {processing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
          {badge && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
    </button>
  );
}

interface MobileActionsContentProps {
  track: Track;
  hasStems: boolean;
  isSeparating: boolean;
  onSeparate: (mode: 'simple' | 'detailed') => void;
  onReplaceSection?: () => void;
  onTrim: () => void;
  onReplaceVocal?: () => void;
  onReplaceArrangement?: () => void;
  onRemix?: () => void;
  onExtend?: () => void;
  onMIDI?: () => void;
  onAnalyze?: () => void;
}

export function MobileActionsContent({
  track,
  hasStems,
  isSeparating,
  onSeparate,
  onReplaceSection,
  onTrim,
  onReplaceVocal,
  onReplaceArrangement,
  onRemix,
  onExtend,
  onMIDI,
  onAnalyze,
}: MobileActionsContentProps) {
  const canReplaceSection = track.suno_id && track.suno_task_id;
  const canRemix = !!track.suno_id;
  const canExtend = !!track.suno_id;
  const hasVocals = track.has_vocals !== false && !track.is_instrumental;

  return (
    <div className="p-4 space-y-3">
      {/* Section: Editing */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Редактирование
        </h3>
        
        {/* Stem Separation */}
        {!hasStems && (
          <ActionCard
            icon={Split}
            title="Разделить на стемы"
            description="Вокал, барабаны, бас и мелодия"
            onClick={() => onSeparate('detailed')}
            disabled={isSeparating}
            processing={isSeparating}
            variant="primary"
          />
        )}

        {/* Replace Section */}
        {canReplaceSection && onReplaceSection && (
          <ActionCard
            icon={Wand2}
            title="Заменить секцию"
            description="AI перегенерирует выбранную часть"
            onClick={onReplaceSection}
            badge="AI"
          />
        )}

        {/* Trim */}
        <ActionCard
          icon={Clock}
          title="Обрезать трек"
          description="Выберите фрагмент и сохраните"
          onClick={onTrim}
        />
      </div>

      {/* Section: Creation */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Создание
        </h3>

        {/* Replace Vocal - only if has stems and vocals */}
        {hasStems && hasVocals && onReplaceVocal && (
          <ActionCard
            icon={Mic}
            title="Новый вокал"
            description="Замените голос, сохранив аранжировку"
            onClick={onReplaceVocal}
            badge="AI"
          />
        )}

        {/* Replace Arrangement - only if has stems and vocals */}
        {hasStems && hasVocals && onReplaceArrangement && (
          <ActionCard
            icon={Music}
            title="Новая аранжировка"
            description="Новая музыка с вашим вокалом"
            onClick={onReplaceArrangement}
            badge="AI"
          />
        )}

        {/* Remix */}
        {canRemix && onRemix && (
          <ActionCard
            icon={Shuffle}
            title="Создать ремикс"
            description="AI создаст версию в другом стиле"
            onClick={onRemix}
            badge="AI"
          />
        )}

        {/* Extend */}
        {canExtend && onExtend && (
          <ActionCard
            icon={ArrowRight}
            title="Расширить трек"
            description="Продлите композицию с помощью AI"
            onClick={onExtend}
            badge="AI"
          />
        )}
      </div>

      {/* Section: Analysis */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Анализ
        </h3>

        {/* MIDI */}
        {onMIDI && (
          <ActionCard
            icon={Piano}
            title="MIDI транскрипция"
            description="Экспортируйте ноты для DAW"
            onClick={onMIDI}
          />
        )}

        {/* AI Analysis */}
        {onAnalyze && (
          <ActionCard
            icon={BrainCircuit}
            title="AI Анализ"
            description="Определить стиль и настроение"
            onClick={onAnalyze}
          />
        )}
      </div>
    </div>
  );
}
