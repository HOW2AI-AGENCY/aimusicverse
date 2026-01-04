# Sprint 014: Platform Integration & Export (High-Level Outline)

**Period**: 2026-03-09 - 2026-03-23 (2 недели)  
**Focus**: Export to streaming platforms, social sharing, API, webhooks  
**Estimated Tasks**: 22-26 задач

---

## User Stories

### User Story 13: Streaming Platform Export (P3)
**Goal**: Enable distribution to major streaming platforms

**Key Features**:
- Export to Spotify (via DistroKid, TuneCore, or direct)
- Export to Apple Music
- Export to YouTube Music
- Export to SoundCloud
- Metadata management (artist name, album, genre, release date)
- Automatic album art generation
- Release scheduling
- Distribution tracking

**Key Tasks** (12 tasks):
- [ ] T001 [P] Create DistributionDialog component
- [ ] T002 [P] Create PlatformSelector component (checkboxes for platforms)
- [ ] T003 [P] Create MetadataEditor component for release info
- [ ] T004 [P] Create AlbumArtGenerator component
- [ ] T005 [P] Integrate with DistroKid API or alternative
- [ ] T006 [P] Implement SoundCloud upload API
- [ ] T007 [P] Create release scheduling system
- [ ] T008 Database migration for distributions table
- [ ] T009 [P] Create useDistribution hook
- [ ] T010 [P] Add distribution status tracking
- [ ] T011 [P] Implement distribution analytics
- [ ] T012 Add distribution to track actions menu

---

### User Story 14: API & Webhooks (P3)
**Goal**: Enable programmatic access and integrations

**Key Features**:
- RESTful API for music generation
- API key management
- Rate limiting per tier
- Webhook configuration for events
- API documentation with interactive examples
- SDK libraries (JavaScript, Python)
- OAuth 2.0 authentication
- API usage analytics

**Key Tasks** (12 tasks):
- [ ] T013 [P] Create API key generation UI
- [ ] T014 [P] Create WebhookConfig component
- [ ] T015 [P] Create APIDocumentation page with Swagger/OpenAPI
- [ ] T016 [P] Implement OAuth 2.0 authentication flow
- [ ] T017 [P] Create API endpoints for generation in supabase/functions/
- [ ] T018 [P] Implement rate limiting middleware
- [ ] T019 [P] Create webhook delivery system
- [ ] T020 [P] Implement webhook event types (generation_complete, payment_success, etc.)
- [ ] T021 Database migration for api_keys and webhooks tables
- [ ] T022 [P] Create JavaScript SDK library
- [ ] T023 [P] Create Python SDK library
- [ ] T024 [P] Add API usage dashboard
- [ ] T025 Add API playground for testing
- [ ] T026 Implement API versioning (v1, v2)

---

## Platform Integration Details

### Spotify via DistroKid
```
Flow:
1. User creates release with metadata
2. System uploads track to DistroKid via API
3. DistroKid distributes to Spotify, Apple Music, etc.
4. Status updates sent back via webhook
5. User receives notification when live
```

### SoundCloud Direct Upload
```
Flow:
1. User authorizes SoundCloud via OAuth
2. System uploads track with metadata
3. Track appears in user's SoundCloud profile
4. Analytics sync back to MusicVerse
```

---

## API Endpoints

### RESTful API
```
POST /api/v1/generate
  - Generate music track
  - Requires: API key, prompt, style
  - Returns: job_id

GET /api/v1/jobs/:job_id
  - Check generation status
  - Returns: status, progress, result_url

GET /api/v1/tracks
  - List user's tracks
  - Pagination, filtering

GET /api/v1/tracks/:track_id
  - Get track details

DELETE /api/v1/tracks/:track_id
  - Delete track

POST /api/v1/webhooks
  - Create webhook
  - Requires: url, events[]

GET /api/v1/webhooks
  - List webhooks

DELETE /api/v1/webhooks/:webhook_id
  - Delete webhook
```

### Webhook Events
```
- generation.started
- generation.completed
- generation.failed
- track.created
- track.updated
- track.deleted
- payment.succeeded
- payment.failed
- subscription.created
- subscription.cancelled
```

---

## Database Schema Requirements

```sql
-- API keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL, -- first 8 chars for display
  name TEXT NOT NULL,
  scopes TEXT[], -- permissions
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT NOT NULL, -- for signature verification
  is_active BOOLEAN DEFAULT TRUE,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook deliveries (for retry logic)
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempt_count INTEGER DEFAULT 1,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Distributions
CREATE TABLE distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  track_id UUID REFERENCES tracks(id),
  platforms TEXT[], -- ['spotify', 'apple_music', 'youtube_music']
  release_date DATE,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'live', 'failed'
  metadata JSONB, -- artist, album, genre, etc.
  external_ids JSONB, -- platform-specific IDs
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Security Considerations

### API Security
- HTTPS only
- API key hashing (never store plain text)
- Rate limiting per key
- IP whitelisting (optional)
- Request signature verification
- Scope-based permissions

### Webhook Security
- HMAC signature verification
- Retry with exponential backoff
- Disable webhook after repeated failures
- Webhook secret rotation

---

## SDK Examples

### JavaScript SDK
```javascript
import { MusicVerseAI } from '@musicverse/sdk';

const client = new MusicVerseAI({ apiKey: 'mvai_...' });

// Generate music
const generation = await client.generate({
  prompt: 'Epic orchestral battle music',
  style: 'Orchestral',
  duration: 180
});

// Wait for completion
const track = await generation.wait();
console.log('Track URL:', track.audio_url);

// List tracks
const tracks = await client.tracks.list({ limit: 10 });
```

### Python SDK
```python
from musicverse import MusicVerseAI

client = MusicVerseAI(api_key='mvai_...')

# Generate music
generation = client.generate(
    prompt='Epic orchestral battle music',
    style='Orchestral',
    duration=180
)

# Wait for completion
track = generation.wait()
print(f'Track URL: {track.audio_url}')

# List tracks
tracks = client.tracks.list(limit=10)
```

---

## Success Metrics

- API adoption rate: > 10% of premium users
- API call volume: Monitor growth
- Webhook delivery success: > 95%
- SDK downloads: > 1000 total
- Distribution success rate: > 90%
- Platform integration usage: > 5% of users

---

## Dependencies
- DistroKid or alternative distribution partner
- SoundCloud developer account
- API rate limiting infrastructure
- Documentation hosting (GitBook, ReadTheDocs)

---

*Outline created: 2025-12-02*
