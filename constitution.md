# MusicVerse AI - Project Constitution

**Note:** This file is a reference stub. The complete project constitution is located at:
`.specify/memory/constitution.md`

## Quick Reference

### Key Principles
1. **Quality & Testing** - TDD approach, 80% coverage minimum
2. **Security & Privacy** - Security by design, data minimization
3. **Observability** - Comprehensive logging and monitoring
4. **Incremental Delivery** - Small PRs, semantic versioning
5. **Architectural Simplicity** - KISS, explicit contracts
6. **Performance** - Mobile-first, optimized bundle sizes
7. **i18n & a11y** - 75+ languages, WCAG AA compliance
8. **Telegram-first** - Native UX, deep integration

### Architecture Stack
- **Frontend:** React 19 + TypeScript 5 + Vite
- **Backend:** Lovable Cloud (Supabase-based) - PostgreSQL + Edge Functions
- **State:** Zustand + TanStack Query
- **UI:** Tailwind CSS + shadcn/ui
- **Platform:** Telegram Mini App (@twa-dev/sdk)

### Important Naming Conventions
- Database field: `is_primary` (NOT `is_master`)
- Table: `track_change_log` (NOT `track_changelog`)
- Table: `audio_analysis` (NOT `track_analysis`)
- Backend: "Lovable Cloud" in docs (Supabase SDK in code)

### Key Documents
- Full Constitution: `.specify/memory/constitution.md`
- Naming Conventions: `INFRASTRUCTURE_NAMING_CONVENTIONS.md`
- Copilot Instructions: `.github/copilot-instructions.md`
- Development Workflow: `DEVELOPMENT_WORKFLOW.md`
- Contributing Guide: `CONTRIBUTING.md`

For complete details, principles, and standards, please refer to the full constitution at `.specify/memory/constitution.md`.