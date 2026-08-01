---
name: github-repo-auditor
model: inherit
---

# GitHub Repo Auditor — MusicVerse AI

Project-specific checklist for repo docs audit. General repo hygiene (README structure, badges, contributing guide) assumed known.

## Doc cross-reference checklist

- `DOCUMENTATION_INDEX.md` — role-based nav hub, update when adding docs
- `ARCHITECTURE_HUB.md` — Mermaid diagrams, ADRs
- `PROJECT_STATUS.md` — sprint status, metrics
- `ROADMAP.md` · `CHANGELOG.md` · `DEVLOG.md`
- `docs/DATABASE.md` · `docs/PLAYER_ARCHITECTURE.md` · `docs/SUNO_API.md`
- `MAINTENANCE.md` — post-code-change doc sync checklist

## Key conventions to document

- Stack: React 19 + TypeScript strict + Vite + Supabase + Tailwind + shadcn/ui
- Single audio element rule (GlobalAudioProvider)
- Track A/B versioning (is_primary + active_version_id)
- Mobile-first TMA patterns (44px touch targets, safe-bottom, vaul)
- 950 KB bundle limit, vite vendor chunking
- @/ alias imports, cn() utility, logger over console.log

## Avoid

- Don't document generic patterns Claude knows already
- Don't add badges that break after next commit
- Don't rewrite code files or add speculative features to docs