# Implementation Plan: Sprint 014 - Platform Integration & Export

**Sprint**: Sprint-014  
**Duration**: 2 weeks (March 9-23, 2026)  
**Team Size**: 3-4 developers  
**Status**: Planning Phase

---

## Tech Stack

### Core Technologies (Existing)
- **Frontend**: React 19, TypeScript 5, Vite
- **UI Framework**: Tailwind CSS, shadcn/ui components
- **State Management**: Zustand, TanStack Query
- **Backend**: Supabase (PostgreSQL, Edge Functions, Storage, Auth)
- **Telegram**: @twa-dev/sdk for Mini App integration
- **Deployment**: Lovable Cloud (Supabase-based)

### New Dependencies for Sprint 014

**Backend (Edge Functions)**:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0",
    "jose": "^5.1.0",              // JWT for OAuth 2.0
    "bcrypt": "^5.1.1",             // API key hashing
    "zod": "^3.22.4",               // API request validation
    "openapi-typescript": "^6.7.3"  // OpenAPI type generation
  }
}
```

**Frontend (React)**:
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.17.0",  // Existing
    "zustand": "^4.4.7",                 // Existing
    "react-hook-form": "^7.49.0",        // Form validation
    "zod": "^3.22.4"                     // Schema validation
  }
}
```

**SDK Development**:

JavaScript SDK (`sdks/javascript/package.json`):
```json
{
  "name": "@aimusicverse/sdk",
  "version": "1.0.0",
  "dependencies": {
    "axios": "^1.6.0",
    "eventemitter3": "^5.0.1"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "vitest": "^1.0.0"
  }
}
```

Python SDK (`sdks/python/pyproject.toml`):
```toml
[project]
name = "aimusicverse"
version = "1.0.0"
dependencies = [
    "httpx>=0.25.0",
    "pydantic>=2.5.0",
    "typing-extensions>=4.8.0"
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.21.0",
    "black>=23.0.0",
    "mypy>=1.7.0"
]
```

**External APIs**:
- **SoundCloud API**: OAuth 2.0 + Upload API
- **DistroKid API**: REST API (or TuneCore alternative)
- **YouTube API**: Google OAuth + YouTube Data API v3
- **Apple Music API**: MusicKit JS (via DistroKid relay)
- **Replicate API**: Stable Diffusion for album art
- **Stability AI**: Fallback for album art generation

---

## Project Structure

### Updated Directory Structure

