# Список задач для Спринта 010

**Спринт**: 010 - Homepage Discovery & AI Assistant (User Stories 5 & 6)  
**Период**: 2026-01-12 - 2026-01-26 (2 недели)  
**Цель**: Реализовать главную страницу с публичным контентом и AI Assistant режим для управляемой генерации музыки

---

## 📊 Прогресс спринта

**Общий прогресс**: 0% (0/37 задач)

- ⏳ **Запланировано**: 37 задач (25 основных + 12 инфраструктурных)
- 🔄 **В работе**: 0 задач
- ✅ **Завершено**: 0 задач

---

## 🎯 Пользовательские сценарии (User Stories)

### User Story 5: Homepage Discovery (P2)
**Как пользователь**, я хочу видеть главную страницу с публичным контентом (Featured, New, Popular треки), чтобы открывать новую музыку и вдохновляться работами других пользователей.

**Критерии приемки**:
1. ✅ Homepage отображает разделы Featured/New/Popular
2. ✅ Каждый раздел показывает 10+ треков с lazy loading
3. ✅ Треки кликабельны и открывают детальную информацию
4. ✅ Фильтрация по стилям и тегам
5. ✅ Поиск по публичным трекам
6. ✅ Infinite scroll для всех секций
7. ✅ Skeleton loaders при загрузке
8. ✅ Performance: FCP <2s, Lighthouse >90

### User Story 6: AI Assistant Mode (P2)
**Как пользователь**, я хочу использовать AI Assistant в форме генерации музыки, чтобы получать контекстно-зависимые подсказки и генерировать музыку эффективнее с меньшим количеством ошибок.

**Критерии приемки**:
1. ✅ AI Assistant режим активируется в GenerateWizard
2. ✅ Контекстные подсказки на каждом шаге
3. ✅ Автодополнение для prompt на основе style
4. ✅ Валидация и исправление ошибок в реальном времени
5. ✅ Примеры и шаблоны для каждого поля
6. ✅ История генераций для быстрого повтора
7. ✅ Smart defaults на основе предпочтений пользователя

---

## 📋 Задачи по Чек-листу

### Phase 0: Infrastructure Prerequisites (CRITICAL - BLOCKING) ⚠️

**⚠️ ВНИМАНИЕ**: Эти задачи критичны и блокируют все последующие фичи, использующие медиа-хранилище.

**Estimated**: 12 SP | **Duration**: 2-3 дня | **Priority**: P0 (Highest)

- [ ] INF-010-001 [P] ✅ Create storage buckets migration (tracks, covers, stems, uploads, avatars, banners, temp) - `20251203020000_create_storage_buckets.sql`
- [ ] INF-010-002 [P] ✅ Create storage management tables (storage_usage, file_registry) - `20251203020001_create_storage_management.sql`
- [ ] INF-010-003 [P] ✅ Create CDN integration tables (cdn_assets, media_processing_queue, asset_optimization_settings) - `20251203020002_create_cdn_media_cache.sql`
- [ ] INF-010-004 [P] ✅ Create storage lifecycle management (cleanup, quotas, validation) - `20251203020003_create_storage_lifecycle.sql`
- [ ] INF-010-005 [P] Apply migrations to Supabase (run all 4 migration files)
- [ ] INF-010-006 [P] Test storage bucket upload/download with RLS policies
- [ ] INF-010-007 [P] Create helper functions in src/lib/storage.ts (uploadFile, deleteFile, getFileUrl)
- [ ] INF-010-008 [P] Create helper functions in src/lib/cdn.ts (getCDNUrl, getOptimizedImageUrl)
- [ ] INF-010-009 Setup CDN provider account (Cloudflare Images or Bunny CDN)
- [ ] INF-010-010 [P] Configure CDN environment variables in .env
- [ ] INF-010-011 [P] Update track upload flow to use new storage system (tracks bucket)
- [ ] INF-010-012 [P] Update cover upload to use covers bucket with automatic optimization

**Checkpoint**: Storage infrastructure должна быть полностью функциональной перед началом Phase 1

---

### Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Create project structure for homepage and AI assistant features
- [ ] T002 [P] Setup database schema for public content (is_public, is_featured, likes_count, plays_count) - ✅ Already in migration 20251202155000
- [ ] T003 [P] Setup database schema for AI assistant (prompt_suggestions table) - ✅ Already in migration 20251202155001

---

### Phase 2: Foundational (Blocking Prerequisites)

- [ ] T004 Create usePublicTracks hook in src/hooks/usePublicTracks.ts for fetching public tracks with filters
- [ ] T005 [P] Create useAutocompleteSuggestions hook in src/hooks/useAutocompleteSuggestions.ts for AI suggestions
- [ ] T006 [P] Create AIAssistantContext provider in src/contexts/AIAssistantContext.tsx for global AI state

