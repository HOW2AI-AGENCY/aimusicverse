# MusicVerse AI — MCP Server

MusicVerse AI ships a first-class **Model Context Protocol (MCP)** server so
AI assistants (ChatGPT, Claude, Codex, Cursor, Lovable itself, …) can search
the public catalog, manage the signed-in user's library, and start real music
generations from a chat window.

The server is authored with [`@lovable.dev/mcp-js`](https://www.npmjs.com/package/@lovable.dev/mcp-js)
and served by a single Supabase Edge Function generated at build time from the
sources in [`src/lib/mcp/`](../src/lib/mcp).

- **Endpoint (prod)** — `https://<project-ref>.supabase.co/functions/v1/mcp`
- **Auth** — Supabase OAuth 2.1 (dynamic client registration).
  The consent screen lives at [`/.lovable/oauth/consent`](../src/pages/OAuthConsent.tsx).
- **Public tools** work without login, using anon-key Supabase access.
- **Authenticated tools** run as the connected user, so RLS applies exactly as
  it does in the app UI.

---

## Architecture

```text
+----------------------------+          POST /functions/v1/mcp
|  AI client                 |  ─────────────────────────────────► +-------------------+
|  (ChatGPT / Claude / …)    |                                     | Supabase Edge Fn  |
+----------------------------+  ◄─────────────────────────────────  |  supabase/        |
        │                        Streamable HTTP / SSE              |  functions/mcp/   |
        │                                                           +---------┬---------+
        │ OAuth 2.1 (DCR + consent)                                            │
        ▼                                                                      │
  /.lovable/oauth/consent  ──► Supabase Auth issues token ──► attached as ─────┘
                                                              Bearer <token>
```

- The Vite plugin [`@lovable.dev/mcp-js/stacks/supabase/vite`](../vite.config.ts)
  bundles [`src/lib/mcp/index.ts`](../src/lib/mcp/index.ts) and every imported
  tool file into `supabase/functions/mcp/index.ts` on every build. **Do not
  hand-edit that file** — it carries an `AUTO-GENERATED` banner and is
  overwritten on the next build.
- The Edge Function validates every bearer token against the direct Supabase
  issuer (`https://<ref>.supabase.co/auth/v1`), never the `.lovable.cloud`
  proxy — see the comment in [`src/lib/mcp/index.ts`](../src/lib/mcp/index.ts).
- Authenticated tools forward the verified token straight to a per-request
  Supabase client so RLS runs as the user; no service-role key is ever used.

---

## Tool catalog

Alphabetical, grouped by auth requirement. Every tool returns both a
human-readable text block and a `structuredContent` object suitable for
programmatic use.

### Public tools (no login)

| Tool                    | Purpose                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `search_public_tracks`  | Full-text search over the public catalog (title / genre / mood / prompt).           |
| `get_track`             | Fetch a single public, completed track by id.                                       |
| `get_track_stems`       | List the isolated stems (vocals, drums, bass, other) available for a public track.  |
| `list_track_versions`   | List A/B versions of a public track with cover, audio URL and `is_primary` flag.    |
| `get_public_profile`    | Look up a user's public profile by `username` or `user_id` via `safe_public_profiles`. |
| `list_track_comments`   | Read moderated top-level comments on a public track (pass `parent_id` for a thread).|

### Authenticated tools (OAuth — act as the signed-in user)

| Tool                        | Purpose                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| `get_my_profile`            | The signed-in user's profile (display name, username, avatar, bio, public flag).              |
| `get_my_credits`            | Current credit balance + gamification stats.                                                  |
| `list_my_tracks`            | List the user's own tracks (any status).                                                      |
| `list_my_playlists`         | List the user's playlists.                                                                    |
| `create_playlist`           | Create a new playlist owned by the user.                                                      |
| `add_track_to_playlist`     | Append a track to one of the user's playlists.                                                |
| `remove_track_from_playlist`| Remove a track from one of the user's playlists.                                              |
| `like_track`                | Like / unlike a public track. Idempotent.                                                     |
| `follow_user`               | Follow / unfollow another MusicVerse AI user. Idempotent, and refuses self-follows.           |
| `switch_active_version`     | Switch a track's active A/B version. Updates `is_primary` and `active_version_id` atomically. |
| `generate_track`            | Start a real Suno generation. **Consumes credits.** Returns the async task id.                |
| `get_generation_status`     | Poll a generation task: pending → processing → streaming\_ready → completed / failed.         |

> `generate_track` and `switch_active_version` are the only tools with
> `readOnlyHint: false` **and** significant side effects. Both go through the
> same server logic used by the app UI (credit checks, secure RPC updates), so
> RLS + the credit ledger stay authoritative.

---

## Usage recipes

### Anonymous browse

```text
1. search_public_tracks({ query: "lo-fi", limit: 5 })
2. get_track({ track_id: "<uuid>" })
3. get_track_stems({ track_id: "<uuid>" })      # if the caller wants stems
```

### Generate a track from chat

```text
1. get_my_credits()                             # confirm balance
2. generate_track({
     prompt: "Dreamy synthwave with breathy female vocals",
     model:  "V5_5",
     custom: true,
     title:  "Neon Drive"
   })
   → { task_id }
3. get_generation_status({ task_id })           # poll until status = "completed"
4. list_track_versions({ track_id })            # A/B versions once ready
5. switch_active_version({ track_id, version_id })   # optional: choose B
```

### Curate a library

```text
1. list_my_playlists()
2. create_playlist({ title: "Late night", is_public: false })
3. search_public_tracks({ query: "ambient", limit: 10 })
4. add_track_to_playlist({ playlist_id, track_id })
5. like_track({ track_id, action: "like" })
6. follow_user({ user_id, action: "follow" })
```

---

## Connecting a client

Any Streamable-HTTP MCP client works. Point it at
`https://<project-ref>.supabase.co/functions/v1/mcp` and let it drive OAuth.

**ChatGPT / Claude / Cursor:** paste the endpoint URL when adding a custom
connector; the client discovers DCR + the authorization endpoint automatically,
opens the consent page, and stores the resulting token.

**Programmatic clients** must send:

```
Content-Type: application/json
Accept: application/json, text/event-stream
Authorization: Bearer <supabase-access-token>
```

Missing `Accept` returns HTTP 406 (spec requirement); missing / invalid
`Authorization` returns 401.

---

## Security model

- Every authenticated tool checks `ctx.isAuthenticated()` before touching the
  database.
- Handlers **never** accept `user_id` from tool input for privileged writes —
  they read it from the verified token (`ctx.getUserId()`).
- The token is forwarded to Supabase as a bearer header only. It is never
  returned to the model, logged, or persisted.
- No `SUPABASE_SERVICE_ROLE_KEY` is referenced anywhere under `src/lib/mcp/`.
  Public tools use the anon key; authenticated tools use the user's token.
- Consent flow validates the `next` redirect as same-origin before honoring it,
  so a malicious authorization request cannot redirect the browser off-app.

---

## Local development

```bash
# 1. Ensure @lovable.dev/mcp-js is installed
npm install

# 2. Run Vite — the plugin regenerates supabase/functions/mcp/index.ts on save
npm run dev

# 3. In another shell, serve the edge function locally without JWT gating so
#    the SDK's own OAuth verifier can inspect the token.
supabase functions serve mcp --no-verify-jwt
```

After editing any file under `src/lib/mcp/`:

1. `npm run build` (or let `vite dev` rebuild) — regenerates the function file.
2. Run the Lovable tool `app_mcp_server--extract_mcp_manifest` — this is the
   same check CI runs, and it validates every tool's Zod schema and metadata.
3. Deploy: `supabase--deploy_edge_functions` with `function_names: ["mcp"]`
   (connected clients keep hitting the previous version until this ships).

---

## Adding a new tool

1. Create `src/lib/mcp/tools/<my-tool>.ts` — one `defineTool` default export.
   Set an honest `title`, `description`, and `annotations`
   (`readOnlyHint`, `destructiveHint`, `idempotentHint`).
2. For authenticated writes, always:
   - guard with `ctx.isAuthenticated()`,
   - build the Supabase client with `Authorization: Bearer ${ctx.getToken()}`,
   - use `ctx.getUserId()` as the effective user id — never trust input.
3. Import the tool in [`src/lib/mcp/index.ts`](../src/lib/mcp/index.ts) and add
   it to the `tools` array.
4. Rebuild, re-run the manifest extractor, redeploy the `mcp` function.

The entry file is import-safe by contract: **no** `process.env` reads, I/O, or
throws at module top level. Read secrets inside the handler (or a lazy getter)
where the request env is available.

---

## Troubleshooting

| Symptom                                                | Cause / fix                                                                                    |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `HTTP 406 Not Acceptable`                              | Missing `Accept: application/json, text/event-stream` on the client request.                   |
| `HTTP 401` on every tool                               | Bearer token missing, expired, or issued by the wrong issuer. Re-run OAuth from the client.    |
| Tool changes not visible in the client                 | Function not redeployed — run `supabase--deploy_edge_functions ["mcp"]` and reconnect.         |
| "Refusing to overwrite user-authored file" during build| Someone hand-edited `supabase/functions/mcp/index.ts`. Revert it; author changes in `src/lib/mcp/`. |
| Consent screen bounces to `/` after Google login       | The `redirect_uri` on the social provider isn't preserving `next`. See `src/pages/OAuthConsent.tsx`. |

---

<sub>Last updated with the v0.4.0 tool set (`follow_user`, `get_public_profile`,
`list_track_comments`).</sub>
