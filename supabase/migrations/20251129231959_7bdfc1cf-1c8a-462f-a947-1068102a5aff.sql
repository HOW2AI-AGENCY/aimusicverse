-- Drop the problematic trigger first
DROP TRIGGER IF EXISTS trigger_notify_telegram_on_completion ON generation_tasks;
DROP TRIGGER IF EXISTS notify_telegram_on_completion_trigger ON generation_tasks;

-- Drop the function with CASCADE
DROP FUNCTION IF EXISTS notify_telegram_on_completion() CASCADE;

-- Manually complete remaining stale task
UPDATE generation_tasks 
SET status = 'completed', 
    completed_at = NOW(),
    callback_received_at = NOW()
WHERE id = '0781dfaf-e789-40a6-b17f-2ec49e0ad3e3';

-- Update the track as well
UPDATE tracks
SET status = 'completed'
WHERE id = 'e9cb7e1e-6329-4e2f-aec0-2089d092d310';