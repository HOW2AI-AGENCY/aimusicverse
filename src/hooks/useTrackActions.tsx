import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Track } from './useTracksOptimized';

export function useTrackActions() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleShare = async (track: Track) => {
    if (navigator.share && track.audio_url) {
      try {
        await navigator.share({
          title: track.title || 'Трек',
          text: `Послушай ${track.title || 'этот трек'}`,
          url: track.audio_url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
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
      console.error('Remix error:', error);
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
      console.error('Separation error:', error);
      toast.error(error.message || 'Ошибка разделения');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePublic = async (track: Track) => {
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
      console.error('Toggle public error:', error);
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
      console.error('WAV conversion error:', error);
      toast.error(error.message || 'Ошибка конвертации');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateCover = async (track: Track) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('suno-generate-cover-image', {
        body: {
          trackId: track.id,
          prompt: track.prompt,
          style: track.style,
        },
      });

      if (error) throw error;

      toast.success('Генерация обложки началась!', {
        description: 'Новая обложка будет готова через минуту',
      });
    } catch (error: any) {
      console.error('Cover generation error:', error);
      toast.error(error.message || 'Ошибка генерации обложки');
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
      console.error('Send to Telegram error:', error);
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
    handleSendToTelegram,
  };
}
