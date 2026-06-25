# Testing Infrastructure Documentation

**Last Updated**: 2026-06-24

This document describes the comprehensive testing infrastructure for MusicVerse AI, including unit tests, E2E tests, API integration tests, and accessibility testing.

---

## 🧪 Overview

MusicVerse AI employs a multi-layered testing strategy to ensure code quality, user experience, and system reliability. The testing infrastructure covers:

- **Unit Tests**: 27+ tests for individual components and utilities
- **E2E Tests**: 62+ tests for complete user workflows
- **API Integration Tests**: 12+ tests for backend services
- **Accessibility Tests**: Automated WCAG compliance checks
- **Performance Tests**: Bundle size, Lighthouse, and load time monitoring

---

## 📋 Test Categories

### 1. Unit Tests (Jest)

**Framework**: Jest 30.2 with ts-jest preset  
**Environment**: jsdom  
**Coverage Threshold**: 70% for all metrics

#### Configuration

- **Config File**: `jest.config.js`
- **Setup File**: `src/__tests__/setup.ts`
- **Path Mapping**: `@/*` → `<rootDir>/src/*`

#### Test Discovery

```bash
src/__tests__/**/*.test.{ts,tsx}
tests/unit/**/*.test.{ts,tsx}
```

#### Coverage Areas

```javascript
collectCoverageFrom: [
  "src/hooks/**/*.{ts,tsx}",
  "src/components/**/*.{ts,tsx}",
  "!src/**/*.d.ts",
  "!src/**/*.stories.{ts,tsx}",
];
```

#### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode (development)
npm test -- --watch
```

#### Component Tests (27+ files)

- **Dialog**: Modal components, form dialogs
- **Library**: Track card, library components
- **Lyrics**: Lyrics sync, editor components
- **Studio**: Mixer, timeline, state management
- **Payment**: Credit card, payment buttons
- **Player**: Player hooks, controls, state
- **Social**: Comments, likes, follows
- **Utilities**: Beat snap, BPM detection, rate limiting

#### Performance Tests (4 specialized files)

- **Waveform Load**: ≤500ms cached, ≤2s uncached
- **Mixer Renders**: ≤2 re-renders per volume change
- **Scroll FPS**: Performance benchmarks
- **Memory Usage**: Leak detection

---

### 2. E2E Tests (Playwright)

**Framework**: Playwright 1.57  
**Test Directory**: `tests/e2e/`  
**Total Tests**: 62+ (including 9 hints-specific tests)

#### Browser Coverage

- **Desktop**: Chromium, Firefox, Safari, Edge, Chrome (1920×1080)
- **Mobile**: Pixel 5 (Chrome), iPhone 12 (Safari)
- **Total Profiles**: 7 different browser/device configurations

#### Configuration

- **Config File**: `playwright.config.ts`
- **Auto-Start**: Dev server with 120s timeout
- **Parallel**: Full parallel execution (except CI: workers=1)
- **Retries**: 2 on CI for flaky animation timing

#### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:mobile

# Run with visible browser
npm run test:e2e:headed

# Run with UI mode
npm run test:e2e:ui

# Run hints system tests only
npm run test:e2e:hints

# View HTML report
npm run test:e2e:report
```

#### Test Categories

**Core Features (25+ tests)**:

- `auth.spec.ts`: Authentication flows
- `player.spec.ts`: Player modes, queue, gestures (13 tests)
- `library.spec.ts`: Track library functionality
- `generation.spec.ts`: Music generation flow (10 tests)
- `social-features.spec.ts`: Social interactions
- `navigation.spec.ts`: App navigation
- `homepage.spec.ts`: Homepage discovery
- `storage.spec.ts`: Local storage management
- `cdn.spec.ts`: CDN functionality
- `ai-assistant.spec.ts`: AI assistant features
- `browser-compatibility.spec.ts`: Cross-browser testing

**Hints System (9 tests)**:

- `hints.spec.ts`: Basic hints functionality
- `hints.advanced.spec.ts`: Advanced scenarios
- `hints.a11y.spec.ts`: Accessibility compliance
- `hints.contrast.spec.ts`: WCAG contrast checks
- `hints.dark.spec.ts`: Dark mode compatibility
- `hints.mobile-safari.spec.ts`: iOS Safari optimization
- `hints.orientation.spec.ts`: Screen rotation
- `hints.reduced-motion.spec.ts`: Motion preferences
- `hints.telegram-safe-area.spec.ts`: Telegram safe areas

