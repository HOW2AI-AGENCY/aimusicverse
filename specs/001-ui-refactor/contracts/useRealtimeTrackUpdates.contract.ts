/**
 * Contract: useRealtimeTrackUpdates Hook
 *
 * Real-time subscription hook for track updates via Supabase.
 * Handles subscription lifecycle and cleanup.
 */

import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Real-time track update payload from Supabase.
 */
export interface TrackUpdate {
  /**
   * The type of change that occurred.
   */
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';

  /**
   * The old value (for UPDATE and DELETE events).
   */
  old: Record<string, unknown> | null;

  /**
   * The new value (for INSERT and UPDATE events).
   */
  new: Record<string, unknown> | null;
}

/**
 * Input parameters for useRealtimeTrackUpdates hook.
 */
export interface UseRealtimeTrackUpdatesParams {
  /**
   * The ID of the track to subscribe to updates for.
   */
  trackId: string;

  /**
   * Whether the subscription should be enabled.
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback function when an update is received.
   * If not provided, updates are managed via TanStack Query cache.
   */
  onUpdate?: (update: TrackUpdate) => void;

  /**
   * Callback function when subscription errors occur.
   */
  onError?: (error: Error) => void;
}

/**
 * Return value from useRealtimeTrackUpdates hook.
 */
export interface UseRealtimeTrackUpdatesReturn {
  /**
   * The latest update received from the subscription.
   * Null if no updates received yet.
   */
  data: TrackUpdate | null;

  /**
   * Whether the subscription is currently connected.
   */
  isConnected: boolean;

  /**
   * Whether the subscription is currently connecting.
   */
  isConnecting: boolean;

  /**
   * Error from the subscription, if any.
   */
  error: Error | null;

  /**
   * The Supabase channel instance (for advanced usage).
   */
  channel: RealtimeChannel | null;

  /**
   * Manually reconnect the subscription.
   */
  reconnect: () => void;

  /**
   * Manually disconnect the subscription.
   */
  disconnect: () => void;
}

/**
 * Hook contract for useRealtimeTrackUpdates.
 *
 * @example
 * ```typescript
 * const { data, isConnected, error } = useRealtimeTrackUpdates({
 *   trackId: 'track123',
 *   enabled: true,
 *   onUpdate: (update) => {
 *     console.log('Track updated:', update);
 *   },
 * });
 *
 * // Cleanup happens automatically on unmount
 * ```
 */
export interface UseRealtimeTrackUpdatesContract {
  /**
   * Hook function signature.
   */
  (params: UseRealtimeTrackUpdatesParams): UseRealtimeTrackUpdatesReturn;

  /**
   * Subscription lifecycle requirements.
   */
  lifecycle: {
    /**
     * Channel must be created on mount.
     */
    onMount: 'create-channel';

    /**
     * Channel must be removed on unmount.
     */
    onUnmount: 'remove-channel';

    /**
     * Channel must reconnect on error.
     */
    onError: 'auto-reconnect';
  };

  /**
   * PostgreSQL event types to subscribe to.
   */
  subscribedEvents: ('INSERT' | 'UPDATE' | 'DELETE')[];
}
