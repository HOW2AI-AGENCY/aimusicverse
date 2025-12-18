import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditLogEntry {
  entityType: 'track' | 'project' | 'artist' | 'lyrics' | 'cover' | 'reference_audio';
  entityId: string;
  versionId?: string;
  userId: string;
  actorType: 'user' | 'ai' | 'system';
  aiModelUsed?: string;
  actionType: string;
  actionCategory?: 'generation' | 'modification' | 'approval' | 'publication' | 'deletion';
  contentUrl?: string;
  promptUsed?: string;
  inputMetadata?: Record<string, unknown>;
  outputMetadata?: Record<string, unknown>;
  parentAuditId?: string;
  chainId?: string;
}

interface GetHistoryRequest {
  action: 'get_history';
  entityType: string;
  entityId: string;
}

interface GenerateProofRequest {
  action: 'generate_proof';
  entityType: string;
  entityId: string;
}

type RequestBody = AuditLogEntry | GetHistoryRequest | GenerateProofRequest;

/**
 * Calculate SHA-256 hash of a string
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Fetch content from URL and calculate its hash
 */
async function hashContentFromUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const arrayBuffer = await response.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Error hashing content from URL:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: RequestBody = await req.json();

    // Handle different actions
    if ('action' in body) {
      if (body.action === 'get_history') {
        // Get audit history for an entity
        const { data, error } = await supabase
          .from('content_audit_log')
          .select('*')
          .eq('entity_type', body.entityType)
          .eq('entity_id', body.entityId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, history: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (body.action === 'generate_proof') {
        // Generate proof of creation document
        const { data: auditData, error: auditError } = await supabase
          .from('content_audit_log')
          .select('*')
          .eq('entity_type', body.entityType)
          .eq('entity_id', body.entityId)
          .order('created_at', { ascending: true });

        if (auditError) throw auditError;

        if (!auditData || auditData.length === 0) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No audit history found for this content' 
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get entity details based on type
        let entityData: Record<string, unknown> | null = null;
        const firstEntry = auditData[0];

        if (body.entityType === 'track') {
          const { data } = await supabase
            .from('tracks')
            .select('id, title, style, audio_url, cover_url, created_at, user_id')
            .eq('id', body.entityId)
            .single();
          entityData = data;
        } else if (body.entityType === 'project') {
          const { data } = await supabase
            .from('music_projects')
            .select('id, title, description, cover_url, created_at, user_id')
            .eq('id', body.entityId)
            .single();
          entityData = data;
        } else if (body.entityType === 'artist') {
          const { data } = await supabase
            .from('artists')
            .select('id, name, bio, avatar_url, created_at, user_id')
            .eq('id', body.entityId)
            .single();
          entityData = data;
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, telegram_id, display_name')
          .eq('user_id', firstEntry.user_id)
          .single();

        // Build creation chain
        const creationChain = auditData.map(entry => ({
          timestamp: entry.created_at,
          action: entry.action_type,
          actor: entry.actor_type,
          aiModel: entry.ai_model_used,
          promptHash: entry.prompt_hash,
          inputDataHash: entry.input_data_hash,
          outputHash: entry.content_hash,
        }));

        // Collect all prompts
        const prompts = auditData
          .filter(e => e.prompt_used)
          .map(e => ({
            hash: e.prompt_hash,
            text: e.prompt_used,
          }));

        // Build deposit document
        const depositDocument = {
          version: '1.0',
          generatedAt: new Date().toISOString(),
          author: {
            userId: firstEntry.user_id,
            username: profile?.username || null,
            displayName: profile?.display_name || null,
            telegramId: profile?.telegram_id || null,
          },
          content: {
            type: body.entityType,
            id: body.entityId,
            title: entityData?.title || entityData?.name || 'Untitled',
            createdAt: entityData?.created_at || firstEntry.created_at,
            contentHash: auditData[auditData.length - 1]?.content_hash || null,
          },
          creationChain,
          inputs: {
            prompts,
            referenceAudios: auditData
              .filter(e => e.input_metadata?.reference_audio_id)
              .map(e => ({
                id: e.input_metadata.reference_audio_id,
                hash: e.input_data_hash,
              })),
          },
          documentHash: '', // Will be calculated
        };

        // Calculate document hash
        const documentString = JSON.stringify(depositDocument);
        depositDocument.documentHash = await sha256(documentString);

        // Store deposit
        const { data: deposit, error: depositError } = await supabase
          .from('content_deposits')
          .upsert({
            entity_type: body.entityType,
            entity_id: body.entityId,
            user_id: firstEntry.user_id,
            deposit_document: depositDocument,
            document_hash: depositDocument.documentHash,
            status: 'pending',
          }, {
            onConflict: 'entity_type,entity_id',
          })
          .select()
          .single();

        if (depositError) throw depositError;

        return new Response(JSON.stringify({ 
          success: true, 
          deposit: deposit,
          document: depositDocument 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Default: Log new audit entry
    const entry = body as AuditLogEntry;

    // Calculate hashes
    let contentHash: string | null = null;
    let promptHash: string | null = null;
    let inputDataHash: string | null = null;

    // Hash content if URL provided
    if (entry.contentUrl) {
      contentHash = await hashContentFromUrl(entry.contentUrl);
    }

    // Hash prompt if provided
    if (entry.promptUsed) {
      promptHash = await sha256(entry.promptUsed);
    }

    // Hash input metadata if provided
    if (entry.inputMetadata && Object.keys(entry.inputMetadata).length > 0) {
      inputDataHash = await sha256(JSON.stringify(entry.inputMetadata));
    }

    // Insert audit log entry
    const { data, error } = await supabase
      .from('content_audit_log')
      .insert({
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        version_id: entry.versionId,
        user_id: entry.userId,
        actor_type: entry.actorType,
        ai_model_used: entry.aiModelUsed,
        action_type: entry.actionType,
        action_category: entry.actionCategory,
        content_hash: contentHash,
        prompt_hash: promptHash,
        input_data_hash: inputDataHash,
        prompt_used: entry.promptUsed,
        input_metadata: entry.inputMetadata || {},
        output_metadata: entry.outputMetadata || {},
        parent_audit_id: entry.parentAuditId,
        chain_id: entry.chainId,
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`[audit-log] Logged ${entry.actionType} for ${entry.entityType}/${entry.entityId}`);

    return new Response(JSON.stringify({ success: true, auditId: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('[audit-log] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