```
/home/runner/work/aimusicverse/aimusicverse/
├── src/                                    # Frontend React application
│   ├── components/
│   │   ├── distribution/                  # NEW: Distribution UI components
│   │   │   ├── DistributionForm.tsx
│   │   │   ├── PlatformSelector.tsx
│   │   │   ├── MetadataEditor.tsx
│   │   │   ├── DistributionStatusCard.tsx
│   │   │   ├── ReleaseDatePicker.tsx
│   │   │   ├── AlbumArtSelector.tsx
│   │   │   └── CostCalculator.tsx
│   │   ├── api/                           # NEW: API management UI
│   │   │   ├── ApiKeyManager.tsx
│   │   │   ├── ApiKeyCreateDialog.tsx
│   │   │   ├── ApiAnalyticsDashboard.tsx
│   │   │   ├── EndpointPerformanceChart.tsx
│   │   │   ├── UsageOverTimeChart.tsx
│   │   │   └── RateLimitUpgrade.tsx
│   │   ├── webhooks/                      # NEW: Webhook management UI
│   │   │   ├── WebhookManager.tsx
│   │   │   ├── WebhookCreateDialog.tsx
│   │   │   ├── WebhookDeliveryLog.tsx
│   │   │   └── SecretRotation.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── distributions/                 # NEW: Distribution hooks
│   │   │   ├── useDistributions.ts
│   │   │   ├── useCreateDistribution.ts
│   │   │   └── useDistributionStatus.ts
│   │   ├── api/                           # NEW: API management hooks
│   │   │   ├── useApiBase.ts
│   │   │   └── useApiKeys.ts
│   │   └── webhooks/                      # NEW: Webhook hooks
│   │       ├── useWebhookBase.ts
│   │       └── useWebhooks.ts
│   ├── pages/
│   │   ├── Distributions.tsx              # NEW: Distributions management page
│   │   ├── OAuthConsent.tsx               # NEW: OAuth consent screen
│   │   └── admin/
│   │       └── ApiMonitoring.tsx          # NEW: Admin API monitoring
│   ├── types/
│   │   ├── distributions.ts               # NEW: Distribution types
│   │   ├── api.ts                         # NEW: API key types
│   │   ├── webhooks.ts                    # NEW: Webhook types
│   │   └── platformMetadata.ts            # NEW: Platform-specific metadata
│   └── utils/
│       ├── distributionErrors.ts          # NEW: Distribution error utilities
│       └── distributionExport.ts          # NEW: Distribution export utilities
│
├── supabase/
│   ├── functions/                         # Edge Functions
│   │   ├── _shared/                       # Shared utilities
│   │   │   ├── auth.ts                    # NEW: API authentication middleware
│   │   │   ├── rateLimit.ts               # NEW: Rate limiting middleware
│   │   │   ├── webhookRetry.ts            # NEW: Webhook retry utility
│   │   │   ├── keyGenerator.ts            # NEW: API key generation
│   │   │   ├── platformService.ts         # NEW: Platform integration base
│   │   │   ├── errorHandler.ts            # NEW: Error handling
│   │   │   ├── logger.ts                  # NEW: Logging utility
│   │   │   ├── storage.ts                 # NEW: Album art storage
│   │   │   ├── trackUsage.ts              # NEW: API usage tracking
│   │   │   ├── tokenBucket.ts             # NEW: Token bucket algorithm
│   │   │   ├── rateLimitHeaders.ts        # NEW: Rate limit headers
│   │   │   ├── rateLimitError.ts          # NEW: Rate limit error handler
│   │   │   ├── webhookSignature.ts        # NEW: HMAC signature generation
│   │   │   ├── oauthScopes.ts             # NEW: OAuth scope validation
│   │   │   ├── analytics.ts               # NEW: Analytics middleware
│   │   │   ├── validation.ts              # NEW: Zod validation
│   │   │   └── cors.ts                    # NEW: CORS configuration
│   │   ├── integrations/                  # NEW: Platform integrations
│   │   │   ├── distrokid.ts
│   │   │   ├── soundcloud.ts
│   │   │   ├── apple-music.ts
│   │   │   ├── spotify.ts
│   │   │   └── youtube-music.ts
│   │   ├── api/                           # NEW: RESTful API endpoints
│   │   │   ├── create-key/
│   │   │   │   └── index.ts
│   │   │   ├── revoke-key/
│   │   │   │   └── index.ts
│   │   │   ├── list-keys/
│   │   │   │   └── index.ts
│   │   │   └── v1/
│   │   │       ├── generate/
│   │   │       │   └── index.ts
│   │   │       ├── tracks/
│   │   │       │   ├── index.ts
│   │   │       │   ├── [id]/
│   │   │       │   │   ├── index.ts
│   │   │       │   │   └── delete.ts
│   │   │       ├── playlists/
│   │   │       │   ├── index.ts
│   │   │       │   └── create.ts
│   │   │       ├── user/
│   │   │       │   └── profile.ts
│   │   │       └── usage/
│   │   │           └── stats.ts
│   │   ├── webhooks/                      # NEW: Webhook system
│   │   │   ├── register/
│   │   │   │   └── index.ts
│   │   │   ├── delete/
│   │   │   │   └── index.ts
│   │   │   ├── test/
│   │   │   │   └── index.ts
│   │   │   └── deliver/
│   │   │       └── index.ts
│   │   ├── oauth/                         # NEW: OAuth 2.0
│   │   │   ├── authorize/
│   │   │   │   └── index.ts
│   │   │   └── token/
│   │   │       └── index.ts
│   │   ├── generate-album-art/            # NEW: Album art generation
│   │   │   └── index.ts
│   │   ├── initiate-distribution/         # NEW: Distribution management
│   │   │   └── index.ts
│   │   ├── distribution-webhook/          # NEW: Distribution status webhook
│   │   │   └── index.ts
│   │   ├── retry-distribution/            # NEW: Distribution retry
│   │   │   └── index.ts
│   │   ├── send-distribution-notification/ # NEW: Distribution notifications
│   │   │   └── index.ts
│   │   └── api-docs/                      # NEW: API documentation hosting
│   │       └── index.ts
│   ├── migrations/                        # Database migrations
│   │   ├── YYYYMMDD_create_distributions.sql
│   │   ├── YYYYMMDD_create_api_keys.sql
│   │   ├── YYYYMMDD_create_webhooks.sql
│   │   ├── YYYYMMDD_create_webhook_deliveries.sql
│   │   ├── YYYYMMDD_distributions_rls.sql
│   │   ├── YYYYMMDD_api_keys_rls.sql
│   │   ├── YYYYMMDD_webhooks_rls.sql
│   │   ├── YYYYMMDD_platform_integration_indexes.sql
│   │   ├── YYYYMMDD_tracks_distribution.sql
│   │   ├── YYYYMMDD_rate_limits.sql
│   │   ├── YYYYMMDD_oauth_clients.sql
│   │   └── YYYYMMDD_api_analytics.sql
│   └── ...
│
├── sdks/                                  # NEW: SDK libraries
│   ├── javascript/
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── resources/
│   │   │   │   ├── generation.ts
│   │   │   │   ├── tracks.ts
│   │   │   │   └── playlists.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   └── python/
│       ├── aimusicverse/
│       │   ├── client.py
│       │   ├── resources/
│       │   │   ├── generation.py
│       │   │   ├── tracks.py
│       │   │   └── playlists.py
│       │   └── types.py
│       ├── tests/
│       ├── pyproject.toml
│       └── README.md
│
├── docs/                                  # NEW: API documentation
│   ├── api/
│   │   ├── openapi.yaml
│   │   ├── getting-started.md
│   │   ├── authentication.md
│   │   ├── webhooks.md
│   │   ├── versioning.md
│   │   └── examples/
│   │       ├── generate-music.js
│   │       ├── generate-music.py
│   │       ├── webhook-verification.js
│   │       └── webhook-verification.py
│   └── troubleshooting/
│       └── platforms.md
│
├── examples/                              # NEW: SDK usage examples
│   ├── javascript/
│   │   └── quickstart.js
│   └── python/
│       └── quickstart.py
│
└── tests/
    ├── integration/
    │   ├── api/                           # NEW: API integration tests
    │   │   ├── generate.test.ts
    │   │   ├── tracks.test.ts
    │   │   └── auth.test.ts
    │   └── webhooks/                      # NEW: Webhook tests
    │       └── delivery.test.ts
    ├── e2e/
    │   ├── distribution.spec.ts           # NEW: Distribution E2E tests
    │   └── api-generation.spec.ts         # NEW: API generation E2E tests
    └── unit/
        └── rateLimit.test.ts              # NEW: Rate limiting unit tests
```

