# Technical Plan: MusicVerse AI Platform

**Feature Branch**: `main`
**Spec**: [docs/PROJECT_SPECIFICATION.md](PROJECT_SPECIFICATION.md)
**Status**: Approved

## Technical Context

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Shadcn/UI.
- **Backend**: Supabase (Edge Functions, PostgreSQL).
- **AI**: Suno AI v5 API.
- **Platform**: Telegram Mini Apps SDK.

## Constitution Check

- [x] **SpecKit Workflow**: Plan follows the Specify -> Plan -> Implement cycle.
- [x] **TDD**: Plan includes testing steps.
- [x] **Tech Stack**: Aligns with Constitution standards.

## Phase 0: Foundation Repair (CRITICAL)

The audit revealed a critical issue: `package.json` is missing almost all dependencies.

1.  **Reconstruct `package.json`**:
    -   Install React, ReactDOM, Vite, TypeScript.
    -   Install UI libs: `tailwindcss`, `postcss`, `autoprefixer`, `lucide-react`, `clsx`, `tailwind-merge`.
    -   Install State/Data: `@tanstack/react-query`, `react-router-dom`.
    -   Install Supabase: `@supabase/supabase-js`.
    -   Install Telegram: `@twa-dev/sdk` (or equivalent).
    -   Install Dev tools: `@types/*`, `eslint`, `prettier`.
2.  **Verify Build**: Run `npm run build` to ensure the project compiles.

## Phase 1: Core Implementation

1.  **Data Model**:
    -   Verify Supabase tables (`profiles`, `tracks`, `projects`) exist and match requirements.
    -   Create migration files if missing.
2.  **API Integration**:
    -   Implement/Verify Suno API client in Edge Functions.
    -   Ensure secure key management (Env Vars).
3.  **Frontend Core**:
    -   Verify `App.tsx` routing.
    -   Ensure `TelegramProvider` correctly handles authentication.

## Phase 2: Feature Verification

1.  **Generate Flow**:
    -   Test `Generate.tsx` -> Edge Function -> Suno API.
    -   Verify real-time updates (Supabase Realtime).
2.  **Library Flow**:
    -   Test fetching tracks from Supabase.
    -   Test audio playback.

## Phase 3: Polish & Documentation

1.  **Internationalization**:
    -   Verify language switching mechanism.
2.  **Documentation**:
    -   Update `README.md` with correct install instructions (after fixing `package.json`).
