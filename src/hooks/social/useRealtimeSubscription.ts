// Real-time Subscription Manager (T105)
// Consolidates multiple real-time subscriptions to reduce connections
// Provides connection retry logic and latency monitoring

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SubscriptionConfig {
  channel: string;
  tables: {
    name: string;
    filter?: string;
    events?: ('INSERT' | 'UPDATE' | 'DELETE')[];
    invalidateQueries?: string[][];
  }[];
  onError?: (error: Error) => void;
  onConnectionChange?: (status: 'connected' | 'disconnected' | 'reconnecting') => void;
}

interface RealtimeMetrics {
  latency: number; // milliseconds
  reconnectCount: number;
  lastReconnectAt?: Date;
  messagesReceived: number;
}

/**
 * Consolidated real-time subscription hook
 * Manages connection lifecycle, retry logic, and latency monitoring
 */
export function useRealtimeSubscription(config: SubscriptionConfig) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const metricsRef = useRef<RealtimeMetrics>({
    latency: 0,
    reconnectCount: 0,
    messagesReceived: 0,
  });
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountingRef = useRef(false);

  const connect = useCallback(() => {
    if (!user?.id || isUnmountingRef.current) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create new channel
    const channel = supabase.channel(config.channel);

    // Add listeners for all tables
    config.tables.forEach((table) => {
      const events = table.events || ['INSERT', 'UPDATE', 'DELETE'];
      
      events.forEach((event) => {
        channel.on(
          'postgres_changes',
          {
            event,
            schema: 'public',
            table: table.name,
            filter: table.filter,
          },
          (payload) => {
            // Update metrics
            metricsRef.current.messagesReceived++;
            
            // Measure latency (approximate)
            const now = Date.now();
            const payloadTime = new Date(payload.commit_timestamp || Date.now()).getTime();
            metricsRef.current.latency = now - payloadTime;

            // Invalidate queries
            if (table.invalidateQueries) {
              table.invalidateQueries.forEach((queryKey) => {
                queryClient.invalidateQueries({ queryKey });
              });
            }
          }
        );
      });
    });

    // Subscribe with connection state tracking
    channel
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          config.onConnectionChange?.('connected');
          console.log(`✅ Realtime connected: ${config.channel}`);
        } else if (status === 'CHANNEL_ERROR') {
          config.onConnectionChange?.('disconnected');
          config.onError?.(err || new Error('Channel error'));
          console.error(`❌ Realtime error: ${config.channel}`, err);
          
          // Retry connection after 5 seconds
          if (!isUnmountingRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              metricsRef.current.reconnectCount++;
              metricsRef.current.lastReconnectAt = new Date();
              config.onConnectionChange?.('reconnecting');
              console.log(`🔄 Reconnecting: ${config.channel} (attempt ${metricsRef.current.reconnectCount})`);
              connect();
            }, 5000);
          }
        } else if (status === 'TIMED_OUT') {
          config.onConnectionChange?.('disconnected');
          console.warn(`⏱️ Realtime timeout: ${config.channel}`);
          
          // Retry immediately on timeout
          if (!isUnmountingRef.current) {
            metricsRef.current.reconnectCount++;
            metricsRef.current.lastReconnectAt = new Date();
            config.onConnectionChange?.('reconnecting');
            connect();
          }
        } else if (status === 'CLOSED') {
          config.onConnectionChange?.('disconnected');
          console.log(`🔌 Realtime closed: ${config.channel}`);
        }
      });

    channelRef.current = channel;
  }, [user?.id, config, queryClient]);

  // Initial connection
  useEffect(() => {
    isUnmountingRef.current = false;
    connect();

    return () => {
      isUnmountingRef.current = true;
      
      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Remove channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [connect]);

  // Return metrics for monitoring
  return {
    metrics: metricsRef.current,
    reconnect: connect,
  };
}

/**
 * Pre-configured subscription for social features
 * Consolidates comments, notifications, and activity feed
 */
export function useSocialRealtime(trackId?: string) {
  const { user } = useAuth();
  
  if (!user?.id) {
    return { metrics: { latency: 0, reconnectCount: 0, messagesReceived: 0 }, reconnect: () => {} };
  }

  return useRealtimeSubscription({
    channel: `social:${user.id}`,
    tables: [
      // Comments on specific track
      ...(trackId ? [{
        name: 'comments',
        filter: `track_id=eq.${trackId}`,
        events: ['INSERT', 'UPDATE', 'DELETE'] as const,
        invalidateQueries: [['comments', trackId]],
      }] : []),
      // User notifications
      {
        name: 'notifications',
        filter: `user_id=eq.${user.id}`,
        events: ['INSERT', 'UPDATE'] as const,
        invalidateQueries: [['notifications', user.id], ['notification-count', user.id]],
      },
      // Activity feed
      {
        name: 'activities',
        filter: `user_id=eq.${user.id}`,
        events: ['INSERT'] as const,
        invalidateQueries: [['activity-feed', user.id]],
      },
      // Follows
      {
        name: 'user_follows',
        filter: `follower_id=eq.${user.id},following_id=eq.${user.id}`,
        events: ['INSERT', 'DELETE'] as const,
        invalidateQueries: [['followers'], ['following'], ['profile-stats']],
      },
    ],
    onError: (error) => {
      console.error('Social realtime error:', error);
    },
    onConnectionChange: (status) => {
      console.log('Social realtime status:', status);
    },
  });
}

/**
 * Get current real-time metrics
 */
export function useRealtimeMetrics() {
  // This would be stored in a global state/context in production
  // For now, returning a placeholder
  return {
    avgLatency: 0,
    totalReconnects: 0,
    activeChannels: 0,
  };
}