---

## Database Schema

### New Tables for Sprint 014

#### 1. `distributions` Table

```sql
CREATE TABLE distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  platforms TEXT[] NOT NULL,  -- ['spotify', 'apple_music', 'soundcloud', 'youtube_music']
  status TEXT NOT NULL CHECK (status IN ('pending', 'uploading', 'processing', 'live', 'failed', 'scheduled')),
  release_date TIMESTAMPTZ,  -- NULL for immediate release
  metadata JSONB NOT NULL DEFAULT '{}',  -- DistributionMetadata
  external_ids JSONB DEFAULT '{}',  -- {spotify: 'uri:...', soundcloud: 'permalink'}
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_distributions_user_id ON distributions(user_id);
CREATE INDEX idx_distributions_track_id ON distributions(track_id);
CREATE INDEX idx_distributions_status ON distributions(status);
CREATE INDEX idx_distributions_release_date ON distributions(release_date) WHERE release_date IS NOT NULL;
```

**RLS Policies**:
```sql
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own distributions"
  ON distributions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own distributions"
  ON distributions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own distributions"
  ON distributions FOR UPDATE
  USING (auth.uid() = user_id);
```

#### 2. `api_keys` Table

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,  -- User-friendly name (e.g., "Production App")
  key_prefix TEXT NOT NULL,  -- First 12 chars: "amv_live_abc"
  key_hash TEXT NOT NULL,  -- bcrypt hash of full key
  scopes TEXT[] NOT NULL DEFAULT '{}',  -- ['generate:write', 'tracks:read']
  rate_limit_tier TEXT NOT NULL DEFAULT 'free' CHECK (rate_limit_tier IN ('free', 'pro', 'enterprise')),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true NOT NULL
);

