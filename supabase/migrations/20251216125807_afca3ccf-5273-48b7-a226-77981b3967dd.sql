-- Add telegram_message_id column to generation_tasks for progress message tracking
ALTER TABLE public.generation_tasks 
ADD COLUMN IF NOT EXISTS telegram_message_id BIGINT;