---

### Phase 3: User Story 5 - Homepage Discovery (Priority: P2) 🎯 

**Goal**: Implement public content discovery with Featured, New, and Popular sections

**Independent Test**: Navigate to homepage, verify all sections load, test search/filter, verify infinite scroll

#### Implementation for User Story 5

- [ ] T007 [P] [US5] Create Homepage layout component in src/pages/Homepage.tsx
- [ ] T008 [P] [US5] Create HeroSection component in src/components/homepage/HeroSection.tsx
- [ ] T009 [P] [US5] Create FeaturedSection component in src/components/homepage/FeaturedSection.tsx
- [ ] T010 [P] [US5] Create NewTracksSection component in src/components/homepage/NewTracksSection.tsx with infinite scroll
- [ ] T011 [P] [US5] Create PopularSection component in src/components/homepage/PopularSection.tsx with time range filter
- [ ] T012 [P] [US5] Create PublicTrackCard component in src/components/homepage/PublicTrackCard.tsx
- [ ] T013 [P] [US5] Create SearchBar component in src/components/homepage/SearchBar.tsx with debounce
- [ ] T014 [P] [US5] Create StyleFilter component in src/components/homepage/StyleFilter.tsx
- [ ] T015 [US5] Create backend public tracks API in supabase/functions/public-tracks/index.ts with caching
- [ ] T016 [US5] Add database indexes for public content queries (is_public, is_featured, likes_count)
- [ ] T017 [US5] Implement track likes system with track_likes table and triggers
- [ ] T018 [US5] Add analytics tracking for plays and views

**Checkpoint**: Homepage should display public content with search, filter, and infinite scroll working

---

### Phase 4: User Story 6 - AI Assistant Mode (Priority: P2)

**Goal**: Implement AI Assistant for guided music generation with smart suggestions

**Independent Test**: Open GenerateWizard, verify AI Assistant panel shows suggestions, test autocomplete, apply templates

#### Implementation for User Story 6

- [ ] T019 [P] [US6] Create AssistantPanel component in src/components/assistant/AssistantPanel.tsx
- [ ] T020 [P] [US6] Create SmartPromptInput component in src/components/assistant/SmartPromptInput.tsx with autocomplete
- [ ] T021 [P] [US6] Create StyleBasedSuggestions component in src/components/assistant/StyleBasedSuggestions.tsx
- [ ] T022 [P] [US6] Create ValidationFeedback component in src/components/assistant/ValidationFeedback.tsx
- [ ] T023 [P] [US6] Create TemplateLibrary component in src/components/assistant/TemplateLibrary.tsx with categories
- [ ] T024 [P] [US6] Create GenerationHistory component in src/components/assistant/GenerationHistory.tsx
- [ ] T025 [P] [US6] Create SmartDefaults component in src/components/assistant/SmartDefaults.tsx
- [ ] T026 [US6] Integrate AI Assistant into GenerateWizard in src/components/generate/GenerateWizard.tsx
- [ ] T027 [US6] Populate prompt_suggestions database with initial suggestions (277+ styles, common patterns)
- [ ] T028 [US6] Create AI Assistant settings page in src/components/settings/AIAssistantSettings.tsx
- [ ] T029 [US6] Add generation history tracking to database with user_generation_history table

**Checkpoint**: AI Assistant should provide suggestions, templates, and validation in GenerateWizard

---

### Phase 5: Polish & Cross-Cutting Concerns

- [ ] T030 [P] Add skeleton loaders for all homepage sections
- [ ] T031 [P] Optimize homepage performance (lazy loading, code splitting, image optimization)
- [ ] T032 [P] Add error boundaries and error states for homepage
- [ ] T033 [P] Add accessibility features (ARIA labels, keyboard navigation, screen reader support)
- [ ] T034 [P] Write E2E tests for homepage navigation and search in tests/e2e/homepage.spec.ts
- [ ] T035 [P] Write E2E tests for AI Assistant in tests/e2e/ai-assistant.spec.ts
- [ ] T036 Update documentation with homepage and AI assistant features

---

## Dependencies Between Tasks

**Critical Path**:
1. T002, T003 (Database) → T004, T005, T006 (Hooks/Context) → US5 & US6 Implementation
2. T004 (usePublicTracks) → T007-T014 (Homepage components)
3. T005, T006 (AI Context) → T019-T028 (AI Assistant components)
4. T026 (Integration) depends on T006, T019-T025

