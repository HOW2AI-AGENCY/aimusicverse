-- Migration: Add keyboard_shortcuts column to profiles table
-- Task: T008 - Keyboard shortcuts customization for Mobile Studio V2
-- Description: Adds JSONB column to store user's custom keyboard shortcuts

-- Add keyboard_shortcuts column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS keyboard_shortcuts JSONB DEFAULT '{}'::jsonb;

-- Create index for efficient querying of users with custom shortcuts
CREATE INDEX IF NOT EXISTS idx_profiles_keyboard_shortcuts
  ON public.profiles(keyboard_shortcuts)
  WHERE keyboard_shortcuts != '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.keyboard_shortcuts IS 'User-customized keyboard shortcuts (JSONB with action-to-key mappings)';

-- Example keyboard_shortcuts JSON structure (for documentation):
-- {
--   "studio": {
--     "play_pause": "Space",
--     "stop": "Escape",
--     "save": "CmdOrCtrl+S",
--     "undo": "CmdOrCtrl+Z",
--     "redo": "CmdOrCtrl+Shift+Z",
--     "toggle_mute": "M",
--     "toggle_solo": "S"
--   },
--   "lyrics": {
--     "new_section": "CmdOrCtrl+N",
--     "format": "CmdOrCtrl+Shift+F"
--   },
--   "mixer": {
--     "reset_volume": "R",
--     "toggle_automation": "A"
--   }
-- }
