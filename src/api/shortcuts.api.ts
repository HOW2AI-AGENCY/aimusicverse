// @ts-nocheck
/**
 * Keyboard Shortcuts API Layer
 * Raw Supabase database operations for user keyboard shortcuts
 *
 * Shortcuts are stored in the profiles table as a JSON field `keyboard_shortcuts`
 * Following the API contract from specs/031-mobile-studio-v2/contracts/api-contracts.md
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Keyboard shortcut key binding definition
 */
export interface ShortcutKey {
  /** The key character (e.g., 's', ' ', 'Enter') */
  key: string;
  /** Ctrl/Cmd modifier key */
  ctrl: boolean;
  /** Shift modifier key */
  shift: boolean;
  /** Alt/Option modifier key */
  alt?: boolean;
  /** Meta/Windows key modifier */
  meta?: boolean;
}

/**
 * Shortcut category containing multiple shortcuts
 */
export interface ShortcutCategory {
  [actionName: string]: ShortcutKey;
}

/**
 * Complete shortcuts configuration organized by category
 */
export interface ShortcutsConfig {
  /** Studio workspace shortcuts (play, pause, save, etc.) */
  studio?: ShortcutCategory;
  /** Lyrics editor shortcuts (AI assist, formatting, etc.) */
  lyrics?: ShortcutCategory;
  /** Mixer shortcuts (volume, pan, solo, mute) */
  mixer?: ShortcutCategory;
  /** General app shortcuts */
  general?: ShortcutCategory;
}

/**
 * Response shape for GET /users/me/shortcuts
 */
export interface GetShortcutsResponse {
  shortcuts: ShortcutsConfig;
}

/**
 * Request shape for PUT /users/me/shortcuts
 */
export interface UpdateShortcutsRequest {
  shortcuts: ShortcutsConfig;
}

/**
 * Response shape for PUT /users/me/shortcuts
 */
export interface UpdateShortcutsResponse {
  success: boolean;
}

/**
 * Response shape for POST /users/me/shortcuts/reset
 */
export interface ResetShortcutsResponse {
  shortcuts: ShortcutsConfig;
}

/**
 * Error response shape
 */
export interface ShortcutsError {
  error: string;
  message: string;
  details?: unknown;
}

/**
 * Default shortcuts configuration
 * Used when resetting to defaults or for new users
 */
export const DEFAULT_SHORTCUTS: ShortcutsConfig = {
  studio: {
    play_pause: { key: ' ', ctrl: false, shift: false },
    stop: { key: '.', ctrl: false, shift: false },
    save: { key: 's', ctrl: true, shift: false },
    save_as: { key: 's', ctrl: true, shift: true },
    undo: { key: 'z', ctrl: true, shift: false },
    redo: { key: 'z', ctrl: true, shift: true },
    export: { key: 'e', ctrl: true, shift: false },
    import: { key: 'i', ctrl: true, shift: false },
  },
  lyrics: {
    ai_assist: { key: 'a', ctrl: true, shift: false },
    format: { key: 'f', ctrl: true, shift: false },
    new_line: { key: 'Enter', ctrl: false, shift: false },
    new_section: { key: 'Enter', ctrl: true, shift: false },
  },
  mixer: {
    volume_up: { key: 'ArrowUp', ctrl: false, shift: false },
    volume_down: { key: 'ArrowDown', ctrl: false, shift: false },
    pan_left: { key: 'ArrowLeft', ctrl: false, shift: false },
    pan_right: { key: 'ArrowRight', ctrl: false, shift: false },
    solo_toggle: { key: 's', ctrl: false, shift: false },
    mute_toggle: { key: 'm', ctrl: false, shift: false },
  },
  general: {
    search: { key: 'k', ctrl: true, shift: false },
    settings: { key: ',', ctrl: true, shift: false },
    help: { key: '?', ctrl: false, shift: false },
    fullscreen: { key: 'f', ctrl: true, shift: false },
  },
};

/**
 * Fetch user's keyboard shortcuts from their profile
 *
 * GET /users/me/shortcuts
 *
 * @param userId - The user's ID to fetch shortcuts for
 * @returns Promise resolving to the shortcuts configuration
 * @throws Error if fetching fails
 *
 * @example
 * ```typescript
 * const { shortcuts } = await getShortcuts('user-123');
 * console.log(shortcuts.studio?.play_pause); // { key: ' ', ctrl: false, shift: false }
 * ```
 */
export async function getShortcuts(
  userId: string
): Promise<GetShortcutsResponse> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('keyboard_shortcuts')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch shortcuts: ${error.message}`);
    }

    // If no shortcuts are set, return defaults
    const shortcuts = data?.keyboard_shortcuts as ShortcutsConfig | null;

    return {
      shortcuts: shortcuts || DEFAULT_SHORTCUTS,
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch shortcuts: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Update user's keyboard shortcuts in their profile
 *
 * PUT /users/me/shortcuts
 *
 * @param userId - The user's ID to update shortcuts for
 * @param request - The shortcuts configuration to save
 * @returns Promise resolving to success status
 * @throws Error if update fails
 *
 * @example
 * ```typescript
 * await updateShortcuts('user-123', {
 *   shortcuts: {
 *     studio: {
 *       play_pause: { key: 'Space', ctrl: false, shift: false }
 *     }
 *   }
 * });
 * ```
 */
export async function updateShortcuts(
  userId: string,
  request: UpdateShortcutsRequest
): Promise<UpdateShortcutsResponse> {
  try {
    // Validate shortcuts structure
    validateShortcutsConfig(request.shortcuts);

    const { error } = await supabase
      .from('profiles')
      .update({ keyboard_shortcuts: request.shortcuts as unknown as unknown })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to update shortcuts: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    throw new Error(
      `Failed to update shortcuts: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Reset user's keyboard shortcuts to default configuration
 *
 * POST /users/me/shortcuts/reset
 *
 * @param userId - The user's ID to reset shortcuts for
 * @returns Promise resolving to default shortcuts configuration
 * @throws Error if reset fails
 *
 * @example
 * ```typescript
 * const { shortcuts } = await resetShortcuts('user-123');
 * console.log(shortcuts); // Default shortcuts configuration
 * ```
 */
