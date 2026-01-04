# Documentation Index

**Last Updated**: 2026-01-04

This is the master index for all MusicVerse AI documentation.

---

## 🎯 Start Here

### Essential Documents
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - ⭐ Single source of truth for project status
- **[README.md](README.md)** - Project overview and getting started
- **[IMPLEMENTATION_ROADMAP_2026.md](IMPLEMENTATION_ROADMAP_2026.md)** - 🆕 Q1-Q2 2026 Implementation plan
- **[ROADMAP.md](ROADMAP.md)** - Product roadmap and future plans
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes

### Quick Navigation
- **New Developers**: Start with [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)
- **Architects**: See [COMPREHENSIVE_ARCHITECTURE.md](docs/COMPREHENSIVE_ARCHITECTURE.md)
- **Contributors**: Read [CONTRIBUTING.md](CONTRIBUTING.md)
- **Mobile Developers**: See [Mobile Optimization Roadmap](docs/mobile/OPTIMIZATION_ROADMAP_2026.md)
- **Database Engineers**: See [Database Optimization Analysis](docs/DATABASE_OPTIMIZATION_ANALYSIS.md)

---

## 📊 Project Management

### Current Status
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Project health & metrics (Single source of truth)
- [SPRINT_STATUS.md](SPRINT_STATUS.md) - Sprint summary and overview
- [SPRINTS/SPRINT-PROGRESS.md](SPRINTS/SPRINT-PROGRESS.md) - Active sprint tracking

### Sprint Management
- [SPRINT_MANAGEMENT.md](SPRINT_MANAGEMENT.md) - Sprint planning process
- [SPRINT_IMPLEMENTATION_GUIDE.md](SPRINT_IMPLEMENTATION_GUIDE.md) - Implementation guide
- [SPRINTS/](SPRINTS/) - Individual sprint plans
- [SPRINTS/completed/](SPRINTS/completed/) - Completed sprints archive

---

## 🏗️ Architecture & Technical

### Architecture Documentation (⭐ NEW)
- **[docs/COMPREHENSIVE_ARCHITECTURE.md](docs/COMPREHENSIVE_ARCHITECTURE.md)** - Complete system architecture (15,000+ lines)
  - System Overview with diagrams
  - Technology Stack (Frontend + Backend)
  - Frontend Architecture (components, routing, hooks)
  - Backend Architecture (edge functions, database)
  - Data Architecture (ERD diagrams, RLS policies)
  - Integration Architecture (Suno AI, Telegram)
  - State Management (Zustand, TanStack Query)
  - Audio Architecture (global provider, stem engine)
  - Security Architecture (authentication, RLS)
  - Performance Optimization (code splitting, caching)
  - Deployment Architecture

### Code Reference (⭐ NEW)
- **[docs/HOOKS_REFERENCE.md](docs/HOOKS_REFERENCE.md)** - Complete hooks reference (6,000+ lines)
  - All 263 custom hooks documented
  - Usage examples for 50+ core hooks
  - Common patterns and best practices
  - Dependency management guidelines

### Development Guides (⭐ NEW)
- **[docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)** - Developer onboarding guide (4,000+ lines)
  - Getting started and environment setup
  - Project structure explained
  - Development workflow
  - Code style & standards
  - Testing (Unit + E2E)
  - Debugging techniques
  - Common tasks with step-by-step instructions
  - Performance guidelines
  - Troubleshooting

### Code Review (⭐ NEW)
- **[docs/CODE_REVIEW_SUMMARY.md](docs/CODE_REVIEW_SUMMARY.md)** - Comprehensive code review
  - Overall assessment and metrics
  - Architecture analysis
  - Performance analysis
  - Security assessment
  - Best practices identified
  - Recommendations for improvements

### Existing Architecture Docs
- [docs/architecture/](docs/architecture/) - System design documents
- [ADR/](ADR/) - Architecture Decision Records
  - ADR-001: Technology Stack Choice
  - ADR-002: Frontend Architecture And Stack
  - ADR-003: Performance Optimization Architecture
  - ADR-004: Audio Playback Optimization
  - ADR-005: State Machine Architecture
  - ADR-006: Type-Safe Audio Context

### Development & Workflow
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contributing guidelines
- [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) - Development workflow
- [MAINTENANCE.md](MAINTENANCE.md) - Maintenance procedures
- [SECURITY.md](SECURITY.md) - Security practices

---

## 📖 Technical Guides