CREATE UNIQUE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active) WHERE is_active = true;
```

**RLS Policies**:
```sql
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);
```

#### 3. `webhooks` Table

```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,  -- HTTPS required
  events TEXT[] NOT NULL,  -- ['generation.completed', 'generation.failed']
  secret TEXT NOT NULL,  -- For HMAC-SHA256 signature
  is_active BOOLEAN DEFAULT true NOT NULL,
  failure_count INTEGER DEFAULT 0 NOT NULL,
  last_delivery_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT webhooks_url_check CHECK (url LIKE 'https://%')
);

CREATE INDEX idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX idx_webhooks_is_active ON webhooks(is_active) WHERE is_active = true;
```

**RLS Policies**:
```sql
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own webhooks"
  ON webhooks FOR ALL
  USING (auth.uid() = user_id);
```

#### 4. `webhook_deliveries` Table

```sql
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempt_count INTEGER DEFAULT 1 NOT NULL,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_event_type ON webhook_deliveries(event_type);
CREATE INDEX idx_webhook_deliveries_created_at ON webhook_deliveries(created_at DESC);
```

**RLS Policies**:
```sql
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhook deliveries"
  ON webhook_deliveries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM webhooks
    WHERE webhooks.id = webhook_deliveries.webhook_id
    AND webhooks.user_id = auth.uid()
  ));
```

#### 5. `rate_limits` Table

```sql
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT UNIQUE NOT NULL CHECK (tier IN ('free', 'pro', 'enterprise')),
  requests_per_hour INTEGER NOT NULL,
  requests_per_day INTEGER NOT NULL,
  burst_limit INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

INSERT INTO rate_limits (tier, requests_per_hour, requests_per_day, burst_limit) VALUES
  ('free', 10, 100, 15),
  ('pro', 100, 5000, 150),
  ('enterprise', 1000, 50000, 1500);
```

#### 6. `oauth_clients` Table

```sql
CREATE TABLE oauth_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT UNIQUE NOT NULL,
  client_secret TEXT NOT NULL,  -- bcrypt hash
  name TEXT NOT NULL,
  logo_url TEXT,
  redirect_uris TEXT[] NOT NULL,
  scopes TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL
);

CREATE INDEX idx_oauth_clients_client_id ON oauth_clients(client_id);
```

#### 7. `oauth_tokens` Table

```sql
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id TEXT REFERENCES oauth_clients(client_id) ON DELETE CASCADE NOT NULL,
  access_token TEXT UNIQUE NOT NULL,
  refresh_token TEXT UNIQUE NOT NULL,
  scopes TEXT[] NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  refresh_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_oauth_tokens_user_id ON oauth_tokens(user_id);
CREATE INDEX idx_oauth_tokens_access_token ON oauth_tokens(access_token);
CREATE INDEX idx_oauth_tokens_refresh_token ON oauth_tokens(refresh_token);
```

#### 8. `api_analytics` Table

```sql
CREATE TABLE api_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_api_analytics_api_key_id ON api_analytics(api_key_id);
CREATE INDEX idx_api_analytics_endpoint ON api_analytics(endpoint);
CREATE INDEX idx_api_analytics_created_at ON api_analytics(created_at DESC);

