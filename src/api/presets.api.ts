/**
 * Presets API Layer
 * Raw Supabase database operations for mixer and effects presets
 *
 * API Contract Reference: specs/031-mobile-studio-v2/contracts/api-contracts.md
 */

import { supabase } from '@/integrations/supabase/client';

// ============= Type Definitions =============

/**
 * Preset categories
 */
export type PresetCategory =
  | 'vocal'
  | 'guitar'
  | 'drums'
  | 'bass'
  | 'mastering'
  | 'fx'
  | 'custom';

/**
 * Preset scope for filtering
 */
export type PresetScope = 'user' | 'system' | 'public';

/**
 * Mixer settings structure
 */
export interface MixerSettings {
  volume: number;
  pan: number;
  solo?: boolean;
  mute?: boolean;
}

/**
 * Individual effect settings
 */
export interface EffectSettings {
  enabled: boolean;
  [key: string]: number | boolean | string | undefined;
}

/**
 * Effects settings structure
 */
export interface EffectsSettings {
  reverb?: EffectSettings;
  compression?: EffectSettings;
  eq?: EffectSettings;
  delay?: EffectSettings;
  chorus?: EffectSettings;
  distortion?: EffectSettings;
  [key: string]: EffectSettings | undefined;
}

/**
 * Complete preset settings
 */
export interface PresetSettings {
  mixer?: Partial<MixerSettings>;
  effects?: Partial<EffectsSettings>;
  [key: string]: unknown;
}

/**
 * Preset database record structure
 */
export interface Preset {
  id: string;
  name: string;
  description: string | null;
  category: PresetCategory;
  is_public: boolean;
  is_system: boolean;
  user_id: string | null;
  usage_count: number;
  settings: PresetSettings;
  created_at: string;
  updated_at: string;
}

/**
 * Preset creation input
 */
export interface CreatePresetInput {
  name: string;
  description?: string;
  category: PresetCategory;
  isPublic?: boolean;
  settings: PresetSettings;
}

/**
 * Preset update input
 */
export interface UpdatePresetInput {
  name?: string;
  description?: string;
  category?: PresetCategory;
  isPublic?: boolean;
  settings?: PresetSettings;
}

/**
 * Preset query filters
 */
export interface PresetFilters {
  category?: PresetCategory;
  scope?: PresetScope;
  userId?: string;
  searchQuery?: string;
}

/**
 * Get presets response shape
 */
export interface GetPresetsResponse {
  presets: Preset[];
  error: Error | null;
}

/**
 * Create preset response shape
 */
export interface CreatePresetResponse {
  preset: Preset | null;
  error: Error | null;
}

/**
 * Update preset response shape
 */
export interface UpdatePresetResponse {
  preset: Preset | null;
  error: Error | null;
}

/**
 * Delete preset response shape
 */
export interface DeletePresetResponse {
  success: boolean;
  error: Error | null;
}

/**
 * Apply preset response shape
 */
export interface ApplyPresetResponse {
  success: boolean;
  appliedSettings: PresetSettings | null;
  error: Error | null;
}

/**
 * Preset author info
 */
export interface PresetAuthor {
  id: string;
  username: string;
}

/**
 * Enriched preset with author info
 */
export interface PresetWithAuthor extends Preset {
  author: PresetAuthor | null;
}

// ============= API Functions =============

/**
 * Get available presets (user + system + public)
 *
 * @param filters - Optional filters for category, scope, userId, and search
 * @returns Promise with array of presets
 *
 * @example
 * ```typescript
 * // Get all presets
 * const { presets, error } = await getPresets();
 *
 * // Get vocal presets only
 * const { presets, error } = await getPresets({ category: 'vocal' });
 *
 * // Get user's custom presets
 * const { presets, error } = await getPresets({ scope: 'user', userId: 'xxx' });
 *
 * // Search presets by name
 * const { presets, error } = await getPresets({ searchQuery: 'warm' });
 * ```
 */
