-- Migration: Create moderation_reports table for content moderation
-- Sprint 011 - Task T009 (Additional)
-- Created: 2025-12-12

-- Create report_reason enum
CREATE TYPE public.report_reason AS ENUM (
  'spam',
  'harassment',
  'hate_speech',
  'inappropriate_content',
  'copyright',
  'other'
);

-- Create report_status enum
CREATE TYPE public.report_status AS ENUM (
  'pending',
  'reviewed',
  'resolved',
  'dismissed'
);

-- Create moderation_reports table
CREATE TABLE IF NOT EXISTS public.moderation_reports (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  reporter_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  entity_type public.entity_type NOT NULL,
  entity_id uuid NOT NULL,
  reason public.report_reason NOT NULL,
  description text,
  status public.report_status DEFAULT 'pending' NOT NULL,
  reviewed_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  reviewed_at timestamp with time zone,
  resolution_note text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Prevent duplicate reports from same user
  CONSTRAINT unique_report UNIQUE (reporter_id, entity_type, entity_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_moderation_reports_status ON public.moderation_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_reporter ON public.moderation_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_entity ON public.moderation_reports(entity_type, entity_id);

-- Enable Row Level Security
ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for moderation_reports
-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON public.moderation_reports
  FOR SELECT
  USING (auth.uid() = reporter_id);

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON public.moderation_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- TODO: Add admin policies for reviewing reports

-- Add comments
COMMENT ON TABLE public.moderation_reports IS 'User reports for content moderation';
COMMENT ON COLUMN public.moderation_reports.reporter_id IS 'User who filed the report';
COMMENT ON COLUMN public.moderation_reports.entity_type IS 'Type of content being reported';
COMMENT ON COLUMN public.moderation_reports.entity_id IS 'ID of content being reported';
COMMENT ON COLUMN public.moderation_reports.reason IS 'Reason for report';
COMMENT ON COLUMN public.moderation_reports.status IS 'Report status';
COMMENT ON COLUMN public.moderation_reports.reviewed_by IS 'Moderator who reviewed the report';
