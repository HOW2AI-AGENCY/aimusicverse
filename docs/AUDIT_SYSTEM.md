# Audit System for Content Deposition

**Last Updated:** 2025-12-18

## Overview

MusicVerse AI implements a comprehensive audit logging system designed to track all content creation actions for copyright protection and proof of authorship. This system captures both user-initiated and AI-generated actions, creating an immutable chain of provenance for all content.

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│   Frontend Hooks    │────▶│   audit-log Edge    │
│   (useAuditLog)     │     │      Function       │
└─────────────────────┘     └──────────┬──────────┘
                                       │
┌─────────────────────┐                │
│   Edge Functions    │────────────────┤
│  (generate-*, etc)  │                │
└─────────────────────┘                ▼
                            ┌─────────────────────┐
                            │  content_audit_log  │
                            │      (Table)        │
                            └──────────┬──────────┘
                                       │
                                       ▼
                            ┌─────────────────────┐
                            │  content_deposits   │
                            │ (Proof Documents)   │
                            └─────────────────────┘
```

## Database Tables

### content_audit_log

Stores all content-related actions with cryptographic hashes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `entity_type` | VARCHAR | track, project, artist, lyrics, cover, reference_audio |
| `entity_id` | UUID | ID of the content entity |
| `version_id` | UUID | Optional version reference |
| `user_id` | UUID | Creator/actor |
| `actor_type` | VARCHAR | user, ai, system |
| `ai_model_used` | VARCHAR | AI model if applicable |
| `action_type` | VARCHAR | created, generated, edited, approved, published |
| `action_category` | VARCHAR | generation, modification, approval, publication, deletion |
| `content_hash` | VARCHAR(64) | SHA-256 hash of content |
| `prompt_hash` | VARCHAR(64) | SHA-256 hash of prompt |
| `input_data_hash` | VARCHAR(64) | SHA-256 hash of input data |
| `prompt_used` | TEXT | Full prompt text |
| `input_metadata` | JSONB | Additional input info |
| `output_metadata` | JSONB | Additional output info |
| `parent_audit_id` | UUID | Link to parent action |
| `chain_id` | UUID | Group related actions |
| `created_at` | TIMESTAMPTZ | Timestamp |

### content_deposits

Stores generated proof-of-creation documents.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `entity_type` | VARCHAR | Content type |
| `entity_id` | UUID | Content ID |
| `user_id` | UUID | Owner |
| `deposit_document` | JSONB | Full proof document |
| `document_hash` | VARCHAR(64) | SHA-256 of document |
| `status` | VARCHAR | pending, submitted, confirmed |
| `external_deposit_id` | VARCHAR | External system reference |
| `created_at` | TIMESTAMPTZ | Creation time |
| `confirmed_at` | TIMESTAMPTZ | Confirmation time |

## Integrated Flows

### Track Generation
- `suno-music-callback` logs track creation with audio hash
- Captures: AI model, prompt, style tags, reference audio

### Track Approval & Publishing
- `useProjectGeneratedTracks` logs track approval, rejection, master selection
- `tracks.service.ts` logs visibility changes (publish/unpublish)

### Project Management
- `useProjects` hook logs creation and updates
- `project-ai-actions` logs AI improvements and translations
- `usePublishProject` logs project publication

### Artist Creation
- `useArtists` hook logs artist creation
- `generate-artist-portrait` logs AI portrait generation

### Lyrics Generation
- `generate-lyrics` logs lyrics generation requests
- Captures: theme, style, mood, language

### Cover Generation
- `generate-track-cover` logs cover art generation
- Captures: prompt, style context, project aesthetics

### Reference Audio
- `MultiTrackUpload` logs user audio uploads
- Captures: file name, size, MIME type, storage URL

## Usage

### Frontend (React)

```typescript
import { useAuditLog } from '@/hooks/useAuditLog';

function MyComponent() {
  const { 
    logAction,
    logTrackCreated,
    logProjectCreated,
    logArtistCreated,
    getContentHistory,
    generateProofOfCreation,
  } = useAuditLog();

  // Log custom action
  await logAction({
    entityType: 'track',
    entityId: trackId,
    actorType: 'user',
    actionType: 'published',
    actionCategory: 'publication',
  });

  // Get audit history
  const history = await getContentHistory('track', trackId);

  // Generate proof document
  const { deposit, document } = await generateProofOfCreation('track', trackId);
}
```

### Edge Functions (Deno)

```typescript
// Direct insert to audit log
await supabase.from('content_audit_log').insert({
  entity_type: 'track',
  entity_id: trackId,
  user_id: userId,
  actor_type: 'ai',
  ai_model_used: 'suno_v4',
  action_type: 'generated',
  action_category: 'generation',
  prompt_used: prompt,
  input_metadata: { style, tags },
  output_metadata: { audio_url },
});
```

## Deposit Document Structure

```typescript
interface DepositDocument {
  version: '1.0';
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
    actor: 'user' | 'ai';
    aiModel?: string;
    promptHash?: string;
    inputDataHash?: string;
    outputHash?: string;
  }>;
  
  inputs: {
    prompts: Array<{ hash: string; text: string }>;
    referenceAudios: Array<{ id: string; hash: string }>;
  };
  
  documentHash: string; // SHA-256 of entire document
}
```

## Security

- All audit logs are protected by Row-Level Security (RLS)
- Users can only view their own audit logs
- Content hashes are calculated server-side for integrity
- Document hashes provide tamper-evidence

## Future Integration

The audit system is designed to integrate with external deposition services:

1. **Blockchain anchoring** - Document hashes can be anchored to blockchain
2. **Timestamping services** - RFC 3161 compliant timestamping
3. **Copyright registries** - Automatic submission to copyright offices
4. **Legal evidence** - Court-admissible proof of creation chain

## Related Files

- `supabase/functions/audit-log/index.ts` - Main audit edge function
- `src/hooks/useAuditLog.ts` - React hook for frontend
- `supabase/functions/suno-music-callback/index.ts` - Track generation audit
- `supabase/functions/generate-lyrics/index.ts` - Lyrics audit
- `supabase/functions/generate-track-cover/index.ts` - Cover audit
- `supabase/functions/generate-artist-portrait/index.ts` - Portrait audit
- `supabase/functions/project-ai-actions/index.ts` - Project AI audit
- `src/hooks/useProjects.tsx` - Project creation/update audit
- `src/hooks/useArtists.tsx` - Artist creation audit
- `src/hooks/useProjectGeneratedTracks.ts` - Track approval/publish audit
- `src/components/upload/MultiTrackUpload.tsx` - Reference audio upload audit
- `src/services/tracks.service.ts` - Track visibility audit
