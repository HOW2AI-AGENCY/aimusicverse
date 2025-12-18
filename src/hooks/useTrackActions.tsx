import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Track } from '@/types/track';
import { useRewardShare } from './useGamification';
import { logger } from '@/lib/logger';

// Callback for subscription dialog
type SubscriptionDialogCallback = (show: boolean) => void;
let subscriptionDialogCallback: SubscriptionDialogCallback | null = null;

export function setSubscriptionDialogCallback(callback: SubscriptionDialogCallback) {
  subscriptionDialogCallback = callback;
}

export function useTrackActions() {
  const [isProcessing, setIsProcessing] = useState(false);
  const rewardShare = useRewardShare();

  const handleShare = async (track: Track, onSuccess?: () => void) => {
    if (navigator.share && track.audio_url) {
      try {
        await navigator.share({
          title: track.title || 'Трек',
          text: `Послушай ${track.title || 'этот трек'}`,
          url: track.audio_url,
        });
        
        // Reward for sharing
        try {
          await rewardShare.mutateAsync({ trackId: track.id });
          toast.success('+3 кредита за шеринг! 🎉', {
            description: '+15 опыта',
          });
        } catch (err) {
          logger.error('Error rewarding share', err);
        }
        
        onSuccess?.();
      } catch (error) {
        logger.error('Error sharing', error);
      }
    }
  };

  const handleRemix = async (track: Track) => {
    if (!track.suno_id) {
      toast.error('Невозможно создать ремикс для этого трека');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('suno-remix', {
        body: {
          audioId: track.suno_id,
          prompt: `Remix of ${track.prompt}`,
          style: track.style,
        },
      });

      if (error) throw error;

      toast.success('Ремикс начат! Трек появится в библиотеке после завершения');
    } catch (error: any) {
      logger.error('Remix error', error);
      toast.error(error.message || 'Ошибка создания ремикса');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSeparateVocals = async (track: Track, mode: 'simple' | 'detailed' = 'simple') => {
    if (!track.suno_task_id || !track.suno_id) {
      toast.error('Невозможно разделить вокал для этого трека');
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Не авторизован');

      const { data, error } = await supabase.functions.invoke('suno-separate-vocals', {
        body: {
          taskId: track.suno_task_id,
          audioId: track.suno_id,
          mode,
          userId: user.id,
        },
      });

      if (error) throw error;

      toast.success('Разделение началось! Стемы появятся после завершения');
    } catch (error: any) {
      logger.error('Separation error', error);
      toast.error(error.message || 'Ошибка разделения');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePublic = async (track: Track) => {
    // If trying to make track private, check subscription
    if (track.is_public) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Не авторизован');

        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('user_id', user.id)
          .maybeSingle();

        // Free users cannot make tracks private
        const subscriptionTier = profile?.subscription_tier || 'free';
        if (subscriptionTier === 'free') {
          // Show subscription dialog
          if (subscriptionDialogCallback) {
            subscriptionDialogCallback(true);
          }
          return;
        }
      } catch (error) {
        logger.error('Error checking subscription', error);
      }
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('tracks')
        .update({ is_public: !track.is_public })
        .eq('id', track.id);

      if (error) throw error;

      toast.success(track.is_public ? 'Трек теперь приватный' : 'Трек теперь публичный');
      window.location.reload();
    } catch (error: any) {
      logger.error('Toggle public error', error);
      toast.error('Ошибка изменения видимости');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConvertToWav = async (track: Track) => {
    if (!track.suno_id) {
      toast.error('Невозможно конвертировать этот трек');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('suno-convert-wav', {
        body: { audioId: track.suno_id },
      });

      if (error) throw error;

      toast.success('Конвертация в WAV началась!', {
        description: 'Файл будет готов через несколько минут',
      });
    } catch (error: any) {
      logger.error('WAV conversion error', error);
      toast.error(error.message || 'Ошибка конвертации');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateCover = async (track: Track) => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Не авторизован');

      const { data, error } = await supabase.functions.invoke('generate-track-cover', {
        body: {
          trackId: track.id,
          title: track.title,
          style: track.style,
          lyrics: track.lyrics,
          userId: user.id,
        },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Ошибка генерации обложки');
      }

      toast.success('Генерация обложки началась! 🎨', {
        description: 'Новая обложка будет готова через минуту',
      });
    } catch (error: any) {
      logger.error('Cover generation error', error);
      toast.error(error.message || 'Ошибка генерации обложки');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateVideo = async (track: Track) => {
    if (!track.suno_task_id || !track.suno_id) {
      toast.error('Невозможно создать видео для этого трека');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('suno-generate-video', {
        body: { trackId: track.id },
      });

      if (error) throw error;

      toast.success('Генерация видео началась! 🎬', {
        description: 'Клип будет готов через несколько минут',
      });
    } catch (error: any) {
      logger.error('Video generation error', error);
      toast.error(error.message || 'Ошибка генерации видео');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendToTelegram = async (track: Track) => {
    if (!track.audio_url) {
      toast.error('Трек ещё не готов');
      return;
    }

    setIsProcessing(true);
    try {
      // Get telegram_id from profiles table
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Не авторизован');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('telegram_id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile?.telegram_id) {
        toast.error('Telegram не подключен');
        return;
      }

      const { error } = await supabase.functions.invoke('send-telegram-notification', {
        body: {
          type: 'track_share',
          track_id: track.id,
          chat_id: profile.telegram_id,
        },
      });

      if (error) throw error;

      toast.success('Трек отправлен в Telegram!');
    } catch (error: any) {
      logger.error('Send to Telegram error', error);
      toast.error(error.message || 'Ошибка отправки в Telegram');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    handleShare,
    handleRemix,
    handleSeparateVocals,
    handleTogglePublic,
    handleConvertToWav,
    handleGenerateCover,
    handleGenerateVideo,
    handleSendToTelegram,
  };
}