-- Partition by month for performance
CREATE TABLE api_analytics_y2026m03 PARTITION OF api_analytics
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
```

#### 9. Update `tracks` Table

```sql
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS distribution_status TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS external_platform_ids JSONB DEFAULT '{}';

CREATE INDEX idx_tracks_distribution_status ON tracks(distribution_status)
  WHERE distribution_status IS NOT NULL;
```

---

## API Design

### RESTful API Endpoints

**Base URL**: `https://api.aimusicverse.com/v1`

#### Authentication

**API Key Authentication**:
```http
GET /api/v1/tracks
X-API-Key: amv_live_abc123def456ghi789jkl012mno345pqr
```

**OAuth 2.0 Bearer Token**:
```http
GET /api/v1/tracks
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Endpoints Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/generate` | Generate music from prompt | API Key or OAuth |
| GET | `/api/v1/tracks` | List user's tracks (paginated) | API Key or OAuth |
| GET | `/api/v1/tracks/:id` | Get single track | API Key or OAuth |
| DELETE | `/api/v1/tracks/:id` | Delete track | API Key or OAuth |
| GET | `/api/v1/playlists` | List user's playlists | API Key or OAuth |
| POST | `/api/v1/playlists` | Create playlist | API Key or OAuth |
| GET | `/api/v1/user/profile` | Get user profile | API Key or OAuth |
| GET | `/api/v1/usage/stats` | Get API usage stats | API Key |
| POST | `/webhooks/register` | Register webhook | API Key |
| DELETE | `/webhooks/:id` | Delete webhook | API Key |
| POST | `/webhooks/test` | Test webhook delivery | API Key |

### Example Request/Response

**POST /api/v1/generate**:

Request:
```json
{
  "prompt": "epic orchestral battle music with drums and strings",
  "duration": 180,
  "style": "cinematic",
  "tags": ["epic", "orchestral", "intense"],
  "make_instrumental": false,
  "wait_audio": true
}
```

Response (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "prompt": "epic orchestral battle music with drums and strings",
  "estimated_completion_seconds": 120,
  "created_at": "2026-03-15T10:30:00Z",
  "tracks": null
}
```

### Rate Limit Headers

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1710504000
Retry-After: 3600
```

---

## Platform Integration Architecture

### Adapter Pattern for Platform Services

**Base Platform Service** (`supabase/functions/_shared/platformService.ts`):

```typescript
export abstract class PlatformService {
  abstract authenticate(): Promise<void>;
  abstract uploadTrack(track: Track, metadata: DistributionMetadata): Promise<string>;
  abstract getUploadStatus(externalId: string): Promise<DistributionStatus>;
  abstract deleteTrack(externalId: string): Promise<void>;
  
  protected async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
    throw new Error('Max retry attempts exceeded');
  }
}
```

**SoundCloud Implementation** (`supabase/functions/integrations/soundcloud.ts`):

```typescript
export class SoundCloudService extends PlatformService {
  private clientId: string;
  private clientSecret: string;
  private accessToken?: string;

  async authenticate(): Promise<void> {
    // OAuth 2.0 client credentials flow
    const response = await fetch('https://api.soundcloud.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });
    const { access_token } = await response.json();
    this.accessToken = access_token;
  }

  async uploadTrack(track: Track, metadata: DistributionMetadata): Promise<string> {
    const formData = new FormData();
    formData.append('track[title]', metadata.title);
    formData.append('track[description]', metadata.description || '');
    formData.append('track[genre]', metadata.genre);
    formData.append('track[tag_list]', metadata.tags.join(' '));
    formData.append('track[asset_data]', await fetch(track.audio_url).then(r => r.blob()));
    
    if (metadata.album_art_url) {
      formData.append('track[artwork_data]', await fetch(metadata.album_art_url).then(r => r.blob()));
    }

    const response = await fetch('https://api.soundcloud.com/tracks', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
      body: formData,
    });

    const { permalink_url } = await response.json();
    return permalink_url;
  }
}
```

