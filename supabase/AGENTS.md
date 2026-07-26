# Lovable Cloud Backend

## Purpose

- Owns backend functions, migrations, database access contracts, storage buckets, callback processing, and scheduled recovery flows.

## Ownership

- Edge functions validate auth/input, call external providers, write durable task/version state, and return CORS-safe JSON responses.
- Migrations own schema/RLS/GRANT changes.

## Local Contracts

- Public-schema table creation must include GRANTs before RLS policies in the same migration.
- Suno replacement callbacks must create a `track_versions` row for every playable returned clip and preserve skip reasons for unusable clips.
- Recovery jobs must mirror callback version-creation semantics so completed replacement tasks can be healed without losing A/B variants.
- Track/version writes in callbacks and recovery jobs must check the returned error and log it; silent write failures are forbidden because they leave tracks unplayable with no diagnostic trail.
- No generation may stay in a transient state indefinitely: `public.expire_stale_generations(timeout_minutes)` (pg_cron job `expire-stale-generations`, every 10 min, plus the tail of `sync-stale-tasks`) completes tracks that already have audio and fails the rest with a user-readable message.



## Work Guidance

- Use shared auth, CORS, logger, backend client, and Suno clip field helpers.
- Never expose backend secrets in code, logs, responses, or user-facing messages.

## Verification

- For backend behavior changes, verify the affected callback/recovery path with focused code review or existing function tests when available.

## Child DOX Index

- `functions/` — Edge functions and shared function utilities.
- `migrations/` — Database schema, RLS, grants, indexes, functions, and scheduled jobs.