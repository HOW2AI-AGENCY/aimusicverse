/**
 * MobileTrackActionSheet - Mobile-optimized action sheet for track menu
 * Uses MobileActionSheet pattern with proper touch targets and haptic feedback
 * Includes premium feature gating for studio actions
 */

import { useMemo } from 'react';
import { MobileActionSheet } from '@/components/mobile/MobileActionSheet';
import type { Track } from '@/types/track';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable } from '@/lib/trackActionConditions';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { getTranscriptionConfig } from '@/lib/transcription-utils';
import {
  Info,
  Globe,
  Lock,
  Pencil,
  Download,
  FileMusic,
  Share2,
  Wand2,
  Music,
  Volume2,
  Sparkles,
  Scissors,
  Plus,
  PlaySquare,
  ListMusic,
  Trash2,
  Crown,
  Droplet,
  Layers,
  RefreshCw,
  Music2,
  Mic2,
  Drum,
  Guitar,
  Piano,
} from 'lucide-react';

interface StemInfo {
  id: string;
  stem_type: string;
  audio_url: string;
}

interface MobileTrackActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
  trackList?: Track[];
  trackIndex?: number;
  actionState: TrackActionState;
  stems?: StemInfo[];
  isProcessing: boolean;
  onAction: (actionId: ActionId, stemId?: string, stemType?: string) => void;
  /** If false, delete actions will be hidden (for non-owners viewing public tracks) */
  isOwner?: boolean;
}

// Icon mapping for stem types
function getStemIcon(stemType: string) {
  const type = stemType.toLowerCase();
  if (type.includes('vocal')) return Mic2;
  if (type.includes('drum')) return Drum;
  if (type.includes('bass') || type.includes('guitar')) return Guitar;
  if (type.includes('piano') || type.includes('keys')) return Piano;
  return Music2;
}

// Label mapping for stem types
function getStemLabel(stemType: string): string {
  const type = stemType.toLowerCase();
  if (type.includes('vocal')) return 'Вокал';
  if (type.includes('drum')) return 'Ударные';
  if (type.includes('bass')) return 'Бас';
  if (type.includes('guitar')) return 'Гитара';
  if (type.includes('piano')) return 'Фортепиано';
  if (type.includes('keys')) return 'Клавишные';
  return stemType;
}

