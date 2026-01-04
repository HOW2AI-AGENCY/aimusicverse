# План Улучшений MusicVerse AI

**Дата:** 2025-12-16  
**Версия:** 1.0  
**Период:** 2025-12-16 → 2026-03-31 (3.5 месяца)  
**Основано на**: [PROJECT_AUDIT_2025-12-16.md](./PROJECT_AUDIT_2025-12-16.md)

---

## 🎯 Стратегические цели

1. **Улучшить Inline Mode** - сделать его лучшим способом sharing контента
2. **Оптимизировать Payment System** - внедрить продвинутую монетизацию
3. **Достичь Performance Targets** - Bundle <800KB, TTI <3.5s
4. **Завершить Sprint 011** - Social Features 100%
5. **Подготовить к Scale** - monitoring, testing, documentation

---

## 📊 План работ: 4 фазы

### Phase 1: Quick Wins & Critical (2 недели)
**Даты**: 2025-12-16 → 2025-12-29  
**Story Points**: 35 SP

### Phase 2: Inline Mode & Payment UX (3 недели)
**Даты**: 2025-12-30 → 2026-01-19  
**Story Points**: 45 SP

### Phase 3: Performance & Quality (3 недели)
**Даты**: 2026-01-20 → 2026-02-09  
**Story Points**: 40 SP

### Phase 4: Polish & Scale (6 недель)
**Даты**: 2026-02-10 → 2026-03-31  
**Story Points**: 50 SP

**Общий объем**: 170 SP (~2.5 спринта)

---

## 🚀 Phase 1: Quick Wins & Critical (2 недели, 35 SP)

### Цель
Закрыть критические проблемы и подготовить базу для следующих фаз.

---

### T1.1: Завершение Sprint 011 - Social Features ✅
**Story Points**: 13 SP  
**Приоритет**: P0 (Критично)

#### Текущий статус
- ✅ Phases 1-9 complete (123/143 tasks)
- 🔄 Phase 10: Content Moderation (7/9 tasks - 78%)
- 🔄 Phase 11: Real-time Optimization (6/9 tasks - 67%)
- ⏳ Phase 12: Testing & QA (0/16 tasks)
- ⏳ Phase 13: Documentation (1/13 tasks)

#### Tasks

**Phase 10: Content Moderation** (2 SP)
- [ ] T1.1.1: Implement auto-moderation rules for spam detection (4h)
- [ ] T1.1.2: Add content flagging thresholds (3h)

**Phase 11: Real-time Optimization** (2 SP)
- [ ] T1.1.3: Optimize Supabase Realtime subscription patterns (4h)
- [ ] T1.1.4: Add connection pooling for notifications (3h)
- [ ] T1.1.5: Implement reconnection logic (3h)

**Phase 12: Testing & QA** (6 SP)
- [ ] T1.1.6: E2E test: Profile creation and editing (3h)
- [ ] T1.1.7: E2E test: Follow/unfollow flow (2h)
- [ ] T1.1.8: E2E test: Comment creation and threading (4h)
- [ ] T1.1.9: E2E test: Like functionality (2h)
- [ ] T1.1.10: E2E test: Activity feed updates (4h)
- [ ] T1.1.11: E2E test: Notifications delivery (4h)
- [ ] T1.1.12: E2E test: Block/report flows (4h)
- [ ] T1.1.13: Integration test: Privacy settings (3h)
- [ ] T1.1.14: Integration test: Moderation dashboard (3h)
- [ ] T1.1.15: Performance test: Feed with 1000+ items (4h)
- [ ] T1.1.16: Load test: Concurrent likes/comments (3h)

**Phase 13: Documentation** (3 SP)
- [ ] T1.1.17: User guide: Creating profile and bio (2h)
- [ ] T1.1.18: User guide: Following and feed (2h)
- [ ] T1.1.19: User guide: Comments and engagement (2h)
- [ ] T1.1.20: User guide: Privacy and blocking (2h)
- [ ] T1.1.21: Developer docs: Social features API (4h)
- [ ] T1.1.22: Developer docs: Real-time integration (3h)
- [ ] T1.1.23: FAQ: Common social features questions (2h)

**Files to modify**:
```
tests/e2e/social/ (new directory)
docs/guides/social-features/ (new directory)
src/components/social/ (existing, minor fixes)
```

---

### T1.2: Bundle Size Phase 1 (завершение) ⚡
**Story Points**: 12 SP  
**Приоритет**: P0 (Критично)

