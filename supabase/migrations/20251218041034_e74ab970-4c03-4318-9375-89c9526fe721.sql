-- Content Audit Log table for tracking all content actions (for deposition/copyright proof)
CREATE TABLE public.content_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content identification
  entity_type VARCHAR(50) NOT NULL, -- 'track', 'project', 'artist', 'lyrics', 'cover', 'reference_audio'
  entity_id UUID NOT NULL,
  version_id UUID, -- for versioned content
  
  -- Attribution
  user_id UUID NOT NULL,
  actor_type VARCHAR(20) NOT NULL, -- 'user', 'ai', 'system'
  ai_model_used VARCHAR(100), -- 'suno_v4', 'gemini_2.5_flash', 'stabilityai', etc.
  
  -- Action details
  action_type VARCHAR(50) NOT NULL, -- 'created', 'edited', 'generated', 'approved', 'published', 'deleted'
  action_category VARCHAR(30), -- 'generation', 'modification', 'approval', 'publication'
  
  -- Cryptographic proofs for deposition
  content_hash VARCHAR(64), -- SHA-256 hash of content
  prompt_hash VARCHAR(64), -- SHA-256 hash of prompt
  input_data_hash VARCHAR(64), -- hash of input data (reference audio, etc.)
  
  -- Details
  prompt_used TEXT,
  input_metadata JSONB DEFAULT '{}'::jsonb, -- reference_audio_id, style_tags, etc.
  output_metadata JSONB DEFAULT '{}'::jsonb, -- audio_url, cover_url, etc.
  
  -- Provenance chain
  parent_audit_id UUID REFERENCES public.content_audit_log(id),
  chain_id UUID, -- ID for grouping related actions
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX idx_content_audit_user ON public.content_audit_log(user_id);
CREATE INDEX idx_content_audit_entity ON public.content_audit_log(entity_type, entity_id);
CREATE INDEX idx_content_audit_chain ON public.content_audit_log(chain_id);
CREATE INDEX idx_content_audit_hash ON public.content_audit_log(content_hash);
CREATE INDEX idx_content_audit_created ON public.content_audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.content_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON public.content_audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert audit logs
CREATE POLICY "Service can insert audit logs"
  ON public.content_audit_log
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.content_audit_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Content Deposits table for storing deposition documents
CREATE TABLE public.content_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Deposit data
  deposit_document JSONB NOT NULL, -- full document
  document_hash VARCHAR(64) NOT NULL, -- SHA-256 of document
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'submitted', 'confirmed'
  external_deposit_id VARCHAR(255), -- ID in external deposition system
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  confirmed_at TIMESTAMPTZ,
  
  UNIQUE(entity_type, entity_id)
);

-- Enable RLS
ALTER TABLE public.content_deposits ENABLE ROW LEVEL SECURITY;

-- Users can view their own deposits
CREATE POLICY "Users can view own deposits"
  ON public.content_deposits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own deposits
CREATE POLICY "Users can create own deposits"
  ON public.content_deposits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own deposits
CREATE POLICY "Users can update own deposits"
  ON public.content_deposits
  FOR UPDATE
  USING (auth.uid() = user_id);