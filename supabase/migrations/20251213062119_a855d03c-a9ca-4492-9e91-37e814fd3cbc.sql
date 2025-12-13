-- Create comment_likes table for Sprint 011
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

-- Enable RLS
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view comment likes"
ON public.comment_likes
FOR SELECT
USING (true);

CREATE POLICY "Users can like comments"
ON public.comment_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
ON public.comment_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON public.comment_likes(user_id);