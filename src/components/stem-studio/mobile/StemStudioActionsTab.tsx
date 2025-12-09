/**
 * StemStudioActionsTab - Actions tab for StemStudioMobileLayout
 * 
 * All stem studio actions in organized cards
 */

import { 
  Scissors, Mic, Music, Shuffle, Clock, Wand2,
  Download, ArrowRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

interface ActionCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary';
  badge?: string;
}

function ActionCard({ 
  icon: Icon, 
  title, 
  description, 
  onClick, 
  disabled,
  variant = 'default',
  badge,
}: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full p-4 rounded-xl text-left transition-all",
        "border border-border/50 hover:border-border",
        "flex items-start gap-3",
        disabled && "opacity-50 cursor-not-allowed",
        variant === 'primary' && "bg-primary/5 border-primary/30 hover:border-primary/50"
      )}
    >
      <div className={cn(
        "p-2 rounded-lg flex-shrink-0",
        variant === 'primary' ? "bg-primary/10 text-primary" : "bg-muted"
      )}>
        <Icon className="w-5 h-5" />
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

interface StemStudioActionsTabProps {
  track: Tables<'tracks'>;
  onTrim: () => void;
  onReplaceSection?: () => void;
  onReplaceVocal: () => void;
  onReplaceArrangement: () => void;
  onRemix?: () => void;
  onExtend?: () => void;
  onExportMix?: () => void;
}

export function StemStudioActionsTab({
  track,
  onTrim,
  onReplaceSection,
  onReplaceVocal,
  onReplaceArrangement,
  onRemix,
  onExtend,
  onExportMix,
}: StemStudioActionsTabProps) {
  const canReplaceSection = track.suno_id && track.suno_task_id;
  const canRemix = !!track.suno_id;
  const canExtend = !!track.suno_id;

  return (
    <div className="p-4 space-y-3">
      {/* Trim */}
      <ActionCard
        icon={Scissors}
        title="Обрезать микс"
        description="Выберите фрагмент и сохраните как новый трек"
        onClick={onTrim}
        variant="primary"
      />

      {/* Replace Section */}
      {canReplaceSection && onReplaceSection && (
        <ActionCard
          icon={Wand2}
          title="Заменить секцию"
          description="AI перегенерирует выбранную часть трека"
          onClick={onReplaceSection}
          badge="AI"
        />
      )}

      {/* Replace Vocal */}
      {track.has_vocals && (
        <ActionCard
          icon={Mic}
          title="Заменить вокал"
          description="Замените голос, сохранив аранжировку"
          onClick={onReplaceVocal}
          badge="AI"
        />
      )}

      {/* Replace Arrangement */}
      {!track.is_instrumental && (
        <ActionCard
          icon={Music}
          title="Заменить аранжировку"
          description="Новая музыка с вашим оригинальным вокалом"
          onClick={onReplaceArrangement}
          badge="AI"
        />
      )}

      {/* Remix */}
      {canRemix && onRemix && (
        <ActionCard
          icon={Shuffle}
          title="Создать ремикс"
          description="AI создаст новую версию в другом стиле"
          onClick={onRemix}
          badge="AI"
        />
      )}

      {/* Extend */}
      {canExtend && onExtend && (
        <ActionCard
          icon={Clock}
          title="Расширить трек"
          description="Продлите композицию с помощью AI"
          onClick={onExtend}
          badge="AI"
        />
      )}

      {/* Export Mix */}
      {onExportMix && (
        <ActionCard
          icon={Download}
          title="Экспорт микса"
          description="Скачайте микс с применёнными эффектами"
          onClick={onExportMix}
        />
      )}
    </div>
  );
}
