import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { cleanupExpiredNotifications } from '@/services/notificationManager';

const log = logger.child({ module: 'NotificationContext' });

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'generation' | 'project' | 'social' | 'achievement' | 'system';
  read: boolean;
  action_url?: string | null;
  created_at: string;
  metadata?: Record<string, unknown>;
  group_key?: string | null;
  expires_at?: string | null;
  priority?: number;
}

export interface GenerationProgress {
  id: string;
  prompt: string;
  status: 'pending' | 'processing' | 'streaming_ready' | 'completed' | 'failed';
  progress: number; // 0-100
  stage: string;
  created_at: string;
  estimated_time?: number; // seconds remaining
  streaming_url?: string;
  track_id?: string | null;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  activeGenerations: GenerationProgress[];
  generationCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  clearAllRead: () => Promise<void>;
  showToast: (notification: Omit<NotificationItem, 'id' | 'read' | 'created_at'>) => void;
  playNotificationSound: () => void;
  refetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Stages for generation progress
const GENERATION_STAGES = [
  { status: 'pending', stage: 'В очереди', progress: 10 },
  { status: 'processing', stage: 'Генерация музыки', progress: 50 },
  { status: 'streaming_ready', stage: '▶️ Можно слушать!', progress: 80 },
  { status: 'completed', stage: 'Готово!', progress: 100 },
  { status: 'failed', stage: 'Ошибка', progress: 0 },
];

function getGenerationStage(status: string): { stage: string; progress: number } {
  const found = GENERATION_STAGES.find(s => s.status === status);
  return found || { stage: 'Обработка', progress: 30 };
}

// Notification sound using Web Audio API
function createNotificationSound(): () => void {
  return () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      log.debug('Sound playback failed', { error: String(e) });
    }
  };
}

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeGenerations, setActiveGenerations] = useState<GenerationProgress[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('notification_sound');
    return saved !== 'false';
  });
  
  const playSound = useRef(createNotificationSound());
  const lastGenerationStatus = useRef<Map<string, string>>(new Map());
  const cleanupRan = useRef(false);

  // Fetch notifications with proper sorting by priority and date
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      // Filter out expired notifications client-side and cast to extended type
      const now = new Date();
      const validNotifications = (data as any[]).filter(n => {
        if (!n.expires_at) return true;
        return new Date(n.expires_at) > now;
      });
      setNotifications(validNotifications as NotificationItem[]);
    }
  }, [user?.id]);

  // Initial fetch and cleanup
  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();

    // Run cleanup once per session
    if (!cleanupRan.current) {
      cleanupRan.current = true;
      cleanupExpiredNotifications().then(count => {
        if (count > 0) {
          log.info('Auto-cleaned expired notifications', { count });
          fetchNotifications(); // Refresh after cleanup
        }
      });
    }
  }, [user?.id, fetchNotifications]);

  // Fetch active generations
  useEffect(() => {
    if (!user?.id) return;

    const fetchGenerations = async () => {
      const { data, error } = await supabase
        .from('generation_tasks')
        .select('id, prompt, status, created_at, track_id')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing', 'streaming_ready'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        const generations = data.map(task => {
          const stageInfo = getGenerationStage(task.status);
          // Calculate estimated time based on creation time
          const createdAt = new Date(task.created_at).getTime();
          const elapsed = (Date.now() - createdAt) / 1000;
          const estimatedTotal = 120; // ~2 min average
          const remaining = Math.max(0, estimatedTotal - elapsed);
          
          return {
            id: task.id,
            prompt: task.prompt,
            status: task.status as GenerationProgress['status'],
            progress: stageInfo.progress,
            stage: stageInfo.stage,
            created_at: task.created_at,
            estimated_time: Math.round(remaining),
            track_id: task.track_id,
          };
        });
        setActiveGenerations(generations);
        
        // Update last status map
        generations.forEach(g => {
          lastGenerationStatus.current.set(g.id, g.status);
        });
      }
    };

    fetchGenerations();
    // Faster polling (2s) for quicker streaming detection
    const interval = setInterval(fetchGenerations, 2000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Realtime subscription for notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications_${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const newNotification = payload.new as NotificationItem;
        log.info('New notification received', { id: newNotification.id });
        
        setNotifications(prev => [newNotification, ...prev.slice(0, 49)]);
        
        // Play sound and show toast
        if (soundEnabled) {
          playSound.current();
        }
        
        toast(newNotification.title, {
          description: newNotification.message,
          action: newNotification.action_url ? {
            label: 'Открыть',
            onClick: () => window.location.href = newNotification.action_url!,
          } : undefined,
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const updated = payload.new as NotificationItem;
        setNotifications(prev => 
          prev.map(n => n.id === updated.id ? updated : n)
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, soundEnabled]);

  // Realtime subscription for generation tasks
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`generations_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'generation_tasks',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const task = payload.new as any;
        const oldStatus = lastGenerationStatus.current.get(task.id);
        
        log.debug('Generation task update', { 
          id: task.id, 
          status: task.status,
          oldStatus 
        });

        if (task.status === 'completed' && oldStatus !== 'completed') {
          // Generation completed!
          log.info('Generation completed', { id: task.id });
          
          if (soundEnabled) {
            playSound.current();
          }
          
          toast.success('Трек готов! 🎵', {
            description: task.prompt?.slice(0, 50) + (task.prompt?.length > 50 ? '...' : ''),
            action: {
              label: 'Открыть',
              onClick: () => {
                queryClient.invalidateQueries({ queryKey: ['tracks'] });
                window.location.href = '/library';
              },
            },
          });

          // Remove from active generations
          setActiveGenerations(prev => prev.filter(g => g.id !== task.id));
          
          // Refetch tracks
          queryClient.invalidateQueries({ queryKey: ['tracks'] });
          queryClient.invalidateQueries({ queryKey: ['tracks-infinite'] });
        } else if (task.status === 'failed') {
          toast.error('Ошибка генерации', {
            description: task.error_message || 'Попробуйте ещё раз',
          });
          setActiveGenerations(prev => prev.filter(g => g.id !== task.id));
        } else if (['pending', 'processing', 'streaming_ready'].includes(task.status)) {
          // Update generation progress
          const stageInfo = getGenerationStage(task.status);
          
          // When streaming_ready, preload audio and notify user can start listening
          if (task.status === 'streaming_ready' && oldStatus !== 'streaming_ready' && task.track_id) {
            log.info('Streaming ready - fetching audio URL for preload', { trackId: task.track_id });
            
            // Fetch streaming URL and preload audio
            supabase
              .from('tracks')
              .select('streaming_url, title')
              .eq('id', task.track_id)
              .single()
              .then(({ data: trackData }) => {
                if (trackData?.streaming_url) {
                  // Preload audio in background
                  const audio = new Audio();
                  audio.preload = 'auto';
                  audio.src = trackData.streaming_url;
                  
                  log.info('Audio preloading started', { url: trackData.streaming_url.substring(0, 50) });
                  
                  // Notify user they can start listening
                  toast.success('Можно слушать! 🎧', {
                    description: trackData.title || task.prompt?.slice(0, 40),
                    action: {
                      label: 'Слушать',
                      onClick: () => {
                        queryClient.invalidateQueries({ queryKey: ['tracks'] });
                        window.location.href = '/library';
                      },
                    },
                  });
                }
              });
            
            // Refresh tracks list to show streaming track
            queryClient.invalidateQueries({ queryKey: ['tracks'] });
            queryClient.invalidateQueries({ queryKey: ['tracks-infinite'] });
          }
          
          setActiveGenerations(prev => {
            const existing = prev.find(g => g.id === task.id);
            if (existing) {
              return prev.map(g => g.id === task.id ? {
                ...g,
                status: task.status,
                progress: stageInfo.progress,
                stage: stageInfo.stage,
                streaming_url: task.streaming_url,
              } : g);
            } else {
              return [{
                id: task.id,
                prompt: task.prompt,
                status: task.status,
                progress: stageInfo.progress,
                stage: stageInfo.stage,
                created_at: task.created_at,
                track_id: task.track_id,
              }, ...prev];
            }
          });
        }
        
        lastGenerationStatus.current.set(task.id, task.status);
        queryClient.invalidateQueries({ queryKey: ['active_generations'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, soundEnabled, queryClient]);

  // Realtime subscription for tracks - get streaming_url instantly when available
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`tracks_streaming_${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tracks',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const track = payload.new as any;
        const oldTrack = payload.old as any;
        
        // Check if streaming_url was just set (wasn't there before, is there now)
        if (track.streaming_url && !oldTrack?.streaming_url && track.status === 'streaming_ready') {
          log.info('Track streaming URL available', { trackId: track.id, title: track.title });
          
          // Preload audio immediately
          const audio = new Audio();
          audio.preload = 'auto';
          audio.src = track.streaming_url;
          
          // Refresh tracks list
          queryClient.invalidateQueries({ queryKey: ['tracks'] });
          queryClient.invalidateQueries({ queryKey: ['tracks-infinite'] });
        }
        
        // When track completes, refresh
        if (track.status === 'completed' && oldTrack?.status !== 'completed') {
          queryClient.invalidateQueries({ queryKey: ['tracks'] });
          queryClient.invalidateQueries({ queryKey: ['tracks-infinite'] });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Save sound preference
  useEffect(() => {
    localStorage.setItem('notification_sound', soundEnabled ? 'true' : 'false');
  }, [soundEnabled]);

  // Periodic cleanup (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      // Filter out client-side expired notifications
      setNotifications(prev => {
        const now = new Date();
        return prev.filter(n => {
          if (!n.expires_at) return true;
          return new Date(n.expires_at) > now;
        });
      });
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  }, [user?.id]);

  const clearNotification = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  }, []);

  const clearAllRead = useCallback(async () => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .eq('read', true);

    if (!error) {
      setNotifications(prev => prev.filter(n => !n.read));
      toast.success('Прочитанные уведомления удалены');
    }
  }, [user?.id]);

  const showToast = useCallback((notification: Omit<NotificationItem, 'id' | 'read' | 'created_at'>) => {
    const toastFn = notification.type === 'error' ? toast.error : 
                    notification.type === 'success' ? toast.success :
                    notification.type === 'warning' ? toast.warning : toast;
    
    toastFn(notification.title, {
      description: notification.message,
    });
  }, []);

  const playNotificationSound = useCallback(() => {
    if (soundEnabled) {
      playSound.current();
    }
  }, [soundEnabled]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const generationCount = activeGenerations.length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeGenerations,
        generationCount,
        soundEnabled,
        setSoundEnabled,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllRead,
        showToast,
        playNotificationSound,
        refetchNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationHub = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationHub must be used within NotificationProvider');
  }
  return context;
};