export async function getPresets(
  filters?: PresetFilters
): Promise<GetPresetsResponse> {
  try {
    const { category, scope, userId, searchQuery } = filters || {};

    let query = supabase
      .from('presets')
      .select('*', { count: 'exact' })
      .order('usage_count', { ascending: false });

    // Category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Scope filter
    if (scope === 'user' && userId) {
      query = query.eq('user_id', userId).eq('is_system', false);
    } else if (scope === 'system') {
      query = query.eq('is_system', true);
    } else if (scope === 'public') {
      query = query.eq('is_public', true);
    }

    // User filter (for getting user's own presets including non-public)
    if (userId && scope !== 'user') {
      query = query.or(`user_id.eq.${userId},and(is_public.eq.true,is_system.eq.true)`);
    }

    // Search filter
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      presets: (data || []) as Preset[],
      error: null,
    };
  } catch (error) {
    return {
      presets: [],
      error: error instanceof Error ? error : new Error('Failed to fetch presets'),
    };
  }
}

/**
 * Get presets enriched with author information
 *
 * @param filters - Optional filters for category, scope, userId, and search
 * @returns Promise with array of presets with author info
 *
 * @example
 * ```typescript
 * const { presets, error } = await getPresetsWithAuthors({ category: 'vocal' });
 * ```
 */
export async function getPresetsWithAuthors(
  filters?: PresetFilters
): Promise<{ presets: PresetWithAuthor[]; error: Error | null }> {
  try {
    const { category, scope, userId, searchQuery } = filters || {};

    let query = supabase
      .from('presets')
      .select(`
        *,
        author:profiles!user_id(id, username)
      `)
      .order('usage_count', { ascending: false });

    // Category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Scope filter
    if (scope === 'user' && userId) {
      query = query.eq('user_id', userId).eq('is_system', false);
    } else if (scope === 'system') {
      query = query.eq('is_system', true);
    } else if (scope === 'public') {
      query = query.eq('is_public', true);
    }

    // User filter
    if (userId && scope !== 'user') {
      query = query.or(`user_id.eq.${userId},and(is_public.eq.true,is_system.eq.true)`);
    }

    // Search filter
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Transform the data to extract author from nested object
    const presets = (data || []).map((preset: unknown) => {
      const p = preset as Preset & { author?: { id: string; username: string } | null };
      return {
        ...p,
        author: p.author || null,
      } as PresetWithAuthor;
    });

    return {
      presets,
      error: null,
    };
  } catch (error) {
    return {
      presets: [],
      error: error instanceof Error ? error : new Error('Failed to fetch presets'),
    };
  }
}

/**
 * Get a single preset by ID
 *
 * @param presetId - The preset ID
 * @returns Promise with preset data or null
 *
 * @example
 * ```typescript
 * const { data, error } = await getPresetById('uuid');
 * ```
 */
export async function getPresetById(
  presetId: string
): Promise<{ data: Preset | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('presets')
      .select('*')
      .eq('id', presetId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: data as Preset | null,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to fetch preset'),
    };
  }
}

/**
 * Create a new preset
 *
 * @param input - Preset creation data
 * @param userId - User ID creating the preset
 * @returns Promise with created preset
 *
 * @example
 * ```typescript
 * const { preset, error } = await createPreset({
 *   name: 'My Custom Vocal',
 *   description: 'My go-to vocal settings',
 *   category: 'vocal',
 *   isPublic: false,
 *   settings: {
 *     mixer: { volume: 0.9, pan: -0.2 },
 *     effects: { compression: { enabled: true, threshold: -18 } }
 *   }
 * }, userId);
 * ```
 */
