/**
 * usePromptDJ — Re-exports from usePromptDJEnhanced (canonical implementation).
 * This file exists for backward compatibility with existing imports.
 */

export {
  usePromptDJEnhanced as usePromptDJ,
  type PromptChannel,
  type GlobalSettings,
  type GeneratedTrack,
  type ChannelType,
  CHANNEL_TYPES,
} from "./usePromptDJEnhanced";
