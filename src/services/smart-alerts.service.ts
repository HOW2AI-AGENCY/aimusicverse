/**
 * Smart Alerts Service
 *
 * Owns the alert-condition counts and the realtime channel for generation
 * task errors. Used by SmartAlertProvider (C3 Batch C).
 */

import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { countUserProjects } from "@/api/projects.api";
import { countUserTracks } from "@/api/tracks.api";
import { countUserArtists } from "@/api/artists.api";

/**
 * Count the user's music projects. Returns 0 on error.
 */
export async function checkProjectsCount(userId: string): Promise<number> {
  try {
    return await countUserProjects(userId);
  } catch {
    return 0;
  }
}

/**
 * Count the user's tracks. Returns 0 on error.
 */
export async function checkTracksCount(userId: string): Promise<number> {
  try {
    return await countUserTracks(userId);
  } catch {
    return 0;
  }
}

/**
 * Count the user's AI artists. Returns 0 on error.
 */
export async function checkArtistsCount(userId: string): Promise<number> {
  try {
    return await countUserArtists(userId);
  } catch {
    return 0;
  }
}

export interface GenerationErrorPayload {
  new: { status: string; error_message?: string };
}

/**
 * Subscribe to generation_tasks UPDATE events for the given user.
 * Returns the RealtimeChannel so the caller can call removeChannel() on cleanup.
 */
export function subscribeToGenerationErrors(userId: string, onError: (errorMessage?: string) => void): RealtimeChannel {
  const channel = supabase.channel(`generation-errors-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  channel.on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "generation_tasks",
      filter: `user_id=eq.${userId}`,
    },
    (payload: GenerationErrorPayload) => {
      const newData = payload.new;
      if (newData.status === "failed") {
        onError(newData.error_message);
      }
    },
  );
  channel.subscribe();
  return channel;
}

/**
 * Remove a realtime channel. Pass-through to supabase.removeChannel.
 */
export function removeAlertChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}
