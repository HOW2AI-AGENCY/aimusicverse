/**
 * Audit Log Hook for Content Deposition
 * 
 * Provides functionality to log user and AI actions for copyright proof.
 */

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type EntityType = 'track' | 'project' | 'artist' | 'lyrics' | 'cover' | 'reference_audio';
export type ActorType = 'user' | 'ai' | 'system';
export type ActionCategory = 'generation' | 'modification' | 'approval' | 'publication' | 'deletion';

export interface AuditLogEntry {
  entityType: EntityType;
  entityId: string;
  versionId?: string;
  actorType: ActorType;
  aiModelUsed?: string;
  actionType: string;
  actionCategory?: ActionCategory;
  contentUrl?: string;
  promptUsed?: string;
  inputMetadata?: Record<string, unknown>;
  outputMetadata?: Record<string, unknown>;
  parentAuditId?: string;
  chainId?: string;
}

export interface AuditHistoryEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  version_id: string | null;
  user_id: string;
  actor_type: string;
  ai_model_used: string | null;
  action_type: string;
  action_category: string | null;
  content_hash: string | null;
  prompt_hash: string | null;
  input_data_hash: string | null;
  prompt_used: string | null;
  input_metadata: Record<string, unknown>;
  output_metadata: Record<string, unknown>;
  parent_audit_id: string | null;
  chain_id: string | null;
  created_at: string;
}

export interface DepositDocument {
  version: string;
  generatedAt: string;
  author: {
    userId: string;
    username: string | null;
    displayName: string | null;
    telegramId: number | null;
  };
  content: {
    type: string;
    id: string;
    title: string;
    createdAt: string;
    contentHash: string | null;
  };
  creationChain: Array<{
    timestamp: string;
    action: string;
    actor: string;
    aiModel?: string;
    promptHash?: string;
    inputDataHash?: string;
    outputHash?: string;
  }>;
  inputs: {
    prompts: Array<{ hash: string; text: string }>;
    referenceAudios: Array<{ id: string; hash: string }>;
  };
  documentHash: string;
}

export interface ContentDeposit {
  id: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  deposit_document: DepositDocument;
  document_hash: string;
  status: 'pending' | 'submitted' | 'confirmed';
  external_deposit_id: string | null;
  created_at: string;
  confirmed_at: string | null;
}

export function useAuditLog() {
  const { user } = useAuth();

  /**
   * Log an action to the audit trail
   */
  const logAction = async (entry: Omit<AuditLogEntry, 'userId'> & { userId?: string }) => {
    const userId = entry.userId || user?.id;
    if (!userId) {
      console.warn('[useAuditLog] No user ID available for logging');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('audit-log', {
        body: {
          ...entry,
          userId,
        },
      });

      if (error) throw error;
      return data?.auditId || null;
    } catch (error) {
      console.error('[useAuditLog] Error logging action:', error);
      return null;
    }
  };

  /**
   * Get the full audit history for a content entity
   */
  const getContentHistory = async (entityType: EntityType, entityId: string): Promise<AuditHistoryEntry[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('audit-log', {
        body: {
          action: 'get_history',
          entityType,
          entityId,
        },
      });

      if (error) throw error;
      return data?.history || [];
    } catch (error) {
      console.error('[useAuditLog] Error getting history:', error);
      return [];
    }
  };

  /**
   * Generate a proof of creation document for deposition
   */
  const generateProofOfCreation = async (
    entityType: EntityType, 
    entityId: string
  ): Promise<{ deposit: ContentDeposit; document: DepositDocument } | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('audit-log', {
        body: {
          action: 'generate_proof',
          entityType,
          entityId,
        },
      });

      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to generate proof');
      }

      return {
        deposit: data.deposit,
        document: data.document,
      };
    } catch (error) {
      console.error('[useAuditLog] Error generating proof:', error);
      return null;
    }
  };

  /**
   * Get existing deposit for an entity
   */
  const getDeposit = async (entityType: EntityType, entityId: string): Promise<ContentDeposit | null> => {
    try {
      const { data, error } = await supabase
        .from('content_deposits')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ContentDeposit | null;
    } catch (error) {
      console.error('[useAuditLog] Error getting deposit:', error);
      return null;
    }
  };

  /**
   * Helper: Log track creation
   */
  const logTrackCreated = (trackId: string, options: {
    aiModel?: string;
    promptUsed?: string;
    style?: string;
    audioUrl?: string;
    referenceAudioId?: string;
    chainId?: string;
  }) => {
    return logAction({
      entityType: 'track',
      entityId: trackId,
      actorType: options.aiModel ? 'ai' : 'user',
      aiModelUsed: options.aiModel,
      actionType: 'created',
      actionCategory: 'generation',
      contentUrl: options.audioUrl,
      promptUsed: options.promptUsed,
      inputMetadata: {
        style: options.style,
        reference_audio_id: options.referenceAudioId,
      },
      outputMetadata: {
        audio_url: options.audioUrl,
      },
      chainId: options.chainId,
    });
  };

  /**
   * Helper: Log project creation
   */
  const logProjectCreated = (projectId: string, options: {
    title: string;
    aiGenerated?: boolean;
    aiModel?: string;
  }) => {
    return logAction({
      entityType: 'project',
      entityId: projectId,
      actorType: options.aiGenerated ? 'ai' : 'user',
      aiModelUsed: options.aiModel,
      actionType: 'created',
      actionCategory: 'generation',
      inputMetadata: {
        title: options.title,
      },
    });
  };

  /**
   * Helper: Log artist creation
   */
  const logArtistCreated = (artistId: string, options: {
    name: string;
    fromTrackId?: string;
  }) => {
    return logAction({
      entityType: 'artist',
      entityId: artistId,
      actorType: 'user',
      actionType: 'created',
      actionCategory: 'generation',
      inputMetadata: {
        name: options.name,
        source_track_id: options.fromTrackId,
      },
    });
  };

  /**
   * Helper: Log lyrics generation
   */
  const logLyricsGenerated = (trackId: string, options: {
    aiModel: string;
    promptUsed?: string;
    lyrics: string;
  }) => {
    return logAction({
      entityType: 'lyrics',
      entityId: trackId,
      actorType: 'ai',
      aiModelUsed: options.aiModel,
      actionType: 'generated',
      actionCategory: 'generation',
      promptUsed: options.promptUsed,
      outputMetadata: {
        lyrics_length: options.lyrics.length,
      },
    });
  };

  /**
   * Helper: Log cover generation
   */
  const logCoverGenerated = (trackId: string, options: {
    aiModel: string;
    promptUsed?: string;
    coverUrl: string;
  }) => {
    return logAction({
      entityType: 'cover',
      entityId: trackId,
      actorType: 'ai',
      aiModelUsed: options.aiModel,
      actionType: 'generated',
      actionCategory: 'generation',
      contentUrl: options.coverUrl,
      promptUsed: options.promptUsed,
      outputMetadata: {
        cover_url: options.coverUrl,
      },
    });
  };

  return {
    logAction,
    getContentHistory,
    generateProofOfCreation,
    getDeposit,
    // Helper methods
    logTrackCreated,
    logProjectCreated,
    logArtistCreated,
    logLyricsGenerated,
    logCoverGenerated,
  };
}

// Note: For server-side (edge functions) audit logging, use the audit-log 
// edge function directly via fetch with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