export async function createPreset(
  input: CreatePresetInput,
  userId: string
): Promise<CreatePresetResponse> {
  try {
    const presetData = {
      name: input.name,
      description: input.description || null,
      category: input.category,
      is_public: input.isPublic || false,
      is_system: false,
      user_id: userId,
      usage_count: 0,
      settings: input.settings as Record<string, unknown>,
    };

    const { data, error } = await supabase
      .from('presets')
      .insert(presetData)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      preset: data as Preset,
      error: null,
    };
  } catch (error) {
    return {
      preset: null,
      error: error instanceof Error ? error : new Error('Failed to create preset'),
    };
  }
}

/**
 * Update a preset
 *
 * @param presetId - The preset ID to update
 * @param input - Preset update data
 * @param userId - User ID making the update (for ownership check)
 * @returns Promise with updated preset
 *
 * @example
 * ```typescript
 * const { preset, error } = await updatePreset('uuid', {
 *   name: 'Updated Name',
 *   description: 'Updated description'
 * }, userId);
 * ```
 */
export async function updatePreset(
  presetId: string,
  input: UpdatePresetInput,
  userId: string
): Promise<UpdatePresetResponse> {
  try {
    // First check if user owns this preset or if it's a system preset
    const { data: existingPreset } = await getPresetById(presetId);

    if (!existingPreset) {
      throw new Error('Preset not found');
    }

    if (existingPreset.is_system) {
      throw new Error('Cannot update system presets');
    }

    if (existingPreset.user_id !== userId) {
      throw new Error('You do not have permission to update this preset');
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.isPublic !== undefined) updateData.is_public = input.isPublic;
    if (input.settings !== undefined) updateData.settings = input.settings as Record<string, unknown>;

    const { data, error } = await supabase
      .from('presets')
      .update(updateData)
      .eq('id', presetId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      preset: data as Preset,
      error: null,
    };
  } catch (error) {
    return {
      preset: null,
      error: error instanceof Error ? error : new Error('Failed to update preset'),
    };
  }
}

/**
 * Delete a preset
 *
 * @param presetId - The preset ID to delete
 * @param userId - User ID making the delete (for ownership check)
 * @returns Promise with success status
 *
 * @example
 * ```typescript
 * const { success, error } = await deletePreset('uuid', userId);
 * ```
 */
export async function deletePreset(
  presetId: string,
  userId: string
): Promise<DeletePresetResponse> {
  try {
    // First check if user owns this preset or if it's a system preset
    const { data: existingPreset } = await getPresetById(presetId);

    if (!existingPreset) {
      throw new Error('Preset not found');
    }

    if (existingPreset.is_system) {
      throw new Error('Cannot delete system presets');
    }

    if (existingPreset.user_id !== userId) {
      throw new Error('You do not have permission to delete this preset');
    }

    const { error } = await supabase
      .from('presets')
      .delete()
      .eq('id', presetId);

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to delete preset'),
    };
  }
}

/**
 * Increment preset usage count
 * Called when a preset is applied to a track
 *
 * @param presetId - The preset ID to increment usage for
 * @returns Promise that resolves when usage is incremented
 *
 * @example
 * ```typescript
 * await incrementPresetUsage('uuid');
 * ```
 */
export async function incrementPresetUsage(presetId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_preset_usage', {
      preset_id: presetId,
    });

    if (error) {
      // If the RPC function doesn't exist yet, fall back to direct update
      const { data: preset } = await getPresetById(presetId);
      if (preset) {
        await supabase
          .from('presets')
          .update({ usage_count: (preset.usage_count || 0) + 1 })
          .eq('id', presetId);
      }
    }
  } catch (error) {
    // Log error but don't throw - usage count is not critical
    console.warn('Failed to increment preset usage:', error);
  }
}

/**
 * Apply a preset to a track
 * This calls the Supabase RPC function `apply_preset_to_track`
 *
 * @param trackId - The track ID to apply the preset to
 * @param presetId - The preset ID to apply
 * @returns Promise with applied settings
 *
 * @example
 * ```typescript
 * const { success, appliedSettings, error } = await applyPresetToTrack('track-id', 'preset-id');
 * if (success) {
 *   console.log('Applied settings:', appliedSettings);
 * }
 * ```
 */