**Parallel Opportunities**:
- Homepage components (T007-T014) can be built in parallel after T004
- AI Assistant components (T019-T025) can be built in parallel after T005, T006
- Polish tasks (T030-T036) can run in parallel after core implementation

---

## Implementation Strategy

**Sprint Week 1 (Days 1-7)**:
- Days 1-2: Setup phase (T001-T003) + Foundational (T004-T006)
- Days 3-5: User Story 5 implementation (T007-T018)
- Days 6-7: Begin User Story 6 (T019-T023)

**Sprint Week 2 (Days 8-14)**:
- Days 8-10: Complete User Story 6 (T024-T029)
- Days 11-12: Polish & testing (T030-T036)
- Days 13-14: Code review, bug fixes, documentation

**MVP Scope**: User Story 5 (Homepage) can ship independently. User Story 6 (AI Assistant) is additive.

---

## Acceptance Criteria

### Functional Requirements
- [ ] Homepage displays Featured/New/Popular sections with proper data
- [ ] Search and style filtering work across all public tracks
- [ ] Infinite scroll loads more tracks smoothly
- [ ] AI Assistant provides contextual suggestions in GenerateWizard
- [ ] Template library offers quick-start options
- [ ] Generation history allows replay of previous generations
- [ ] All touch targets meet 44×44px minimum size
- [ ] All interactive elements have keyboard navigation

### Performance Requirements
- [ ] Homepage First Contentful Paint < 2s on 3G
- [ ] Lighthouse Mobile Score > 90
- [ ] Autocomplete latency < 300ms
- [ ] Infinite scroll smooth at 60fps
- [ ] Search debounce at 300ms prevents excessive API calls

### Quality Requirements
- [ ] TypeScript: 0 errors with strict mode
- [ ] ESLint: 0 new errors
- [ ] Prettier: all code formatted
- [ ] Code review completed and approved
- [ ] Test coverage > 80% for new code (optional)

---

## Testing Strategy

### Unit Tests (Optional - if requested)
- usePublicTracks hook with various filters
- useAutocompleteSuggestions with debouncing
- AIAssistantContext state management
- Component rendering and user interactions

### Integration Tests (Optional - if requested)
- Homepage sections loading and displaying data
- Search and filter integration
- AI Assistant integration with GenerateWizard
- Template application flow

### E2E Tests (Recommended)
- Homepage navigation and content discovery
- Public track search and filtering
- AI Assistant usage in music generation
- Template library and application
- Generation history replay

---

## Technical Notes

### Database Schema Changes
```sql
-- Public content support
ALTER TABLE tracks ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE tracks ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE tracks ADD COLUMN likes_count INTEGER DEFAULT 0;
ALTER TABLE tracks ADD COLUMN plays_count INTEGER DEFAULT 0;

-- AI Assistant support
CREATE TABLE prompt_suggestions (
  id UUID PRIMARY KEY,
  text TEXT NOT NULL,
  description TEXT,
  category TEXT,
  style TEXT,
  usage_count INTEGER DEFAULT 0
);

CREATE TABLE track_likes (
  id UUID PRIMARY KEY,
  track_id UUID REFERENCES tracks(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(track_id, user_id)
);
```

### API Endpoints
- GET /api/public-tracks?filter=featured|new|popular&style=...&search=...
- GET /api/autocomplete?q=...&style=...&context=...
- POST /api/track/:id/like
- GET /api/generation-history?limit=20

### Performance Optimizations
- Implement virtual scrolling for large lists
- Use React.memo for expensive components
- Implement proper image lazy loading
- Cache autocomplete suggestions
- Use pagination for infinite scroll

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Public content database performance | High | Add proper indexes, implement caching, use pagination |
| AI suggestion quality | Medium | Start with rule-based suggestions, gather user feedback, iterate |
| Autocomplete API rate limits | Medium | Implement aggressive caching, use local fallback suggestions |
| Homepage load time on slow networks | High | Optimize images, implement progressive loading, add service worker |

---

## Success Metrics

### User Story 5 (Homepage)
- Public content page views: > 1000/week
- Average time on homepage: > 2 minutes
- Search usage: > 30% of visitors
- Click-through rate on tracks: > 15%

### User Story 6 (AI Assistant)
- AI Assistant enabled rate: > 60% of generations
- Suggestion acceptance rate: > 40%
- Template usage: > 25% of users
- Generation success rate improvement: +20% vs baseline

---

## Next Steps

After Sprint 010, proceed to:
- **Sprint 011**: Social Features (User profiles, following, comments, collaboration)
- **Sprint 012**: Monetization (Credits, subscriptions, payment integration)
- **Sprint 013**: Advanced Audio (Stem editing, effects, waveform visualization)

---

*Последнее обновление: 2025-12-02*
