-- Create telegram_menu_state table for tracking active menu messages
CREATE TABLE IF NOT EXISTS public.telegram_menu_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  chat_id BIGINT NOT NULL,
  active_menu_message_id BIGINT,
  current_menu TEXT,
  navigation_stack TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_telegram_menu_state_user_id ON public.telegram_menu_state(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_menu_state_chat_id ON public.telegram_menu_state(chat_id);

-- Enable RLS
ALTER TABLE public.telegram_menu_state ENABLE ROW LEVEL SECURITY;

-- Policy for service role access only (edge functions)
CREATE POLICY "Service role full access"
ON public.telegram_menu_state
FOR ALL
USING (true)
WITH CHECK (true);

-- Add comments
COMMENT ON TABLE public.telegram_menu_state IS 'Tracks active menu state per Telegram user to prevent message spam';
COMMENT ON COLUMN public.telegram_menu_state.active_menu_message_id IS 'ID of the current active menu message - only one per user';
COMMENT ON COLUMN public.telegram_menu_state.chat_id IS 'Telegram chat ID';
COMMENT ON COLUMN public.telegram_menu_state.user_id IS 'Telegram user ID';