### Core Systems
- [docs/GENERATION_SYSTEM.md](docs/GENERATION_SYSTEM.md) - Music generation system
- [docs/PLAYER_ARCHITECTURE.md](docs/PLAYER_ARCHITECTURE.md) - Audio player architecture
- [docs/STEM_STUDIO.md](docs/STEM_STUDIO.md) - Stem separation features
- [docs/CREATIVE_TOOLS.md](docs/CREATIVE_TOOLS.md) - Creative tools documentation
- [docs/DATABASE.md](docs/DATABASE.md) - Database schema and operations
- **[docs/DATABASE_OPTIMIZATION_ANALYSIS.md](docs/DATABASE_OPTIMIZATION_ANALYSIS.md)** - ⭐ Database optimization recommendations (NEW)

### Audio Hooks (⭐ NEW 2026-01-04)
- `src/hooks/audio/usePrefetchTrackCovers.ts` - Prefetch cover images for queue (3 next tracks)
- `src/hooks/audio/usePrefetchNextAudio.ts` - Preload audio for next track (preload='auto')
- `src/hooks/audio/usePlayerState.ts` - Zustand store for player state

### Player Components (⭐ NEW 2026-01-04)
- `src/components/player/KaraokeView.tsx` - Fullscreen karaoke mode (Apple Music Sing-style)
- `src/components/player/DoubleTapSeekFeedback.tsx` - Visual feedback for double-tap seek
- `src/components/player/MobileFullscreenPlayer.tsx` - Full-featured mobile player

### Mobile Development (⭐ NEW)
- **[docs/mobile/OPTIMIZATION_ROADMAP_2026.md](docs/mobile/OPTIMIZATION_ROADMAP_2026.md)** - Mobile optimization roadmap Q1-Q2 2026
- [docs/MOBILE_UI_AUDIT_2025_12.md](docs/MOBILE_UI_AUDIT_2025_12.md) - Mobile UI audit
- [docs/SAFE_AREA_GUIDELINES.md](docs/SAFE_AREA_GUIDELINES.md) - Safe area implementation guide
- [docs/TELEGRAM_MINI_APP_FEATURES.md](docs/TELEGRAM_MINI_APP_FEATURES.md) - Telegram Mini App features

### Integration Guides
- [docs/integrations/](docs/integrations/) - Integration documentation
- [docs/SUNO_API.md](docs/SUNO_API.md) - Suno AI integration
- [docs/TELEGRAM_BOT_ARCHITECTURE.md](docs/TELEGRAM_BOT_ARCHITECTURE.md) - Telegram bot architecture
- [docs/TELEGRAM_INTEGRATION_SUMMARY_2025-12-10.md](docs/TELEGRAM_INTEGRATION_SUMMARY_2025-12-10.md) - Telegram integration details

### Guides & How-Tos
- [docs/guides/](docs/guides/) - Technical how-to guides
- [docs/ONBOARDING.md](docs/ONBOARDING.md) - New developer onboarding

---

## 📋 Specifications

### Active Sprints
- [specs/sprint-011-social-features/](specs/sprint-011-social-features/) - Social features spec
- [specs/sprint-014-platform-integration-export/](specs/sprint-014-platform-integration-export/) - Platform integration spec
- [specs/sprint-015-quality-testing-performance/](specs/sprint-015-quality-testing-performance/) - Quality & testing spec

### Design Documents
- [specs/](specs/) - All technical specifications and SDDs

---

## 🌍 Internationalization

### Russian Documentation (🆕 NEW)
- **[docs/ru/](docs/ru/)** - Russian documentation folder
- [docs/ru/project-analysis.md](docs/ru/project-analysis.md) - Анализ проекта
- [docs/ru/user-scenarios.md](docs/ru/user-scenarios.md) - Пользовательские сценарии
- [docs/ru/analysis-report.md](docs/ru/analysis-report.md) - Итоговый отчет анализа
- [docs/ru/improvement-plan.md](docs/ru/improvement-plan.md) - План доработки
- [docs/ru/studio-development-plan.md](docs/ru/studio-development-plan.md) - План развития студии
- [docs/ru/lyrics-assistant-improvements.md](docs/ru/lyrics-assistant-improvements.md) - Улучшения AI помощника

---

## 🗂️ Archive

Historical documentation in `docs/archive/`:

- **[docs/archive/2026-01-04-cleanup/](docs/archive/2026-01-04-cleanup/)** - January 4, 2026 comprehensive cleanup (latest)
  - Sprint 011, 027, 028 completion reports
  - Mobile optimization summaries
  - Library audit and unified studio reports
  - **12 files** moved to archive
