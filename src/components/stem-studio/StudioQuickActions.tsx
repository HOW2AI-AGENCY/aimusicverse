import { 
  Split, Scissors, Mic, Music, Shuffle, Clock, 
  Wand2, Download, Loader2, ArrowRight, BrainCircuit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Track } from '@/types/track';
import { StemActionsSheet, StemAnalysisSheet } from '@/components/stem-studio/mobile';

interface StudioQuickActionsProps {
  track: Track;
  hasStems: boolean;
  stems?: any[]; // TrackStem array
  isSeparating?: boolean;
  onSeparate?: (mode: 'simple' | 'detailed') => void;
  onReplaceSection?: () => void;
  onReplaceVocal?: () => void;
  onReplaceArrangement?: () => void;
  onRemix?: () => void;
  onExtend?: () => void;
  onTrim?: () => void;
}

interface ActionItem {
  icon: React.ReactNode;
  label: string;
  shortLabel?: string;
  onClick?: () => void;
  available: boolean;
  badge?: string;
  processing?: boolean;
  variant?: 'default' | 'primary';
}

export const StudioQuickActions = ({
  track,
  hasStems,
  stems = [],
  isSeparating,
  onSeparate,
  onReplaceSection,
  onReplaceVocal,
  onReplaceArrangement,
  onRemix,
  onExtend,
  onTrim,
}: StudioQuickActionsProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const canSeparate = !!track.suno_id && !hasStems;
  const canReplace = !!track.suno_id && !!track.suno_task_id;
  const canRemix = !!track.suno_id;
  const canExtend = !!track.suno_id;
  const hasVocals = track.has_vocals !== false && !track.is_instrumental;

  const handleComingSoon = (feature: string) => {
    toast.info(`${feature} скоро будет доступно`);
  };

  const actions: ActionItem[] = [
    {
      icon: isSeparating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Split className="w-4 h-4" />,
      label: 'Разделить на стемы',
      shortLabel: 'Стемы',
      available: canSeparate,
      processing: isSeparating,
      variant: 'primary',
      onClick: onSeparate ? () => {} : undefined, // Dropdown handles this
    },
    {
      icon: <Scissors className="w-4 h-4" />,
      label: 'Заменить секцию',
      shortLabel: 'Секция',
      available: canReplace,
      onClick: onReplaceSection,
    },
    {
      icon: <Mic className="w-4 h-4" />,
      label: 'Заменить вокал',
      shortLabel: 'Вокал',
      available: canReplace && hasVocals,
      onClick: onReplaceVocal,
    },
    {
      icon: <Music className="w-4 h-4" />,
      label: 'Заменить аранжировку',
      shortLabel: 'Аранж.',
      available: canReplace,
      onClick: onReplaceArrangement,
    },
    {
      icon: <Shuffle className="w-4 h-4" />,
      label: 'Создать ремикс',
      shortLabel: 'Ремикс',
      available: canRemix,
      badge: 'AI',
      onClick: onRemix,
    },
    {
      icon: <ArrowRight className="w-4 h-4" />,
      label: 'Расширить трек',
      shortLabel: 'Расширить',
      available: canExtend,
      badge: 'AI',
      onClick: onExtend,
    },
    {
      icon: <Clock className="w-4 h-4" />,
      label: 'Обрезать трек',
      shortLabel: 'Обрезать',
      available: !!track.audio_url,
      onClick: onTrim,
    },
  ];

  const availableActions = actions.filter(a => a.available);

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <div className="px-4 sm:px-6 py-2 border-b border-border/30 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <span className="text-xs text-muted-foreground font-medium shrink-0">Действия:</span>
        
        {availableActions.map((action, index) => {
          // Special handling for separate action with dropdown
          if (action.shortLabel === 'Стемы' && onSeparate) {
            return (
              <DropdownMenu key={index}>
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
                    {action.icon}
                    <span className={isMobile ? "hidden" : ""}>{action.shortLabel || action.label}</span>
                    {action.badge && (
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                        {action.badge}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => onSeparate('simple')}>
                    <Split className="w-4 h-4 mr-2" />
                    Простое (Вокал + Инстр.)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSeparate('detailed')}>
                    <Music className="w-4 h-4 mr-2" />
                    Детальное (6+ стемов)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          return (
            <Button
              key={index}
              variant={action.variant === 'primary' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "h-8 gap-1.5 shrink-0",
                action.variant === 'primary' && "bg-primary text-primary-foreground"
              )}
              onClick={action.onClick}
              disabled={action.processing || !action.onClick}
            >
              {action.icon}
              <span className={isMobile ? "hidden" : ""}>{action.shortLabel || action.label}</span>
              {action.badge && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                  {action.badge}
                </Badge>
              )}
            </Button>
          );
        })}
        
        {/* New Mobile Actions for Stems */}
        {hasStems && stems && stems.length > 0 && isMobile && (
          <>
            <div className="w-px h-6 bg-border shrink-0" />
            <StemActionsSheet
              stems={stems}
              trackId={track.id}
              trackTitle={track.title || 'Трек'}
              trackLyrics={track.lyrics}
              trackStyle={track.style}
              trackPrompt={track.prompt}
              trackTags={track.tags}
              trigger={
                <Button variant="outline" size="sm" className="h-8 gap-1.5 shrink-0">
                  <Wand2 className="w-4 h-4" />
                  <span className="hidden">Стемы</span>
                </Button>
              }
            />
            <StemAnalysisSheet
              trackId={track.id}
              trackTitle={track.title || 'Трек'}
              audioUrl={track.audio_url || ''}
              trigger={
                <Button variant="outline" size="sm" className="h-8 gap-1.5 shrink-0">
                  <BrainCircuit className="w-4 h-4" />
                  <span className="hidden">Анализ</span>
                </Button>
              }
            />
          </>
        )}
      </div>
    </div>
  );
};
