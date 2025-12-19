-- Drop old restrictive constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add new constraint with all supported notification types
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY[
  'info', 'success', 'warning', 'error',
  'generation', 'project', 'social', 'achievement', 'system',
  'video_ready', 'video_failed', 'stems_ready', 'track_generated', 'section_replaced'
]::text[]));