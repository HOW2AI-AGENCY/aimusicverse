-- Add MIDI auto-transcription settings to user_notification_settings
ALTER TABLE user_notification_settings 
ADD COLUMN IF NOT EXISTS auto_midi_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_midi_model text DEFAULT 'basic-pitch',
ADD COLUMN IF NOT EXISTS auto_midi_stems_only boolean DEFAULT false;