export async function resetShortcuts(
  userId: string
): Promise<ResetShortcutsResponse> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ keyboard_shortcuts: DEFAULT_SHORTCUTS as unknown as unknown })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to reset shortcuts: ${error.message}`);
    }

    return {
      shortcuts: DEFAULT_SHORTCUTS,
    };
  } catch (error) {
    throw new Error(
      `Failed to reset shortcuts: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Validate shortcuts configuration structure
 *
 * @param shortcuts - The shortcuts configuration to validate
 * @throws Error if validation fails
 *
 * @internal
 */
function validateShortcutsConfig(shortcuts: ShortcutsConfig): void {
  if (!shortcuts || typeof shortcuts !== 'object') {
    throw new Error('Shortcuts must be an object');
  }

  // Validate each category
  for (const [category, actions] of Object.entries(shortcuts)) {
    if (!actions || typeof actions !== 'object') {
      throw new Error(`Shortcut category "${category}" must be an object`);
    }

    // Validate each action in category
    for (const [action, keyBinding] of Object.entries(actions)) {
      if (!keyBinding || typeof keyBinding !== 'object') {
        throw new Error(
          `Shortcut "${category}.${action}" must be an object`
        );
      }

      const binding = keyBinding as ShortcutKey;

      if (typeof binding.key !== 'string' || binding.key.length === 0) {
        throw new Error(
          `Shortcut "${category}.${action}" must have a valid key`
        );
      }

      if (typeof binding.ctrl !== 'boolean') {
        throw new Error(
          `Shortcut "${category}.${action}" must have a boolean ctrl value`
        );
      }

      if (typeof binding.shift !== 'boolean') {
        throw new Error(
          `Shortcut "${category}.${action}" must have a boolean shift value`
        );
      }

      // Optional modifiers
      if (binding.alt !== undefined && typeof binding.alt !== 'boolean') {
        throw new Error(
          `Shortcut "${category}.${action}" must have a boolean alt value if provided`
        );
      }

      if (binding.meta !== undefined && typeof binding.meta !== 'boolean') {
        throw new Error(
          `Shortcut "${category}.${action}" must have a boolean meta value if provided`
        );
      }
    }
  }
}

/**
 * Check if a keyboard event matches a shortcut
 *
 * Utility function to compare keyboard events against shortcut definitions
 *
 * @param event - The keyboard event to check
 * @param shortcut - The shortcut definition to match against
 * @returns True if the event matches the shortcut
 *
 * @example
 * ```typescript
 * const shortcuts = await getShortcuts('user-123');
 * const playPauseShortcut = shortcuts.shortcuts.studio?.play_pause;
 *
 * document.addEventListener('keydown', (e) => {
 *   if (matchesShortcut(e, playPauseShortcut)) {
 *     togglePlayPause();
 *   }
 * });
 * ```
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: ShortcutKey | undefined
): boolean {
  if (!shortcut) return false;

  return (
    event.key === shortcut.key &&
    event.ctrlKey === shortcut.ctrl &&
    event.shiftKey === shortcut.shift &&
    event.altKey === (shortcut.alt ?? false) &&
    event.metaKey === (shortcut.meta ?? false)
  );
}

/**
 * Convert a shortcut to a human-readable display string
 *
 * @param shortcut - The shortcut to format
 * @returns Formatted string (e.g., "Ctrl+S", "Space", "Shift+Enter")
 *
 * @example
 * ```typescript
 * formatShortcut({ key: 's', ctrl: true, shift: false }); // "Ctrl+S"
 * formatShortcut({ key: ' ', ctrl: false, shift: false }); // "Space"
 * formatShortcut({ key: 'Enter', ctrl: true, shift: true }); // "Ctrl+Shift+Enter"
 * ```
 */
export function formatShortcut(shortcut: ShortcutKey): string {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.meta) parts.push('Meta');

  // Format special keys
  const keyDisplay = shortcut.key === ' ' ? 'Space' : shortcut.key;
  parts.push(keyDisplay);

  return parts.join('+');
}

/**
 * Merge user shortcuts with defaults (user shortcuts take precedence)
 *
 * @param userShortcuts - User's custom shortcuts
 * @param defaults - Default shortcuts to fall back to
 * @returns Merged shortcuts configuration
 *
 * @example
 * ```typescript
 * const merged = mergeShortcuts(userShortcuts, DEFAULT_SHORTCUTS);
 * // User's custom shortcuts are preserved, missing ones are filled from defaults
 * ```
 */
export function mergeShortcuts(
  userShortcuts: Partial<ShortcutsConfig>,
  defaults: ShortcutsConfig = DEFAULT_SHORTCUTS
): ShortcutsConfig {
  const merged: ShortcutsConfig = { ...defaults };

  for (const [category, actions] of Object.entries(userShortcuts)) {
    if (actions) {
      merged[category] = {
        ...(merged[category] || {}),
        ...actions,
      };
    }
  }

  return merged;
}