export function MobileTrackActionSheet({
  open,
  onOpenChange,
  track,
  trackList,
  trackIndex,
  actionState,
  stems = [],
  isProcessing,
  onAction,
  isOwner = true,
}: MobileTrackActionSheetProps) {
  // Feature access checks
  const { hasAccess: canReplaceSection, requiredTier: replaceTier } = useFeatureAccess('section_replace');
  const { hasAccess: canStemDetailed, requiredTier: stemDetailedTier } = useFeatureAccess('stem_separation_detailed');
  const { hasAccess: canMidi, requiredTier: midiTier } = useFeatureAccess('midi_transcription');

  const actions = useMemo(() => {
    const groups: Array<{
      title?: string;
      actions: Array<{
        label: string;
        icon?: React.ReactNode;
        onClick: () => void;
        variant?: 'default' | 'destructive' | 'muted';
        disabled?: boolean;
      }>;
    }> = [];

    // Info & Queue Actions Group
    const infoActions = [];
    
    if (isActionAvailable('details', track, actionState)) {
      infoActions.push({
        label: 'Детали трека',
        icon: <Info className="w-5 h-5" />,
        onClick: () => onAction('details'),
      });
    }

    if (isActionAvailable('rename', track, actionState)) {
      infoActions.push({
        label: 'Переименовать',
        icon: <Pencil className="w-5 h-5" />,
        onClick: () => onAction('rename'),
      });
    }

    if (isActionAvailable('toggle_public', track, actionState)) {
      infoActions.push({
        label: track.is_public ? 'Сделать приватным' : 'Опубликовать',
        icon: track.is_public ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5" />,
        onClick: () => onAction('toggle_public'),
        disabled: isProcessing,
      });
    }

    // Queue actions
    if (track.audio_url && track.status === 'completed') {
      infoActions.push({
        label: 'Добавить в очередь',
        icon: <ListMusic className="w-5 h-5" />,
        onClick: () => onAction('add_to_queue'),
      });

      infoActions.push({
        label: 'Играть следующим',
        icon: <PlaySquare className="w-5 h-5" />,
        onClick: () => onAction('play_next'),
      });
    }

    if (infoActions.length > 0) {
      groups.push({ actions: infoActions });
    }

    // Download & Share Group
    const downloadShareActions = [];
    
    if (isActionAvailable('download', track, actionState)) {
      downloadShareActions.push({
        label: 'Скачать аудио',
        icon: <Download className="w-5 h-5" />,
        onClick: () => onAction('download'),
        disabled: isProcessing,
      });
    }

    if (isActionAvailable('download_midi', track, actionState)) {
      downloadShareActions.push({
        label: 'Скачать MIDI',
        icon: <FileMusic className="w-5 h-5" />,
        onClick: () => onAction('download_midi'),
        disabled: isProcessing,
      });
    }

    if (isActionAvailable('share', track, actionState)) {
      downloadShareActions.push({
        label: 'Поделиться',
        icon: <Share2 className="w-5 h-5" />,
        onClick: () => onAction('share'),
      });
    }

    if (downloadShareActions.length > 0) {
      groups.push({ title: 'Скачать и поделиться', actions: downloadShareActions });
    }

    // Studio & Creation Actions Group
    const studioActions = [];
    
    if (isActionAvailable('open_studio', track, actionState)) {
      studioActions.push({
        label: actionState.stemCount > 0 
          ? `Открыть в студии (${actionState.stemCount} стемов)` 
          : 'Открыть в студии',
        icon: <Layers className="w-5 h-5" />,
        onClick: () => onAction('open_studio'),
      });
    }

    // Section Replace - Premium gated
    if (isActionAvailable('replace_section', track, actionState)) {
      if (canReplaceSection) {
        studioActions.push({
          label: 'Замена секции',
          icon: <RefreshCw className="w-5 h-5" />,
          onClick: () => onAction('replace_section'),
        });
      } else {
        studioActions.push({
          label: `Замена секции [${replaceTier?.toUpperCase()}]`,
          icon: <Lock className="w-5 h-5" />,
          onClick: () => onAction('replace_section'),
          variant: 'muted' as const,
          disabled: true,
        });
      }
    }

    // Stems - Basic (free) and Detailed (premium)
    if (isActionAvailable('stems_simple', track, actionState)) {
      studioActions.push({
        label: 'Стемы (2 дорожки) — FREE',
        icon: <Scissors className="w-5 h-5" />,
        onClick: () => onAction('stems_simple'),
        disabled: isProcessing,
      });
    }

    if (isActionAvailable('stems_detailed', track, actionState)) {
      if (canStemDetailed) {
        studioActions.push({
          label: 'Стемы (6+ дорожек)',
          icon: <Wand2 className="w-5 h-5" />,
          onClick: () => onAction('stems_detailed'),
          disabled: isProcessing,
        });
      } else {
        studioActions.push({
          label: `Стемы (6+ дорожек) [${stemDetailedTier?.toUpperCase()}]`,
          icon: <Lock className="w-5 h-5" />,
          onClick: () => onAction('stems_detailed'),
          variant: 'muted' as const,
          disabled: true,
        });
      }
    }

    if (isActionAvailable('add_vocals', track, actionState)) {
      studioActions.push({
        label: 'Добавить вокал',
        icon: <Music className="w-5 h-5" />,
        onClick: () => onAction('add_vocals'),
      });
    }

    if (isActionAvailable('add_instrumental', track, actionState)) {
      studioActions.push({
        label: 'Добавить инструментал',
        icon: <Volume2 className="w-5 h-5" />,
        onClick: () => onAction('add_instrumental'),
      });
    }

    if (isActionAvailable('extend', track, actionState)) {
      studioActions.push({
        label: 'Продлить трек',
        icon: <Plus className="w-5 h-5" />,
        onClick: () => onAction('extend'),
      });
    }

    if (isActionAvailable('cover', track, actionState)) {
      studioActions.push({
        label: 'Создать кавер',
        icon: <Sparkles className="w-5 h-5" />,
        onClick: () => onAction('cover'),
      });
    }

    if (studioActions.length > 0) {
      groups.push({ title: 'Студия', actions: studioActions });
    }

    // MIDI Transcription Group - Only show after stems generated
    if (actionState.stemCount > 0) {
      const midiActions = [];
      
      if (canMidi) {
        // Add action for each stem
        for (const stem of stems) {
          const StemIcon = getStemIcon(stem.stem_type);
          const label = getStemLabel(stem.stem_type);
          const config = getTranscriptionConfig(stem.stem_type);
          
          midiActions.push({
            label: `${label} → MIDI (${config.model})`,
            icon: <StemIcon className="w-5 h-5" />,
            onClick: () => onAction('transcribe_midi', stem.id, stem.stem_type),
            disabled: isProcessing,
          });
        }
        
        // All stems to notes
        midiActions.push({
          label: 'Все стемы → Ноты',
          icon: <Music2 className="w-5 h-5" />,
          onClick: () => onAction('transcribe_notes'),
          disabled: isProcessing,
        });
      } else {
        // Locked MIDI transcription
        midiActions.push({
          label: `MIDI транскрипция [${midiTier?.toUpperCase()}]`,
          icon: <Lock className="w-5 h-5" />,
          onClick: () => onAction('transcribe_midi'),
          variant: 'muted' as const,
          disabled: true,
        });
      }
      
      if (midiActions.length > 0) {
        groups.push({ title: 'MIDI транскрипция', actions: midiActions });
      }
    }

    // Quality Actions Group
    const qualityActions = [];
    
    if (isActionAvailable('upscale', track, actionState)) {
      qualityActions.push({
        label: 'Улучшить качество',
        icon: <Crown className="w-5 h-5" />,
        onClick: () => onAction('upscale'),
        disabled: isProcessing,
      });
    }

    if (isActionAvailable('remove_watermark', track, actionState)) {
      qualityActions.push({
        label: 'Убрать водяной знак',
        icon: <Droplet className="w-5 h-5" />,
        onClick: () => onAction('remove_watermark'),
      });
    }

    if (qualityActions.length > 0) {
      groups.push({ title: 'Качество', actions: qualityActions });
    }

    // Delete Actions Group - only for owners
    if (isOwner) {
      const deleteActions = [];
      const hasMultipleVersions = (actionState?.versionCount || 0) > 1;
      
      if (hasMultipleVersions) {
        deleteActions.push({
          label: 'Удалить версию',
          icon: <Trash2 className="w-5 h-5" />,
          onClick: () => onAction('delete_version'),
          variant: 'destructive' as const,
        });
        
        deleteActions.push({
          label: `Удалить все версии (${actionState?.versionCount})`,
          icon: <Trash2 className="w-5 h-5" />,
          onClick: () => onAction('delete_all'),
          variant: 'destructive' as const,
        });
      } else {
        deleteActions.push({
          label: 'Удалить трек',
          icon: <Trash2 className="w-5 h-5" />,
          onClick: () => onAction('delete'),
          variant: 'destructive' as const,
        });
      }

      if (deleteActions.length > 0) {
        groups.push({ actions: deleteActions });
      }
    }

    return groups;
  }, [track, actionState, stems, isProcessing, onAction, isOwner, canReplaceSection, replaceTier, canStemDetailed, stemDetailedTier, canMidi, midiTier]);

  return (
    <MobileActionSheet
      open={open}
      onOpenChange={onOpenChange}
      title={track.title || 'Меню трека'}
      description={track.style ? `${track.style}` : undefined}
      groups={actions}
      showCancel={true}
      cancelLabel="Отмена"
    />
  );
}