**Studio (10+ planned tests)**:

- `tests/e2e/studio/workflow.spec.ts`: Complete studio workflows
- Track loading, mixing, stem operations
- Section replacement, export functionality
- Keyboard shortcuts, mobile gestures

**Error Handling (8+ planned tests)**:

- `tests/e2e/error-handling.spec.ts`: Comprehensive error scenarios
- Network errors, auth failures, rate limiting
- Data corruption, quota exceeded, concurrent requests

#### Failure Artifacts

- **Screenshots**: Captured on failure only
- **Videos**: Retained on failure for debugging
- **Traces**: Full trace on first retry
- **HTML Report**: Comprehensive test results

---

### 3. API Integration Tests

**Framework**: Playwright (for API testing)  
**Test Directory**: `tests/integration/`  
**Total Tests**: 12+

#### Test Categories

**Suno API (4 tests)**:

- `tests/integration/suno-api.spec.ts`
- Music generation endpoint
- Status checking
- Callback handling
- Vocal separation

**Telegram Bot API (2 tests)**:

- `tests/integration/telegram-bot.spec.ts`
- /start command processing
- Deep link generation

**Payment APIs (3 tests)**:

- `tests/integration/payments.spec.ts`
- Tinkoff payment creation
- Webhook callbacks
- Subscription management

**Content APIs (3 tests)**:

- `tests/integration/content-apis.spec.ts`
- AI lyrics assistant
- Image generation
- MIDI transcription

#### Running Integration Tests

```bash
# Run all integration tests
npx playwright test tests/integration/

# Run specific API tests
npx playwright test tests/integration/suno-api.spec.ts
```

---

### 4. Accessibility Tests

**Framework**: axe-core + Pa11y  
**Configuration**: `.github/workflows/accessibility.yml`

#### Accessibility Testing Levels

**Level 1: Automated Scans (axe-core)**

- Runs on all key pages
- WCAG 2.1 AA compliance
- Critical/serious violations block merge
- Moderate/minor violations warn

**Level 2: Comprehensive Testing (Pa11y CI)**

- Multiple page coverage
- Regression detection
- Historical comparison

**Level 3: Manual Audits**

- Regular accessibility reviews
- Screen reader testing
- Keyboard navigation validation

#### Running Accessibility Tests

```bash
# Run local accessibility audit
node scripts/accessibility-audit.js

# Run in CI (automated)
# Triggered via .github/workflows/accessibility.yml
```

#### WCAG Compliance

- **Contrast Ratios**: ≥4.5:1 for normal text, ≥3:1 for large text
- **Touch Targets**: ≥44×44px (mobile)
- **Keyboard Navigation**: All interactive elements accessible
- **ARIA Labels**: Proper labels for screen readers
- **Focus Indicators**: Visible focus states

---

### 5. Performance Tests

**Framework**: Lighthouse CI + Custom benchmarks  
**Configuration**: `lighthouserc.json`

#### Performance Budgets

**Lighthouse Thresholds**:

- **Performance**: ≥75% (warn)
- **Accessibility**: ≥90% (error)
- **Best Practices**: ≥85% (warn)
- **SEO**: ≥85% (warn)

**Core Web Vitals**:

- **FCP**: ≤1.8s (error)
- **TTI**: ≤3.5s (error)
- **LCP**: ≤2.5s (error)
- **TBT**: ≤400ms (warn)
- **CLS**: ≤0.1 (error)

**Bundle Size Limits**:

- **Total Bundle**: 950 KB (gzip)
- **React Vendor**: 200 KB
- **Framer Motion**: 100 KB
- **Tone.js**: 150 KB
- **Wavesurfer**: 100 KB
- **TanStack Query**: 50 KB
- **Radix UI**: 80 KB
- **Studio Feature**: 200 KB
- **Lyrics Feature**: 150 KB
- **Generation Feature**: 180 KB

#### Running Performance Tests

```bash
# Run Lighthouse CI
npm run build
npx lhci autorun

# Check bundle size
npm run build && npm run size

# Detailed bundle analysis
npm run size:why
```

---

## 🔄 CI/CD Integration

### Quality Check Workflow

**File**: `.github/workflows/quality-check.yml`

**Runs on**: Pull requests to `develop` or `main`

**Steps**:

1. Checkout code
2. Setup Node.js with cache
3. Install dependencies
4. Run linter (`npm run lint`)
5. Run unit tests with coverage (`npm run test:coverage`)
6. Upload coverage artifacts