---

## Webhook System Architecture

### Webhook Delivery Flow

```
1. Event occurs (e.g., generation completed)
   ↓
2. Edge Function triggers webhook delivery worker
   ↓
3. Query active webhooks subscribed to event type
   ↓
4. For each webhook:
   - Generate HMAC-SHA256 signature
   - Send POST request with payload
   - Log delivery attempt
   ↓
5. On failure:
   - Increment failure_count
   - Schedule retry with exponential backoff
   - Auto-disable after 10 consecutive failures
```

### Webhook Signature Generation

**Server-side** (`supabase/functions/_shared/webhookSignature.ts`):

```typescript
import { createHmac } from 'crypto';

export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  return createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}
```

**Client-side verification** (JavaScript):

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Webhook Payload Example

**Event: `generation.completed`**:

```json
{
  "event": "generation.completed",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-03-15T10:32:00Z",
  "data": {
    "generation_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "tracks": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "title": "Epic Battle Theme",
        "audio_url": "https://storage.aimusicverse.com/tracks/...",
        "duration": 180,
        "created_at": "2026-03-15T10:32:00Z"
      }
    ],
    "user_id": "770e8400-e29b-41d4-a716-446655440002"
  }
}
```

---

## SDK Architecture

### JavaScript SDK Structure

**Client Initialization** (`sdks/javascript/src/client.ts`):

```typescript
import axios, { AxiosInstance } from 'axios';
import { GenerationResource } from './resources/generation';
import { TracksResource } from './resources/tracks';

export interface ClientOptions {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}

export class AIMusicVerseClient {
  private http: AxiosInstance;
  public generation: GenerationResource;
  public tracks: TracksResource;

  constructor(options: ClientOptions) {
    this.http = axios.create({
      baseURL: options.baseURL || 'https://api.aimusicverse.com/v1',
      timeout: options.timeout || 30000,
      headers: {
        'X-API-Key': options.apiKey,
        'Content-Type': 'application/json',
      },
    });

    this.generation = new GenerationResource(this.http);
    this.tracks = new TracksResource(this.http);
  }
}
```

**Generation Resource** (`sdks/javascript/src/resources/generation.ts`):

```typescript
import { AxiosInstance } from 'axios';

export interface GenerateRequest {
  prompt: string;
  duration?: number;
  style?: string;
  tags?: string[];
  wait_audio?: boolean;
}

export class GenerationResource {
  constructor(private http: AxiosInstance) {}

  async create(request: GenerateRequest): Promise<Generation> {
    const { data } = await this.http.post('/generate', request);
    return data;
  }

  async get(id: string): Promise<Generation> {
    const { data } = await this.http.get(`/generation/${id}`);
    return data;
  }
}
```

### Python SDK Structure

**Client Initialization** (`sdks/python/aimusicverse/client.py`):

```python
import httpx
from typing import Optional
from .resources.generation import GenerationResource
from .resources.tracks import TracksResource

class AIMusicVerseClient:
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.aimusicverse.com/v1",
        timeout: int = 30
    ):
        self._http = httpx.Client(
            base_url=base_url,
            timeout=timeout,
            headers={
                "X-API-Key": api_key,
                "Content-Type": "application/json"
            }
        )
        self.generation = GenerationResource(self._http)
        self.tracks = TracksResource(self._http)

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self._http.close()
```

---

## Security Considerations

### API Key Security

1. **Generation**: Cryptographically secure random bytes (32+)
2. **Storage**: bcrypt hash (cost factor 12)
3. **Display**: Show only prefix (first 12 chars)
4. **Rotation**: User-initiated, instant revocation
5. **Monitoring**: Track unusual usage patterns

### OAuth 2.0 Security