#### Текущий статус
- ✅ framer-motion migration: 45/112 files done
- ⏳ 67 files remaining
- Target: <900 KB (intermediate), final <800 KB in Phase 3

#### Tasks

**Complete framer-motion Migration** (6 SP)
- [ ] T1.2.1: Migrate components/player/* (8 files, 4h)
- [ ] T1.2.2: Migrate components/library/* (12 files, 5h)
- [ ] T1.2.3: Migrate components/generate-form/* (10 files, 4h)
- [ ] T1.2.4: Migrate components/stem-studio/* (15 files, 6h)
- [ ] T1.2.5: Migrate pages/* (8 files, 3h)
- [ ] T1.2.6: Migrate remaining components (14 files, 5h)
- [ ] T1.2.7: Remove unused framer-motion imports (2h)

**Lazy Loading Phase 1** (4 SP)
- [ ] T1.2.8: Lazy load StemStudio (3h)
- [ ] T1.2.9: Lazy load MusicLab components (3h)
- [ ] T1.2.10: Lazy load Admin Dashboard (2h)
- [ ] T1.2.11: Lazy load Settings pages (2h)
- [ ] T1.2.12: Lazy load Lyrics Assistant (3h)
- [ ] T1.2.13: Lazy load Analytics Dashboard (2h)
- [ ] T1.2.14: Lazy load Payment pages (2h)
- [ ] T1.2.15: Update route configuration (2h)

**Build Optimization** (2 SP)
- [ ] T1.2.16: Configure vite.config.ts for tree-shaking (3h)
- [ ] T1.2.17: Add bundle analyzer to CI (2h)
- [ ] T1.2.18: Optimize dependency imports (4h)
- [ ] T1.2.19: Remove duplicate dependencies (3h)

**Expected Result**: Bundle size 900-950 KB (-18% от 1.16 MB)

**Files to modify**:
```
vite.config.ts
src/lib/motion.ts
src/App.tsx (route lazy loading)
package.json
.github/workflows/performance.yml (new)
```

---

### T1.3: Performance Monitoring Setup 📊
**Story Points**: 7 SP  
**Приоритет**: P0 (Критично)

#### Tasks

**Lighthouse CI** (3 SP)
- [ ] T1.3.1: Create GitHub Actions workflow (3h)
  ```yaml
  # .github/workflows/lighthouse-ci.yml
  name: Lighthouse CI
  on: [pull_request]
  jobs:
    lighthouse:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: actions/setup-node@v3
        - run: npm ci
        - run: npm run build
        - uses: treosh/lighthouse-ci-action@v9
  ```
- [ ] T1.3.2: Configure performance budgets (2h)
  ```json
  // lighthouserc.json (update existing)
  {
    "ci": {
      "assert": {
        "assertions": {
          "first-contentful-paint": ["error", { "maxNumericValue": 1800 }],
          "interactive": ["error", { "maxNumericValue": 3500 }],
          "speed-index": ["error", { "maxNumericValue": 3000 }],
          "total-byte-weight": ["error", { "maxNumericValue": 850000 }]
        }
      }
    }
  }
  ```
- [ ] T1.3.3: Add Lighthouse reports to PR comments (3h)
- [ ] T1.3.4: Setup alerts for budget violations (2h)

**Bundle Size Tracking** (2 SP)
- [ ] T1.3.5: Integrate size-limit (2h)
  ```json
  // package.json
  {
    "size-limit": [
      { "path": "dist/assets/*.js", "limit": "800 KB" }
    ]
  }
  ```
- [ ] T1.3.6: Add size-limit to CI (2h)
- [ ] T1.3.7: Create size history tracking (3h)

**Performance Dashboard** (2 SP)
- [ ] T1.3.8: Create docs/PERFORMANCE_DASHBOARD.md (3h)
- [ ] T1.3.9: Add metrics collection script (3h)
- [ ] T1.3.10: Setup weekly performance reports (2h)

**Files to create/modify**:
```
.github/workflows/lighthouse-ci.yml (new)
.github/workflows/size-limit.yml (new)
lighthouserc.json (update)
package.json (add size-limit)
docs/PERFORMANCE_DASHBOARD.md (new)
scripts/collect-metrics.js (new)
```

---

### T1.4: Error Handling Infrastructure 🛠️
**Story Points**: 3 SP  
**Приоритет**: P1 (Высокий)

#### Tasks

**Structured Error Types** (1 SP)
- [ ] T1.4.1: Create error type hierarchy (2h)
  ```typescript
  // src/lib/errors.ts (new)
  export class AppError extends Error {
    constructor(
      message: string,
      public code: string,
      public statusCode: number = 500,
      public userMessage?: string
    ) {
      super(message);
    }
  }
  
  export class ValidationError extends AppError {
    constructor(message: string, field?: string) {
      super(message, 'VALIDATION_ERROR', 400);
    }
  }
  
  export class NetworkError extends AppError {
    constructor(message: string) {
      super(message, 'NETWORK_ERROR', 503, 'Проблема с сетью. Попробуйте позже.');
    }
  }
  
  export class AuthError extends AppError {
    constructor(message: string) {
      super(message, 'AUTH_ERROR', 401, 'Требуется авторизация.');
    }
  }
  ```

**Error Boundary** (1 SP)
- [ ] T1.4.2: Create ErrorBoundary component (2h)
  ```typescript
  // src/components/ErrorBoundary.tsx (new)
  export class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };
    
    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }
    
    componentDidCatch(error, errorInfo) {
      logError(error, errorInfo);
    }
    
    render() {
      if (this.state.hasError) {
        return <ErrorFallback error={this.state.error} />;
      }
      return this.props.children;
    }
  }
  ```
- [ ] T1.4.3: Wrap App with ErrorBoundary (1h)

**Retry Logic** (1 SP)
- [ ] T1.4.4: Create retry utility (2h)
  ```typescript
  // src/lib/retry.ts (new)
  export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      initialDelay?: number;
      maxDelay?: number;
    } = {}
  ): Promise<T> {
    // Exponential backoff implementation
  }
  ```
- [ ] T1.4.5: Integrate retry in API calls (2h)

**Files to create**:
```
src/lib/errors.ts (new)
src/lib/retry.ts (new)
src/components/ErrorBoundary.tsx (new)
src/components/ErrorFallback.tsx (new)
src/App.tsx (update)
```

---

## 🎵 Phase 2: Inline Mode & Payment UX (3 недели, 45 SP)

### Цель
Трансформировать inline mode в лучший способ sharing музыки и улучшить монетизацию.

---

### T2.1: Inline Mode Enhancement 🎤
**Story Points**: 20 SP  
**Приоритет**: P0 (Критично)

#### Текущие проблемы
- ❌ Только личные треки
- ❌ Примитивный поиск (title + style)
- ❌ Нет категорий и навигации
- ❌ Отсутствует персонализация

#### Новая архитектура

```typescript
// inline.ts - Полная переработка

interface InlineQueryContext {
  query: string;           // Поисковый запрос
  offset: string;          // Пагинация
  category?: string;       // Категория (my, public, trending, genre:rock)
  filter?: {              // Фильтры
    mood?: string;
    duration?: string;
    language?: string;
  };
}

// Категории inline режима
enum InlineCategory {
  MY_TRACKS = 'my',         // Мои треки
  PUBLIC = 'public',        // Публичные треки
  TRENDING = 'trending',    // Трендовые
  FEATURED = 'featured',    // Избранные
  GENRE = 'genre:',         // По жанру
  MOOD = 'mood:',          // По настроению
  NEW = 'new',             // Новые
}
```

#### Tasks

**Phase 2.1.1: Public Content Search** (6 SP)
- [ ] T2.1.1: Add public tracks query (3h)
  ```typescript
  // Search in public tracks where is_public = true
  const { data } = await supabase
    .from('tracks')
    .select('*, profiles!inner(username, avatar_url, is_verified)')
    .eq('status', 'completed')
    .eq('profiles.is_public', true)
    .not('audio_url', 'is', null)
    .textSearch('title_style_search', query)
    .order('created_at', { ascending: false })
    .range(offset, offset + 20);
  ```
- [ ] T2.1.2: Add trending tracks query (4h)
  ```sql
  -- Create trending_tracks view
  CREATE VIEW trending_tracks AS
  SELECT t.*, 
         COUNT(DISTINCT l.user_id) as like_count,
         COUNT(DISTINCT c.id) as comment_count,
         COUNT(DISTINCT l.user_id) * 2 + COUNT(DISTINCT c.id) as score
  FROM tracks t
  LEFT JOIN likes l ON l.track_id = t.id AND l.created_at > NOW() - INTERVAL '7 days'
  LEFT JOIN comments c ON c.track_id = t.id AND c.created_at > NOW() - INTERVAL '7 days'
  WHERE t.status = 'completed' AND t.is_public = true
  GROUP BY t.id
  ORDER BY score DESC, t.created_at DESC;
  ```
- [ ] T2.1.3: Add featured tracks query (2h)
- [ ] T2.1.4: Database indexes for search optimization (3h)
  ```sql
  -- Full-text search indexes
  CREATE INDEX idx_tracks_search ON tracks 
    USING GIN (to_tsvector('russian', title || ' ' || style || ' ' || tags));
  
  -- Trending scores index
  CREATE INDEX idx_tracks_trending ON tracks (created_at DESC, like_count DESC);
  ```

**Phase 2.1.2: Category Navigation** (4 SP)
- [ ] T2.1.5: Implement category routing (4h)
  ```typescript
  // Handle category prefixes
  if (query.startsWith('my:')) {
    return searchMyTracks(userId, query.slice(3));
  } else if (query.startsWith('trending:')) {
    return searchTrending(query.slice(9));
  } else if (query.startsWith('genre:')) {
    return searchByGenre(query.slice(6));
  }
  ```
- [ ] T2.1.6: Add SwitchInlineQueryCurrentChat button (3h)
  ```typescript
  // Add category buttons to results
  reply_markup: {
    inline_keyboard: [[
      { text: '🎵 Мои', switch_inline_query_current_chat: 'my:' },
      { text: '🔥 Тренды', switch_inline_query_current_chat: 'trending:' },
      { text: '🎸 Жанры', switch_inline_query_current_chat: 'genre:' },
    ]]
  }
  ```
- [ ] T2.1.7: Empty state with category suggestions (2h)
- [ ] T2.1.8: Help message for inline commands (2h)

**Phase 2.1.3: Advanced Search** (5 SP)
- [ ] T2.1.9: Multi-field search (title, style, tags, artist) (4h)
- [ ] T2.1.10: Genre/mood filters (4h)
- [ ] T2.1.11: Duration filters (short/medium/long) (3h)
- [ ] T2.1.12: Language filters (3h)
- [ ] T2.1.13: Search suggestions (autocomplete) (4h)

**Phase 2.1.4: Rich Results** (3 SP)
- [ ] T2.1.14: Add artist info to results (2h)
- [ ] T2.1.15: Add play count and likes (2h)
- [ ] T2.1.16: Add genre tags to results (2h)
- [ ] T2.1.17: Improve thumbnail quality (2h)
- [ ] T2.1.18: Add verification badges for artists (2h)

**Phase 2.1.5: Personalization** (2 SP)
- [ ] T2.1.19: Track user inline searches (2h)
- [ ] T2.1.20: Recommend tracks based on history (4h)
- [ ] T2.1.21: Show "Recently shared" section (2h)

**Files to modify**:
```
supabase/functions/telegram-bot/commands/inline.ts (major rewrite)
supabase/migrations/YYYYMMDD_inline_mode_improvements.sql (new)
docs/TELEGRAM_BOT_INLINE_MODE.md (new)
```

**Expected Results**:
- ✅ Публичный контент в inline mode
- ✅ 5+ категорий навигации
- ✅ Расширенный поиск с фильтрами
- ✅ Trending треки
- ✅ Персонализированные рекомендации

---

### T2.2: Payment UX Improvements 💳
**Story Points**: 15 SP  
**Приоритет**: P1 (Высокий)

#### Tasks

**Phase 2.2.1: Promo Codes System** (6 SP)
- [ ] T2.2.1: Create promo_codes table (2h)
  ```sql
  CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL, -- 'percentage' | 'fixed'
    discount_value INTEGER NOT NULL,
    max_uses INTEGER,
    uses_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] T2.2.2: Promo code validation endpoint (3h)
- [ ] T2.2.3: Apply promo code to invoice (4h)
- [ ] T2.2.4: UI for promo code input (3h)
- [ ] T2.2.5: Admin promo code management (4h)
- [ ] T2.2.6: Promo code analytics (2h)

**Phase 2.2.2: Bundled Offers** (4 SP)
- [ ] T2.2.7: Create bundles table (2h)
  ```sql
  CREATE TABLE product_bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name JSONB NOT NULL,
    product_ids UUID[] NOT NULL,
    bundle_price INTEGER NOT NULL,
    savings_percentage INTEGER,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] T2.2.8: Bundle purchase flow (4h)
- [ ] T2.2.9: UI for bundle display (4h)
- [ ] T2.2.10: Bundle recommendations (3h)

**Phase 2.2.3: Smart Recommendations** (3 SP)
- [ ] T2.2.11: Usage analytics (track generation frequency) (3h)
- [ ] T2.2.12: Recommend package based on usage (4h)
- [ ] T2.2.13: "Running low on credits" notification (2h)
- [ ] T2.2.14: Best value badge on packages (2h)

**Phase 2.2.4: Gift System** (2 SP)
- [ ] T2.2.15: Integrate Telegram Gifts API (4h)
  ```typescript
  // Send credits as gift
  await telegram.sendGift(user_id, gift_id, stars_amount);
  ```
- [ ] T2.2.16: Gift UI in payment page (2h)
- [ ] T2.2.17: Gift redemption flow (2h)

**Files to create/modify**:
```
supabase/migrations/YYYYMMDD_promo_codes.sql (new)
supabase/migrations/YYYYMMDD_product_bundles.sql (new)
supabase/functions/validate-promo-code/ (new)
supabase/functions/create-bundle-invoice/ (new)
src/pages/payments/BuyCredits.tsx (update)
src/components/payments/PromoCodeInput.tsx (new)
src/components/payments/BundleCard.tsx (new)
docs/PAYMENT_SYSTEM_ENHANCEMENTS.md (new)
```

---

### T2.3: Telegram Mini App 2.0 Features 📱
**Story Points**: 10 SP  
**Приоритет**: P2 (Средний)

#### Tasks

**Home Screen Shortcut** (3 SP)
- [ ] T2.3.1: Implement addToHomeScreen() (2h)
- [ ] T2.3.2: Check home screen status (1h)
- [ ] T2.3.3: Prompt UI for adding shortcut (2h)
- [ ] T2.3.4: Analytics for shortcut usage (2h)

**Full-Screen Player** (3 SP)
- [ ] T2.3.5: Implement requestFullscreen() (2h)
- [ ] T2.3.6: Full-screen player UI (4h)
- [ ] T2.3.7: Gesture controls in fullscreen (3h)

**Download Files** (2 SP)
- [ ] T2.3.8: Implement downloadFile() (2h)
- [ ] T2.3.9: Download track with metadata (3h)
- [ ] T2.3.10: Download playlist as ZIP (3h)

**Accelerometer Gestures** (2 SP)
- [ ] T2.3.11: Initialize Accelerometer (1h)
- [ ] T2.3.12: Shake to shuffle (2h)
- [ ] T2.3.13: Tilt for volume control (3h)

**Files to modify**:
```
src/hooks/useTelegramSDK.ts (new)
src/components/player/FullscreenPlayer.tsx (new)
src/lib/telegram-features.ts (new)
docs/TELEGRAM_MINI_APP_FEATURES.md (update)
```

---

## 🏃 Phase 3: Performance & Quality (3 недели, 40 SP)

### Цель
Достичь целевых метрик производительности и повысить качество через тестирование.

---

### T3.1: Bundle Size Phase 2 (Финальная оптимизация) ⚡
**Story Points**: 12 SP  
**Приоритет**: P0 (Критично)

**Target**: Bundle size <800 KB

#### Tasks

**Dependency Optimization** (5 SP)
- [ ] T3.1.1: Audit all dependencies (3h)
  ```bash
  npx depcheck
  npx bundle-phobia analyze
  ```
- [ ] T3.1.2: Replace heavy dependencies (6h)
  ```
  date-fns → native Date APIs (where possible)
  lodash → native ES6 functions
  moment → date-fns (if used)
  ```
- [ ] T3.1.3: Remove unused dependencies (2h)
- [ ] T3.1.4: Switch to smaller alternatives (4h)

**Advanced Tree-Shaking** (4 SP)
- [ ] T3.1.5: Configure Rollup tree-shaking (3h)
- [ ] T3.1.6: Mark side-effects in package.json (2h)
- [ ] T3.1.7: Use ES modules where possible (4h)
- [ ] T3.1.8: Audit and fix import patterns (4h)

**Code Splitting Phase 2** (3 SP)
- [ ] T3.1.9: Split vendor chunks optimally (3h)
  ```typescript
  // vite.config.ts
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/*', 'framer-motion'],
          'query-vendor': ['@tanstack/react-query'],
        }
      }
    }
  }
  ```
- [ ] T3.1.10: Implement route-based code splitting (4h)
- [ ] T3.1.11: Lazy load icons (2h)

**Expected Result**: Bundle size <800 KB (-31% from 1.16 MB)

---

### T3.2: Performance Optimization 🚀
**Story Points**: 10 SP  
**Приоритет**: P0 (Критично)

**Target**: TTI <3.5s, FCP <1.8s, LCP <2.5s

#### Tasks

**Critical Rendering Path** (4 SP)
- [ ] T3.2.1: Optimize initial HTML (2h)
- [ ] T3.2.2: Inline critical CSS (3h)
- [ ] T3.2.3: Preload key resources (2h)
- [ ] T3.2.4: Defer non-critical scripts (2h)
- [ ] T3.2.5: Optimize font loading (2h)

**Image Optimization** (3 SP)
- [ ] T3.2.6: Convert images to WebP/AVIF (3h)
- [ ] T3.2.7: Implement responsive images (3h)
- [ ] T3.2.8: Add image CDN (Cloudflare Images?) (4h)
- [ ] T3.2.9: Optimize cover image sizes (2h)

**Runtime Performance** (3 SP)
- [ ] T3.2.10: Profile and optimize re-renders (4h)
- [ ] T3.2.11: Memoization audit (useMemo, useCallback) (3h)
- [ ] T3.2.12: Optimize expensive computations (3h)
- [ ] T3.2.13: Debounce/throttle user interactions (2h)

---

### T3.3: E2E Testing Suite 🧪
**Story Points**: 12 SP  
**Приоритет**: P1 (Высокий)

#### Tasks

**Playwright Setup** (2 SP)
- [ ] T3.3.1: Configure Playwright (2h)
- [ ] T3.3.2: Create test utilities and fixtures (3h)
- [ ] T3.3.3: Setup CI integration (2h)

**Core Flows** (6 SP)
- [ ] T3.3.4: E2E: Authentication flow (3h)
- [ ] T3.3.5: E2E: Music generation flow (4h)
- [ ] T3.3.6: E2E: Track playback (3h)
- [ ] T3.3.7: E2E: Library management (3h)
- [ ] T3.3.8: E2E: Playlist CRUD (4h)
- [ ] T3.3.9: E2E: Search functionality (3h)

**Payment Flows** (2 SP)
- [ ] T3.3.10: E2E: Credit purchase (mock) (3h)
- [ ] T3.3.11: E2E: Subscription flow (mock) (3h)

**Mobile Flows** (2 SP)
- [ ] T3.3.12: E2E: Mobile navigation (2h)
- [ ] T3.3.13: E2E: Mobile player (3h)
- [ ] T3.3.14: E2E: Mobile generation (3h)

**Files to create**:
```
tests/e2e/ (directory structure)
playwright.config.ts (update)
.github/workflows/e2e.yml (new)
```

---

### T3.4: Edge Functions Testing 🔧
**Story Points**: 6 SP  
**Приоритет**: P2 (Средний)

#### Tasks

**Test Infrastructure** (2 SP)
- [ ] T3.4.1: Setup Deno test runner (2h)
- [ ] T3.4.2: Create test fixtures (3h)
- [ ] T3.4.3: Mock Supabase client (2h)

**Critical Functions** (4 SP)
- [ ] T3.4.4: Test telegram-bot webhook handling (4h)
- [ ] T3.4.5: Test stars-webhook payment flow (4h)
- [ ] T3.4.6: Test send-telegram-notification (3h)
- [ ] T3.4.7: Test suno-music-callback (3h)
- [ ] T3.4.8: Test inline query handler (3h)

**Files to create**:
```
supabase/functions/_tests/ (new directory)
supabase/functions/_shared/test-utils.ts (new)
```

---

## 🎨 Phase 4: Polish & Scale (6 недель, 50 SP)

### Цель
Подготовить платформу к масштабированию и повысить общее качество.

---

### T4.1: Discovery & Recommendations 🔍
**Story Points**: 15 SP  
**Приоритет**: P2 (Средний)

#### Tasks

**Personalized Feed** (6 SP)
- [ ] T4.1.1: Track user listening history (3h)
- [ ] T4.1.2: Build recommendation engine (8h)
  ```sql
  -- Collaborative filtering query
  WITH user_listens AS (
    SELECT track_id, COUNT(*) as listen_count
    FROM play_history
    WHERE user_id = $1
    GROUP BY track_id
  ),
  similar_users AS (
    SELECT ph.user_id, COUNT(DISTINCT ph.track_id) as common_tracks
    FROM play_history ph
    INNER JOIN user_listens ul ON ph.track_id = ul.track_id
    WHERE ph.user_id != $1
    GROUP BY ph.user_id
    ORDER BY common_tracks DESC
    LIMIT 100
  )
  SELECT t.*, COUNT(*) as score
  FROM tracks t
  INNER JOIN play_history ph ON t.id = ph.track_id
  INNER JOIN similar_users su ON ph.user_id = su.user_id
  WHERE t.id NOT IN (SELECT track_id FROM user_listens)
  GROUP BY t.id
  ORDER BY score DESC
  LIMIT 20;
  ```
- [ ] T4.1.3: "For You" page UI (4h)
- [ ] T4.1.4: Recommendation explanation (2h)

**Genre/Mood Discovery** (5 SP)
- [ ] T4.1.5: Genre taxonomy and tagging (3h)
- [ ] T4.1.6: Mood detection from audio analysis (4h)
- [ ] T4.1.7: Genre/mood browse pages (5h)
- [ ] T4.1.8: Mood-based filters (3h)

**Trending & Charts** (4 SP)
- [ ] T4.1.9: Trending algorithm (4h)
- [ ] T4.1.10: Daily/Weekly/Monthly charts (4h)
- [ ] T4.1.11: Genre-specific charts (3h)
- [ ] T4.1.12: Charts page UI (4h)

---

### T4.2: Advanced Monetization 💰
**Story Points**: 12 SP  
**Приоритет**: P3 (Низкий)

#### Tasks

**Creator Program** (5 SP)
- [ ] T4.2.1: Creator profiles (3h)
- [ ] T4.2.2: Content monetization settings (4h)
- [ ] T4.2.3: Revenue sharing system (6h)
- [ ] T4.2.4: Creator dashboard (4h)

**Tipping System** (4 SP)
- [ ] T4.2.5: Tip button on tracks (2h)
- [ ] T4.2.6: Tip transaction handling (4h)
- [ ] T4.2.7: Tip notifications (2h)
- [ ] T4.2.8: Tip leaderboard (3h)

**Referral Program** (3 SP)
- [ ] T4.2.9: Referral code generation (2h)
- [ ] T4.2.10: Referral tracking (3h)
- [ ] T4.2.11: Referral rewards (4h)
- [ ] T4.2.12: Referral dashboard (3h)

---

### T4.3: Monitoring & Observability 📊
**Story Points**: 10 SP  
**Приоритет**: P1 (Высокий)

#### Tasks

**Application Monitoring** (4 SP)
- [ ] T4.3.1: Setup error tracking (Sentry?) (3h)
- [ ] T4.3.2: Custom metrics collection (4h)
- [ ] T4.3.3: Performance monitoring dashboard (4h)
- [ ] T4.3.4: Alert configuration (3h)

**Edge Functions Monitoring** (3 SP)
- [ ] T4.3.5: Structured logging (3h)
- [ ] T4.3.6: Function metrics (4h)
- [ ] T4.3.7: Error aggregation (3h)

**User Analytics** (3 SP)
- [ ] T4.3.8: Event tracking (4h)
- [ ] T4.3.9: Analytics dashboard (5h)
- [ ] T4.3.10: Conversion funnels (3h)

---

### T4.4: Documentation & Guides 📚
**Story Points**: 8 SP  
**Приоритет**: P1 (Высокий)

#### Tasks

**User Documentation** (4 SP)
- [ ] T4.4.1: Complete user guide (8h)
- [ ] T4.4.2: Video tutorials (12h)
- [ ] T4.4.3: FAQ expansion (4h)
- [ ] T4.4.4: Best practices guide (4h)

**Developer Documentation** (4 SP)
- [ ] T4.4.5: Architecture documentation (6h)
- [ ] T4.4.6: API reference (8h)
- [ ] T4.4.7: Contributing guide update (3h)
- [ ] T4.4.8: Troubleshooting guide (4h)

---

### T4.5: Security Enhancements 🔒
**Story Points**: 5 SP  
**Приоритет**: P2 (Средний)

#### Tasks

**Security Headers** (2 SP)
- [ ] T4.5.1: Implement CSP (3h)
- [ ] T4.5.2: Add security headers (2h)
- [ ] T4.5.3: Configure CORS properly (2h)

**Content Security** (2 SP)
- [ ] T4.5.4: Input sanitization audit (3h)
- [ ] T4.5.5: XSS protection (3h)
- [ ] T4.5.6: SQL injection prevention audit (2h)

**Rate Limiting** (1 SP)
- [ ] T4.5.7: Global API rate limiter (3h)
- [ ] T4.5.8: Per-endpoint limits (2h)

---

## 📋 Метрики успеха

### Целевые показатели (к концу Phase 4)

| Метрика | Текущее | Целевое | Измерение |
|---------|---------|---------|-----------|
| Bundle Size | 1.16 MB | <800 KB | Build output |
| TTI (4G) | ~4.5s | <3.5s | Lighthouse CI |
| FCP | ~2.1s | <1.8s | Lighthouse CI |
| LCP | ~3.8s | <2.5s | Lighthouse CI |
| Lighthouse Score | TBD | >90 | Lighthouse CI |
| Test Coverage | ~65% | >80% | Jest/Playwright |
| E2E Tests | ~10 | >50 | Playwright |
| Documentation Pages | ~50 | >80 | Docs count |
| User Satisfaction | TBD | >4.5/5 | Surveys |
| Inline Mode Usage | TBD | +200% | Analytics |
| Payment Conversion | TBD | +50% | Analytics |

---

## 🗓️ Timeline Summary

### Phase 1: Quick Wins (Dec 16 - Dec 29)
- ✅ Sprint 011 завершен (100%)
- ✅ Bundle size <950 KB
- ✅ Performance monitoring работает

### Phase 2: Inline & Payment (Dec 30 - Jan 19)
- ✅ Inline mode трансформирован
- ✅ Payment UX улучшен
- ✅ Mini App 2.0 features интегрированы

### Phase 3: Performance (Jan 20 - Feb 9)
- ✅ Bundle size <800 KB
- ✅ TTI <3.5s достигнут
- ✅ E2E тесты >50

### Phase 4: Scale (Feb 10 - Mar 31)
- ✅ Recommendations работают
- ✅ Monitoring настроен
- ✅ Documentation complete

---

## 🎯 Приоритизация

### Must Have (P0) - 70 SP
- T1.1: Sprint 011 завершение (13 SP)
- T1.2: Bundle size optimization (12 SP)
- T1.3: Performance monitoring (7 SP)
- T2.1: Inline mode enhancement (20 SP)
- T3.1: Bundle size phase 2 (12 SP)
- T3.2: Performance optimization (10 SP)

### Should Have (P1) - 60 SP
- T1.4: Error handling (3 SP)
- T2.2: Payment UX (15 SP)
- T3.3: E2E testing (12 SP)
- T4.3: Monitoring (10 SP)
- T4.4: Documentation (8 SP)

### Could Have (P2) - 40 SP
- T2.3: Mini App 2.0 (10 SP)
- T3.4: Edge Functions testing (6 SP)
- T4.1: Discovery (15 SP)
- T4.5: Security (5 SP)

### Won't Have (P3) - 12 SP
- T4.2: Advanced monetization (12 SP)

---

## 🚀 Следующие шаги

1. **Немедленно** (сегодня):
   - Начать T1.1 (Sprint 011 completion)
   - Начать T1.2 (Bundle size optimization)

2. **Эта неделя**:
   - Завершить Phase 1 Quick Wins
   - Настроить Lighthouse CI

3. **Следующая неделя**:
   - Начать T2.1 (Inline mode enhancement)
   - Планирование Payment UX improvements

4. **В течение месяца**:
   - Завершить Phase 1 и Phase 2
   - Достичь Bundle size <900 KB

---

## 📞 Контакты и обратная связь

Этот план является живым документом и будет обновляться по мере выполнения задач и получения обратной связи.

**Автор**: GitHub Copilot Agent  
**Дата создания**: 2025-12-16  
**Последнее обновление**: 2025-12-16

**Связанные документы**:
- [PROJECT_AUDIT_2025-12-16.md](./PROJECT_AUDIT_2025-12-16.md) - Полный аудит проекта
- [SPRINTS/SPRINT-025-TO-028-DETAILED-PLAN.md](../SPRINTS/SPRINT-025-TO-028-DETAILED-PLAN.md) - Текущий спринт план
- [ROADMAP.md](../ROADMAP.md) - Дорожная карта проекта
