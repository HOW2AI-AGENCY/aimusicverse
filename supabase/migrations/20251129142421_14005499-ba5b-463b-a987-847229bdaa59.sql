-- Create generation_tasks table for tracking music generation with Telegram notifications
CREATE TABLE IF NOT EXISTS public.generation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
  telegram_chat_id BIGINT,
  source TEXT DEFAULT 'mini_app',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.generation_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own generation tasks"
  ON public.generation_tasks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generation tasks"
  ON public.generation_tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generation tasks"
  ON public.generation_tasks
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_generation_tasks_user_id ON public.generation_tasks(user_id);
CREATE INDEX idx_generation_tasks_status ON public.generation_tasks(status);
CREATE INDEX idx_generation_tasks_telegram_chat_id ON public.generation_tasks(telegram_chat_id);

-- Trigger for updated_at
CREATE TRIGGER update_generation_tasks_updated_at
  BEFORE UPDATE ON public.generation_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to send Telegram notification when generation completes
CREATE OR REPLACE FUNCTION public.notify_telegram_on_completion()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only notify if status changed to completed or failed and telegram_chat_id exists
  IF (NEW.status IN ('completed', 'failed') AND OLD.status != NEW.status AND NEW.telegram_chat_id IS NOT NULL) THEN
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-telegram-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'task_id', NEW.id,
        'chat_id', NEW.telegram_chat_id,
        'status', NEW.status,
        'track_id', NEW.track_id,
        'error_message', NEW.error_message
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to call notification function
CREATE TRIGGER trigger_notify_telegram_on_completion
  AFTER UPDATE ON public.generation_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_telegram_on_completion();