1. **State parameter**: CSRF protection
2. **PKCE**: Proof Key for Code Exchange (S256)
3. **Token expiration**: Access token 1h, refresh 30d
4. **Scope validation**: Least privilege principle
5. **Redirect URI validation**: Exact match required

### Webhook Security

1. **HTTPS only**: Enforce TLS 1.2+
2. **HMAC signature**: SHA-256 with secret
3. **Timing-safe comparison**: Prevent timing attacks
4. **Secret rotation**: User-initiated rotation
5. **IP allowlist**: Optional IP-based filtering

---

## Performance Optimization

### Rate Limiting Implementation

**Token Bucket Algorithm** (`supabase/functions/_shared/tokenBucket.ts`):

```typescript
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number // tokens per second
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  consume(amount: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= amount) {
      this.tokens -= amount;
      return true;
    }
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  getRemainingTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  getResetTime(): number {
    const tokensNeeded = this.capacity - this.tokens;
    const secondsToRefill = tokensNeeded / this.refillRate;
    return Date.now() + (secondsToRefill * 1000);
  }
}
```

### Webhook Delivery Optimization

1. **Queue System**: Use Supabase Queue or pg_cron for background processing
2. **Batch Processing**: Group deliveries by destination
3. **Connection Pooling**: Reuse HTTP connections
4. **Timeout Handling**: 30s max per delivery attempt
5. **Circuit Breaker**: Pause deliveries to failing endpoints

---

## Testing Strategy

### Unit Tests (Vitest)

```typescript
// tests/unit/rateLimit.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { TokenBucket } from '../src/utils/tokenBucket';

describe('TokenBucket', () => {
  let bucket: TokenBucket;

  beforeEach(() => {
    bucket = new TokenBucket(10, 1); // 10 capacity, 1 token/sec
  });

  it('should allow consumption within capacity', () => {
    expect(bucket.consume(5)).toBe(true);
    expect(bucket.getRemainingTokens()).toBe(5);
  });

  it('should deny consumption exceeding capacity', () => {
    bucket.consume(10);
    expect(bucket.consume(1)).toBe(false);
  });

  it('should refill tokens over time', async () => {
    bucket.consume(10);
    await new Promise(resolve => setTimeout(resolve, 2000));
    expect(bucket.getRemainingTokens()).toBeGreaterThanOrEqual(2);
  });
});
```

### Integration Tests (Supertest)

```typescript
// tests/integration/api/generate.test.ts
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('POST /api/v1/generate', () => {
  it('should generate music with valid API key', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const response = await fetch(`${API_URL}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'X-API-Key': TEST_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'test music',
        duration: 30,
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data.status).toBe('processing');
  });

  it('should enforce rate limits', async () => {
    // Make 11 requests (free tier limit is 10/hour)
    for (let i = 0; i < 11; i++) {
      const response = await fetch(`${API_URL}/api/v1/generate`, {
        method: 'POST',
        headers: { 'X-API-Key': TEST_API_KEY },
        body: JSON.stringify({ prompt: 'test' }),
      });

      if (i < 10) {
        expect(response.status).toBe(201);
      } else {
        expect(response.status).toBe(429);
        expect(response.headers.get('Retry-After')).toBeDefined();
      }
    }
  });
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/distribution.spec.ts
import { test, expect } from '@playwright/test';

