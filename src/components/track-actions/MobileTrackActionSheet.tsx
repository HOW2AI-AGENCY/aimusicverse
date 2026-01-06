/**
 * MobileTrackActionSheet - Mobile-optimized action sheet for track menu
 * Uses MobileActionSheet pattern with proper touch targets and haptic feedback
 */

import { useMemo } from 'react';
import { MobileActionSheet } from '@/components/mobile/MobileActionSheet';
import type { Track } from '@/types/track';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable } from '@/lib/trackActionConditions';
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
} from 'lucide-react';

interface MobileTrackActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
  trackList?: Track[];
  trackIndex?: number;
  actionState: TrackActionState;
  isProcessing: boolean;
  onAction: (actionId: ActionId) => void;
}

export function MobileTrackActionSheet({
  open,
  onOpenChange,
  track,
  trackList,
  trackIndex,
  actionState,
  isProcessing,
  onAction,
}: MobileTrackActionSheetProps) {
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
        label: 'Открыть в студии',
        icon: <Wand2 className="w-5 h-5" />,
        onClick: () => onAction('open_studio'),
      });
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

    if (isActionAvailable('stems', track, actionState)) {
      studioActions.push({
        label: 'Разделить на стемы',
        icon: <Scissors className="w-5 h-5" />,
        onClick: () => onAction('stems'),
        disabled: isProcessing,
      });
    }

    if (studioActions.length > 0) {
      groups.push({ title: 'Студия', actions: studioActions });
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

    // Delete Actions Group
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

    return groups;
  }, [track, actionState, isProcessing, onAction]);

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
