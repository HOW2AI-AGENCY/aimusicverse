-- Create table for broadcast message templates
CREATE TABLE public.broadcast_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.broadcast_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can access templates
CREATE POLICY "Admins can manage broadcast templates"
ON public.broadcast_templates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@aimusiс.verse%')
  )
);

-- Add image_url column to broadcast_messages for history
ALTER TABLE public.broadcast_messages 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Trigger for updated_at
CREATE TRIGGER update_broadcast_templates_updated_at
BEFORE UPDATE ON public.broadcast_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();