export async function applyPresetToTrack(
  trackId: string,
  presetId: string
): Promise<ApplyPresetResponse> {
  try {
    const { data, error } = await supabase.rpc('apply_preset_to_track', {
      track_id: trackId,
      preset_id: presetId,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Increment usage count in the background
    await incrementPresetUsage(presetId);

    return {
      success: true,
      appliedSettings: data as PresetSettings,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      appliedSettings: null,
      error: error instanceof Error ? error : new Error('Failed to apply preset'),
    };
  }
}

/**
 * Clone a preset (creates a copy for the user)
 * Useful when users want to customize a public/system preset
 *
 * @param presetId - The preset ID to clone
 * @param userId - User ID creating the clone
 * @param newName - Optional custom name for the cloned preset
 * @returns Promise with cloned preset
 *
 * @example
 * ```typescript
 * const { preset, error } = await clonePreset('original-id', userId, 'My Custom Version');
 * ```
 */
export async function clonePreset(
  presetId: string,
  userId: string,
  newName?: string
): Promise<CreatePresetResponse> {
  try {
    const { data: originalPreset } = await getPresetById(presetId);

    if (!originalPreset) {
      throw new Error('Original preset not found');
    }

    const clonedPreset = await createPreset(
      {
        name: newName || `${originalPreset.name} (Copy)`,
        description: originalPreset.description || undefined,
        category: originalPreset.category,
        isPublic: false,
        settings: originalPreset.settings,
      },
      userId
    );

    return clonedPreset;
  } catch (error) {
    return {
      preset: null,
      error: error instanceof Error ? error : new Error('Failed to clone preset'),
    };
  }
}

/**
 * Batch apply preset to multiple tracks
 *
 * @param trackIds - Array of track IDs to apply the preset to
 * @param presetId - The preset ID to apply
 * @returns Promise with results for each track
 *
 * @example
 * ```typescript
 * const results = await batchApplyPresetToTracks(['track1', 'track2'], 'preset-id');
 * ```
 */
export async function batchApplyPresetToTracks(
  trackIds: string[],
  presetId: string
): Promise<Array<{ trackId: string; success: boolean; error?: string }>> {
  const results = await Promise.allSettled(
    trackIds.map((trackId) => applyPresetToTrack(trackId, presetId))
  );

  return results.map((result, index) => ({
    trackId: trackIds[index],
    success: result.status === 'fulfilled' && result.value.success,
    error:
      result.status === 'rejected'
        ? 'Unknown error'
        : result.value.error?.message,
  }));
}

// ============= Real-time Subscriptions =============

/**
 * Subscribe to preset updates for a specific preset
 *
 * @param presetId - The preset ID to watch
 * @param callback - Callback function when preset is updated
 * @returns Supabase subscription object
 *
 * @example
 * ```typescript
 * const subscription = subscribeToPresetUpdates('preset-id', (payload) => {
 *   console.log('Preset updated:', payload.new);
 * });
 *
 * // Unsubscribe when done
 * subscription.unsubscribe();
 * ```
 */
export function subscribeToPresetUpdates(
  presetId: string,
  callback: (preset: Preset) => void
) {
  return supabase
    .channel(`preset-updates-${presetId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'presets',
        filter: `id=eq.${presetId}`,
      },
      (payload) => {
        callback(payload.new as Preset);
      }
    )
    .subscribe();
}

/**
 * Subscribe to new presets created by a user
 *
 * @param userId - The user ID to watch
 * @param callback - Callback function when new preset is created
 * @returns Supabase subscription object
 *
 * @example
 * ```typescript
 * const subscription = subscribeToUserPresets('user-id', (preset) => {
 *   console.log('New preset created:', preset);
 * });
 * ```
 */
export function subscribeToUserPresets(
  userId: string,
  callback: (preset: Preset) => void
) {
  return supabase
    .channel(`user-presets-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'presets',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as Preset);
      }
    )
    .subscribe();
}