### Performance Monitoring Workflow

**File**: `.github/workflows/performance.yml`

**Runs on**: Push and pull requests to `main`

**Jobs**:

- **Lighthouse Audit**: Automated performance testing
- **Bundle Size Analysis**: Size limits and trend tracking

**Features**:

- Bundle size trend reporting in PR comments
- Automated alerts when approaching limits
- Historical comparison (30-day window)
- Build artifacts caching

### E2E Hints Workflow

**File**: `.github/workflows/e2e-hints.yml`

**Runs on**:

- Push to `main` (hints-related paths)
- Pull requests (hints-related paths)
- Manual dispatch

**Matrix**: Chromium, Mobile Chrome, Mobile Safari

**Features**:

- 2 retries for flaky animation timing
- Trace capture on all retries
- Screenshots/videos on failure
- 14-day artifact retention

---

## 📊 Test Coverage Summary

### Current Coverage (2026-06-24)

| Category          | Tests     | Coverage       | Status       |
| ----------------- | --------- | -------------- | ------------ |
| Unit Tests        | 27+       | 70%+           | ✅ Good      |
| E2E Tests         | 62+       | Critical paths | ✅ Excellent |
| Integration Tests | 12+       | API endpoints  | ✅ Good      |
| Accessibility     | Automated | WCAG AA        | ✅ Good      |
| Performance       | Budgets   | All limits     | ✅ Good      |

### Coverage Gaps

**Identified Areas for Improvement**:

- Limited API integration testing beyond 12 core endpoints
- No visual regression testing (Percy/Chromatic)
- No load/stress testing for concurrent users
- Limited responsive design matrix testing

---

## 🛠️ Development Workflow

### Pre-Commit Testing

**Hook**: `.husky/pre-commit`

**Steps**:

1. Check if build artifacts exist
2. Run `npm run build` if needed (120s timeout)
3. Run `npm run size` for bundle validation
4. Prevent commits if checks fail

### Before Pushing

```bash
# 1. Run linting
npm run lint

# 2. Run unit tests
npm test

# 3. Run E2E tests (if changed)
npm run test:e2e

# 4. Check bundle size
npm run build && npm run size

# 5. Test accessibility (if changed)
node scripts/accessibility-audit.js
```

### CI/CD Pipeline

1. **Quality Check**: Lint + Unit tests
2. **Performance Monitoring**: Lighthouse + Bundle size
3. **E2E Tests**: Critical user workflows
4. **Security Scanning**: Dependency + Secret scanning (planned)
5. **Accessibility**: Automated WCAG checks (planned)

---

## 📝 Best Practices

### Writing Unit Tests

- **Test behavior, not implementation**
- **Use descriptive test names**
- **Follow AAA pattern**: Arrange, Act, Assert
- **Mock external dependencies**
- **Test edge cases and error conditions**

### Writing E2E Tests

- **Focus on user workflows**
- **Use stable selectors** (data-testid, aria-label)
- **Wait for network idle** before assertions
- **Handle async operations properly**
- **Test mobile and desktop** separately

### Test Organization

```
tests/
├── e2e/
│   ├── auth.spec.ts
│   ├── player.spec.ts
│   ├── generation.spec.ts
│   ├── studio/
│   │   └── workflow.spec.ts
│   └── hints*.spec.ts (9 files)
├── integration/
│   ├── suno-api.spec.ts
│   ├── telegram-bot.spec.ts
│   └── payments.spec.ts
└── unit/
    ├── components/
    ├── hooks/
    └── utils/
```

---

## 🔧 Troubleshooting

### Common Issues

**Issue**: E2E tests fail with "timeout"  
**Solution**: Increase timeout or check for network issues

**Issue**: Bundle size exceeds limit  
**Solution**: Run `npm run size:why` for analysis

**Issue**: Accessibility tests fail  
**Solution**: Check contrast ratios and ARIA labels

**Issue**: Unit tests fail in CI but not locally  
**Solution**: Check timezone and environment variables

---

## 📚 Additional Resources

- **Jest Documentation**: https://jestjs.io/
- **Playwright Documentation**: https://playwright.dev/
- **axe-core Documentation**: https://www.deque.com/axe/
- **Lighthouse CI**: https://github.com/GoogleChrome/lighthouse-ci
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/

---

**Last Updated**: 2026-06-24  
**Maintained By**: Development Team  
**Version**: 2.0.0