test('complete distribution flow', async ({ page }) => {
  // Login
  await page.goto('/');
  await page.click('text=Login');
  // ... Telegram auth flow ...

  // Navigate to track
  await page.goto('/tracks/550e8400-e29b-41d4-a716-446655440000');
  
  // Open distribution dialog
  await page.click('text=Export to Platforms');
  
  // Select SoundCloud
  await page.click('[data-platform="soundcloud"]');
  
  // Fill metadata
  await page.fill('[name="title"]', 'Test Track');
  await page.fill('[name="artist"]', 'Test Artist');
  await page.fill('[name="genre"]', 'Electronic');
  
  // Generate album art
  await page.click('text=Generate Album Art');
  await page.fill('[name="albumArtPrompt"]', 'abstract colorful waves');
  await page.click('text=Generate');
  
  // Wait for album art
  await expect(page.locator('img[alt="Generated Album Art"]')).toBeVisible();
  
  // Start distribution
  await page.click('text=Start Distribution');
  
  // Verify status updates
  await expect(page.locator('text=Uploading...')).toBeVisible();
  await expect(page.locator('text=Live on SoundCloud')).toBeVisible({ timeout: 60000 });
  
  // Verify external link
  const soundcloudLink = page.locator('a[href*="soundcloud.com"]');
  await expect(soundcloudLink).toBeVisible();
});
```

---

## Monitoring & Alerting

### Key Metrics to Track

**Distribution System**:
- Distribution success rate (target: >95%)
- Average upload duration (target: <60s)
- Album art generation time (target: <30s)
- Platform API error rate (target: <2%)
- Webhook delivery latency (target: <5s)

**API System**:
- API response time (p50/p95/p99)
- API error rate (target: <1%)
- Rate limit hit rate (target: <5%)
- Webhook delivery success rate (target: >98%)
- OAuth authorization success rate (target: >95%)

**Business Metrics**:
- API key creation rate
- SDK download rate (npm + PyPI)
- Distribution platform usage distribution
- API calls per endpoint
- User churn rate

### Alerting Rules

**Critical Alerts** (PagerDuty):
- API error rate > 5% for 5 minutes
- Distribution success rate < 80% for 15 minutes
- Webhook delivery failure rate > 10% for 10 minutes
- Database connection pool exhausted

**Warning Alerts** (Slack):
- API response time p95 > 1s for 10 minutes
- Album art generation time > 60s (p95)
- Rate limit hit rate > 10%
- OAuth failure rate > 10%

### Observability Stack

- **Logs**: Supabase Edge Functions logs + structured logging
- **Metrics**: Prometheus + Grafana (or Supabase built-in)
- **Traces**: OpenTelemetry for distributed tracing
- **Errors**: Sentry for error tracking
- **Uptime**: Pingdom or StatusCake for endpoint monitoring

---

## Deployment Strategy

### Feature Flags

Use Supabase feature flags or custom implementation:

```sql
CREATE TABLE feature_flags (
  name TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO feature_flags (name, enabled, rollout_percentage) VALUES
  ('streaming_export', false, 0),
  ('api_v1', false, 0),
  ('webhooks', false, 0);
```

### Gradual Rollout

1. **Day 1**: Enable for internal team (rollout_percentage = 0, specific user IDs)
2. **Day 2**: Enable for 10% of users (rollout_percentage = 10)
3. **Day 3**: Monitor metrics, fix critical issues
4. **Day 4**: Enable for 50% of users (rollout_percentage = 50)
5. **Day 5**: Final monitoring, enable for 100% (rollout_percentage = 100)

### Rollback Plan

1. **Feature flags**: Instant disable via database update
2. **Database migrations**: Reversible with down migrations
3. **Edge Functions**: Deploy previous version from git history
4. **Frontend**: Roll back to previous Vercel deployment
5. **Communication**: Status page update + user notification

---

## Documentation Plan

### API Documentation Structure

1. **Getting Started**: Quickstart guide (5 min to first API call)
2. **Authentication**: API keys vs. OAuth 2.0 guide
3. **Endpoints**: Reference for all endpoints with examples
4. **Webhooks**: Setup guide with signature verification
5. **Rate Limiting**: Tier comparison, headers explanation
6. **SDKs**: Installation and usage for JS/Python
7. **Errors**: Error code reference with troubleshooting
8. **Changelog**: Version history with migration guides

### User Documentation

1. **Streaming Export Guide**: Platform-by-platform setup
2. **Metadata Best Practices**: ISRC, UPC, genre guidelines
3. **Album Art Generation**: Tips for prompts, upload requirements
4. **Troubleshooting**: Common issues and solutions
5. **Video Tutorials**: Screen recordings for key workflows

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-12  
**Next Review**: 2026-02-28 (before sprint start)