- **[docs/archive/2026-01/](docs/archive/2026-01/)** - January 2026 snapshots (previous cleanup)
- [docs/archive/2025-12/](docs/archive/2025-12/) - December 2025 archives
- [docs/archive/audits/](docs/archive/audits/) - Historical audits
- [docs/archive/audits-2025-12/](docs/archive/audits-2025-12/) - December 2025 audits
- [docs/archive/sprint-reports/](docs/archive/sprint-reports/) - Sprint reports
- [docs/archive/implementation-reports/](docs/archive/implementation-reports/) - Implementation progress reports
- [docs/archive/session-summaries/](docs/archive/session-summaries/) - Development session summaries

**Full Archive Index**: [ARCHIVE.md](ARCHIVE.md)

---

## 📊 Repository Statistics

| Category | Count | Notes |
|----------|-------|-------|
| React Components | 828 | Across 92 subdirectories |
| Custom Hooks | 263 | ~48,812 lines of code |
| Pages | 33+ | Route components |
| Zustand Stores | 8 | Global state management |
| React Contexts | 10 | Context providers |
| Edge Functions | 100+ | Serverless backend functions |
| Database Tables | 30+ | With Row-Level Security |
| Completed Sprints | 21+ | Out of 25 planned |
| Documentation Files | 100+ | Comprehensive coverage |

---

## 🎯 Documentation by Role

### For New Developers
1. Start: [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)
2. Then: [COMPREHENSIVE_ARCHITECTURE.md](docs/COMPREHENSIVE_ARCHITECTURE.md)
3. Reference: [HOOKS_REFERENCE.md](docs/HOOKS_REFERENCE.md)

### For Architects
1. Start: [COMPREHENSIVE_ARCHITECTURE.md](docs/COMPREHENSIVE_ARCHITECTURE.md)
2. Then: [ADR/](ADR/) directory
3. Review: [CODE_REVIEW_SUMMARY.md](docs/CODE_REVIEW_SUMMARY.md)

### For Contributors
1. Start: [CONTRIBUTING.md](CONTRIBUTING.md)
2. Then: [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)
3. Reference: [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)

### For Product Managers
1. Start: [PROJECT_STATUS.md](PROJECT_STATUS.md)
2. Then: [ROADMAP.md](ROADMAP.md)
3. Review: [SPRINTS/](SPRINTS/) directory

---

## 📝 Recent Updates (2026-01-04 Session 4)

**Sprint 029 Fullscreen Player Enhancements**:
- ✅ Horizontal swipe for track switching (Spotify-style)
- ✅ Track cover prefetching (usePrefetchTrackCovers)
- ✅ Audio prefetch for next track (usePrefetchNextAudio)
- ✅ Double-tap seek ±10 seconds (YouTube/TikTok-style)
- ✅ Karaoke mode (KaraokeView - Apple Music Sing-style)
- ✅ Word-level lyrics autoscroll with 30% positioning

**New Files Created**:
- `src/hooks/audio/usePrefetchTrackCovers.ts`
- `src/hooks/audio/usePrefetchNextAudio.ts`
- `src/components/player/KaraokeView.tsx`
- `src/components/player/DoubleTapSeekFeedback.tsx`

**Repository Cleanup Session 4**:
- ✅ Archived 13 files from root to docs/archive/2026-01/
- ✅ Moved 6 files to docs/ for better organization
- ✅ Updated PROJECT_STATUS.md (Sprint 029 → 90%)
- ✅ Updated SPRINT-PROGRESS.md with Fullscreen Player block
- ✅ Updated SPRINT-029 with all completed tasks
- ✅ Added T057-T062 to BACKLOG.md
- ✅ Updated KNOWN_ISSUES_TRACKED.md (IMP102-IMP107 resolved)
- ✅ Updated SDD-016 with Sprint 016-D

**Previous Updates (2026-01-04 Session 1-3)**:
- ✅ Updated PROJECT_STATUS.md with Sprint 029 at 85% completion
- ✅ Archived 12 outdated reports to docs/archive/2026-01-04-cleanup/
- ✅ Reduced root directory from 42 to 30 markdown files (29% reduction)

**Impact**:
- Sprint 029 now at 90% completion (18/20 tasks)
- 6 new Fullscreen Player improvements implemented
- Repository root reduced from 46 to ~25 MD files
- All documentation synchronized with latest changes

---

*For current project status, see [PROJECT_STATUS.md](PROJECT_STATUS.md)*

*For complete architecture details, see [COMPREHENSIVE_ARCHITECTURE.md](docs/COMPREHENSIVE_ARCHITECTURE.md)*
