import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SmartAlert, MAX_ALERTS_ON_PAGE_LOAD, ALERT_PRIORITIES } from './types';
import { SmartAlertOverlay } from './SmartAlertOverlay';
import { useAntiSpam } from './useAntiSpam';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface SmartAlertContextValue {
  showAlert: (alert: SmartAlert) => void;
  dismissAlert: () => void;
  showGenerationError: (errorMessage?: string) => void;
  currentAlert: SmartAlert | null;
}

const SmartAlertContext = createContext<SmartAlertContextValue | null>(null);

export function useSmartAlerts() {
  const context = useContext(SmartAlertContext);
  if (!context) {
    throw new Error('useSmartAlerts must be used within SmartAlertProvider');
  }
  return context;
}

interface SmartAlertProviderProps {
  children: React.ReactNode;
}

export function SmartAlertProvider({ children }: SmartAlertProviderProps) {
  const [currentAlert, setCurrentAlert] = useState<SmartAlert | null>(null);
  const [alertQueue, setAlertQueue] = useState<SmartAlert[]>([]);
  const { canShowAlert, markAlertShown } = useAntiSpam();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const hasCheckedOnLoad = useRef(false);
  const alertsShownOnLoad = useRef(0);
  const navigate = useNavigate();

  const showAlert = useCallback((alert: SmartAlert) => {
    // Check anti-spam
    if (!canShowAlert(alert.id)) {
      logger.debug('Alert blocked by anti-spam', { alertId: alert.id });
      return;
    }

    // Check page load limit
    if (alertsShownOnLoad.current >= MAX_ALERTS_ON_PAGE_LOAD && !alert.id.startsWith('immediate-')) {
      logger.debug('Alert blocked by page load limit', { alertId: alert.id });
      return;
    }

    markAlertShown(alert.id);

    // If no current alert, show immediately
    if (!currentAlert) {
      setCurrentAlert(alert);
      alertsShownOnLoad.current++;
    } else {
      // Add to queue sorted by priority
      setAlertQueue(prev => {
        const newQueue = [...prev, alert].sort((a, b) => 
          (b.priority || 0) - (a.priority || 0)
        );
        return newQueue;
      });
    }

    // Auto-hide if configured
    if (alert.autoHide) {
      setTimeout(() => {
        setCurrentAlert(prev => prev?.id === alert.id ? null : prev);
      }, alert.autoHide);
    }
  }, [canShowAlert, markAlertShown, currentAlert]);

  const dismissAlert = useCallback(() => {
    setCurrentAlert(null);
  }, []);

  // Process queue when current alert is dismissed
  useEffect(() => {
    if (!currentAlert && alertQueue.length > 0) {
      const [nextAlert, ...rest] = alertQueue;
      setCurrentAlert(nextAlert);
      setAlertQueue(rest);
    }
  }, [currentAlert, alertQueue]);

  // Show generation error
  const showGenerationError = useCallback((errorMessage?: string) => {
    const is500Error = errorMessage?.includes('500') || errorMessage?.toLowerCase().includes('server');
    
    showAlert({
      id: 'immediate-generation-error',
      type: 'error',
      title: is500Error ? 'Сервер перегружен' : 'Ошибка генерации',
      message: is500Error 
        ? 'Сервер временно перегружен. Попробуйте снова через несколько минут.'
        : 'Не удалось сгенерировать трек. Попробуйте изменить промпт или повторить позже.',
      illustration: 'server-busy',
      autoHide: 10000,
      priority: ALERT_PRIORITIES['generation-error'],
      actions: is500Error ? undefined : [
        {
          label: 'Повторить',
          onClick: () => navigate('/generate'),
        }
      ],
    });
  }, [showAlert, navigate]);

  // Check conditions on mount
  useEffect(() => {
    if (!user || !profile || hasCheckedOnLoad.current) return;
    hasCheckedOnLoad.current = true;

    const checkConditions = async () => {
      try {
        // Check for no projects (only if user has been around for a while)
        const { count: projectsCount } = await supabase
          .from('music_projects')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (projectsCount === 0 && canShowAlert('no-projects')) {
          showAlert({
            id: 'no-projects',
            type: 'onboarding',
            title: 'Создайте первый проект',
            message: 'Начните с создания музыкального проекта — альбома, EP или сингла.',
            illustration: 'empty-projects',
            priority: ALERT_PRIORITIES['no-projects'],
            actions: [
              {
                label: 'Создать проект',
                onClick: () => navigate('/projects'),
              },
            ],
          });
          return; // Only show one alert
        }

        // Check profile completeness
        if (profile.profile_completeness && profile.profile_completeness < 50 && canShowAlert('profile-incomplete')) {
          // Only show if user has some tracks
          const { count: tracksCount } = await supabase
            .from('tracks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (tracksCount && tracksCount >= 3) {
            showAlert({
              id: 'profile-incomplete',
              type: 'info',
              title: 'Заполните профиль',
              message: 'Заполните профиль, чтобы другие пользователи могли найти вашу музыку.',
              illustration: 'profile-setup',
              priority: ALERT_PRIORITIES['profile-incomplete'],
              actions: [
                {
                  label: 'Настроить',
                  onClick: () => navigate('/profile'),
                },
                {
                  label: 'Позже',
                  variant: 'ghost',
                  onClick: () => {},
                },
              ],
            });
            return;
          }
        }

        // Check for no artists (if user has tracks)
        const { count: artistsCount } = await supabase
          .from('artists')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (artistsCount === 0 && canShowAlert('no-artists')) {
          const { count: tracksCount } = await supabase
            .from('tracks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (tracksCount && tracksCount >= 5) {
            showAlert({
              id: 'no-artists',
              type: 'info',
              title: 'Создайте AI-артиста',
              message: 'Создайте уникального AI-артиста для персонализации стиля ваших треков.',
              illustration: 'artist-create',
              priority: ALERT_PRIORITIES['no-artists'],
              actions: [
                {
                  label: 'Создать артиста',
                  onClick: () => navigate('/artists'),
                },
              ],
            });
            return;
          }
        }

        // Check for ready stems not visited
        const { data: readyStems } = await supabase
          .from('track_stems')
          .select('track_id')
          .eq('user_id', user.id)
          .eq('status', 'ready')
          .limit(1);

        if (readyStems && readyStems.length > 0 && canShowAlert('stems-ready')) {
          showAlert({
            id: 'stems-ready',
            type: 'success',
            title: 'Стемы готовы!',
            message: 'Ваши стемы готовы для редактирования. Откройте студию, чтобы начать работу.',
            illustration: 'stems-ready',
            priority: ALERT_PRIORITIES['stems-ready'],
            actions: [
              {
                label: 'Открыть студию',
                onClick: () => navigate(`/studio/${readyStems[0].track_id}`),
              },
            ],
          });
        }
      } catch (error) {
        logger.error('Error checking alert conditions', error);
      }
    };

    // Delay check to not interrupt initial page load
    const timer = setTimeout(checkConditions, 3000);
    return () => clearTimeout(timer);
  }, [user, profile, canShowAlert, showAlert, navigate]);

  // Listen for generation errors
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('generation-errors')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'generation_tasks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as { status: string; error_message?: string };
          if (newData.status === 'failed') {
            showGenerationError(newData.error_message);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, showGenerationError]);

  return (
    <SmartAlertContext.Provider value={{ showAlert, dismissAlert, showGenerationError, currentAlert }}>
      {children}
      <SmartAlertOverlay alert={currentAlert} onDismiss={dismissAlert} />
    </SmartAlertContext.Provider>
  );
}
