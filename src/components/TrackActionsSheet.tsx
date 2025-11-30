import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Track } from '@/hooks/useTracksOptimized';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Play, Download, Share2, Heart, MoreHorizontal, 
  Info, Edit3, Trash2, Eye, EyeOff, Send,
  Scissors, Wand2, ImagePlus, FileAudio, Video
} from 'lucide-react';
import { useTrackActions } from '@/hooks/useTrackActions';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrackActionsSheetProps {
  track: Track | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: () => void;
  onDownload?: () => void;
}

type ActionItem = {
  icon: React.ComponentType<any>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'ghost' | 'destructive';
} | {
  separator: true;
};

export function TrackActionsSheet({ 
  track, 
  open, 
  onOpenChange,
  onDelete,
  onDownload 
}: TrackActionsSheetProps) {
  const { 
    isProcessing, 
    handleTogglePublic, 
    handleSeparateVocals,
    handleGenerateCover,
    handleConvertToWav,
    handleCreateVideo,
  } = useTrackActions();
  
  if (!track) return null;

  const handleSendToTelegram = async () => {
    try {
      const { error } = await supabase.functions.invoke('send-telegram-notification', {
        body: {
          type: 'track_share',
          track_id: track.id,
        },
      });

      if (error) throw error;
      toast.success('Трек отправлен в Telegram');
    } catch (error: any) {
      console.error('Send to Telegram error:', error);
      toast.error(error.message || 'Ошибка отправки');
    }
  };

  const actions: ActionItem[] = [
    {
      icon: Info,
      label: 'Детали трека',
      onClick: () => {
        // This will be handled by parent
        onOpenChange(false);
      },
    },
    {
      icon: Heart,
      label: track.is_liked ? 'Убрать из избранного' : 'В избранное',
      onClick: () => {
        // Handle like toggle
        onOpenChange(false);
      },
    },
  ];

  if (track.audio_url && track.status === 'completed') {
    actions.push(
      {
        icon: Download,
        label: 'Скачать',
        onClick: () => {
          onDownload?.();
          onOpenChange(false);
        },
      },
      {
        icon: Share2,
        label: 'Поделиться',
        onClick: () => {
          // Handle share
          onOpenChange(false);
        },
      },
      {
        icon: Send,
        label: 'Отправить в Telegram',
        onClick: async () => {
          await handleSendToTelegram();
          onOpenChange(false);
        },
      }
    );
  }

  // Edit actions
  if (track.audio_url && track.status === 'completed') {
    actions.push(
      { separator: true } as ActionItem,
      {
        icon: Edit3,
        label: 'Редактировать детали',
        onClick: () => {
          // Handle edit
          onOpenChange(false);
        },
      },
      {
        icon: track.is_public ? EyeOff : Eye,
        label: track.is_public ? 'Сделать приватным' : 'Сделать публичным',
        onClick: async () => {
          await handleTogglePublic(track);
          onOpenChange(false);
        },
        disabled: isProcessing,
      }
    );
  }

  // Processing actions
  if (track.audio_url && track.status === 'completed') {
    if (track.suno_task_id && track.suno_id) {
      actions.push(
        { separator: true } as ActionItem,
        {
          icon: Scissors,
          label: 'Стемы: Вокал/Инструментал',
          onClick: async () => {
            await handleSeparateVocals(track, 'simple');
            onOpenChange(false);
          },
          disabled: isProcessing,
        },
        {
          icon: Wand2,
          label: 'Стемы: Детальное разделение',
          onClick: async () => {
            await handleSeparateVocals(track, 'detailed');
            onOpenChange(false);
          },
          disabled: isProcessing,
        }
      );
    }

    actions.push(
      { separator: true } as ActionItem,
      {
        icon: ImagePlus,
        label: 'Сгенерировать обложку',
        onClick: async () => {
          await handleGenerateCover(track);
          onOpenChange(false);
        },
        disabled: isProcessing,
      }
    );

    if (track.suno_id) {
      actions.push(
        {
          icon: FileAudio,
          label: 'Конвертировать в WAV',
          onClick: async () => {
            await handleConvertToWav(track);
            onOpenChange(false);
          },
          disabled: isProcessing,
        },
        {
          icon: Video,
          label: 'Создать музыкальное видео',
          onClick: async () => {
            await handleCreateVideo(track);
            onOpenChange(false);
          },
          disabled: isProcessing,
        }
      );
    }
  }

  // Delete action
  if (onDelete) {
    actions.push(
      { separator: true } as ActionItem,
      {
        icon: Trash2,
        label: 'Удалить',
        onClick: () => {
          onDelete();
          onOpenChange(false);
        },
        variant: 'destructive' as const,
      }
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl">
        <SheetHeader>
          <SheetTitle className="text-left">
            {track.title || 'Без названия'}
          </SheetTitle>
          {track.style && (
            <p className="text-sm text-muted-foreground text-left">
              {track.style}
            </p>
          )}
        </SheetHeader>
        
        <div className="mt-6 space-y-1">
          {actions.map((action, index) => 
            'separator' in action ? (
              <Separator key={`sep-${index}`} className="my-2" />
            ) : (
              <Button
                key={index}
                variant={action.variant || 'ghost'}
                className="w-full justify-start gap-3 h-12"
                onClick={action.onClick}
                disabled={action.disabled}
              >
                <action.icon className="w-5 h-5" />
                <span>{action.label}</span>
              </Button>
            )
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
