# MusicVerse AI

<div align="center">

![MusicVerse AI](https://img.shields.io/badge/MusicVerse-AI-blue)
![Telegram Mini App](https://img.shields.io/badge/Telegram-Mini_App-26A5E4)
![React](https://img.shields.io/badge/React-19.2-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)
![Vite](https://img.shields.io/badge/Vite-5-646CFF)
![Supabase](https://img.shields.io/badge/Supabase-2.86-3ECF8E)

**AI-powered music creation platform built as Telegram Mini App**

[Сrypto](#) • [Features](#features) • [Architecture](#architecture) • [Documentation](#documentation) • [Development](#development)

</div>

---

## 🎯 About

MusicVerse AI is a professional AI-powered music creation platform that enables users to generate, edit, and share music using advanced AI models. Built as a Telegram Mini App for seamless integration with Telegram ecosystem.

### Key Capabilities

- 🤖 **AI Music Generation** — Suno AI v5 with 277+ styles, custom lyrics, instrumental tracks
- 🎛️ **Professional Studio** — Mixer, timeline, stem separation, audio editing
- 📝 **AI Lyrics Assistant** — 10+ tools for lyric writing and editing
- 🎵 **Audio Processing** — MIDI transcription, beat detection, key analysis
- 👥 **Social Features** — Profiles, comments, likes, follows, activity feed
- 🎮 **Gamification** — Daily streaks, levels, achievements, leaderboards
- 💳 **Monetization** — Tinkoff payments (RUB), credit system, subscriptions
- 📱 **Mobile-First** — Optimized for Telegram Mini App with haptics and touch gestures

---

## 📊 Project Status

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Users | 574 | 1,000+ | 🟡 57% |
| Tracks Generated | 1,666+ | 5,000+ | 🟡 33% |
| Monthly Generations | 1,217 | 2,000+ | 🟡 61% |
| **Generation Success Rate** | **~88%** | **>92%** | 🔴 **Improving** |
| DAU | ~25 | 50+ | 🟡 50% |

**Overall Health**: 🟢 95/100 — Production Ready

**Current Sprint**: [Sprint A — Reliability & Stability](docs/SPRINT_A_PROGRESS.md)

---

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 19.2 + TypeScript 5.9 + Vite 5.0
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI/ML**: Suno API (music generation), Tone.js (audio synthesis)
- **State Management**: Zustand + TanStack Query
- **UI Components**: Radix UI + shadcn/ui + Tailwind CSS
- **Testing**: Jest (unit), Playwright (E2E), Vitest (component)
- **Audio**: wavesurfer.js, Tone.js, Web Audio API
- **Monitoring**: Sentry, custom logging

### Project Structure

```
src/
├── api/          # API clients and integrations
├── components/   # 180+ React components
├── hooks/        # 180+ custom hooks
├── pages/        # 38+ page components
├── stores/       # Zustand state management
├── lib/          # Utilities, helpers, optimizations
├── types/        # TypeScript definitions
└── workers/      # Web Workers for heavy tasks

supabase/
├── functions/    # 110+ Edge Functions (Deno)
├── migrations/   # Database schema migrations
└── config.toml   # Supabase configuration

docs/             # 65+ documentation files
tests/            # Unit and E2E tests
```

### Key Features

1. **Music Generation Pipeline**
   - SunoAI v5 integration with model fallback (V5 → V4_5PLUS → V4_5 → V4 → V3_5)
   - Exponential backoff retry (3 attempts, 1s-8s delays)
   - 30-second timeout protection
   - Automatic error recovery and user-friendly messages

2. **Performance Optimizations**
   - Bundle splitting: vendor-react, vendor-framer, vendor-tone, etc.
   - Lazy loading: 15+ heavy components
   - React.memo: TrackCard, MixerChannel, Waveform
   - Waveform caching: IndexedDB + LRU (7-day TTL)
   - RAF-based playback with optimized time updates

3. **Type Safety**
   - Branded types: `TrackId`, `UserId`, `StemId`
   - Type-safe audio context wrapper
   - Comprehensive error typing: `AppError`, `NetworkError`, `APIError`

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22.15+
- npm 10.8+
- Supabase CLI (for local development)

### Installation

```bash
# Clone repository
git clone https://github.com/HOW2AI-AGENCY/aimusicverse.git
cd aimusicverse

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev              # Start Vite dev server (port 8080)
npm run build            # Production build
npm run preview          # Preview production build

# Testing
npm test                 # Run Jest unit tests
npm run test:coverage    # Run with coverage report
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # Run E2E tests with UI

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier

# Bundle Analysis
npm run size             # Check bundle sizes
npm run size:why         # Analyze bundle composition
```

---

## 📚 Documentation

### Core Documentation

- [Architecture](docs/ARCHITECTURE.md) — System architecture and design patterns
- [Performance Optimization](docs/PERFORMANCE_OPTIMIZATION.md) — Optimization strategies
- [Bundle Optimization](docs/BUNDLE_OPTIMIZATION.md) — Bundle splitting and tree-shaking
- [Testing Infrastructure](docs/TESTING_INFRASTRUCTURE.md) — Testing strategy and setup
- [Error Handling](docs/ERROR_HANDLING_INFRASTRUCTURE.md) — Error handling patterns
- [Database Schema](docs/DATABASE.md) — Supabase schema and relationships

### Feature Documentation

- [AI Lyrics Assistant](docs/AI_LYRICS_ASSISTANT.md)
- [Stem Studio](docs/STUDIO.md)
- [Telegram Bot](docs/TELEGRAM_BOT_ARCHITECTURE.md)
- [Payments](docs/TELEGRAM_PAYMENTS.md)
- [Mobile Components](docs/MOBILE_COMPONENTS.md)

### Development Guides

- [Developer Guide](docs/DEVELOPER_GUIDE.md)
- [Quick Start](docs/QUICK_START.md)
- [Design System](docs/DESIGN_SYSTEM_COMPREHENSIVE.md)
- [Navigation System](docs/NAVIGATION_SYSTEM.md)

### Sprint Progress

- [Sprint A: Reliability & Stability](docs/SPRINT_A_PROGRESS.md) — Current sprint

---

## 🎨 Design System

- **Design Tokens**: CSS variables for consistent theming
- **Component Library**: shadcn/ui + custom components
- **Typography**: Custom font scale (see `src/Typography.mdx`)
- **Colors**: Semantic color system (see `src/Colors.mdx`)
- **Glassmorphism**: Consistent glass effects across components
- **Touch Targets**: 44x44px minimum for mobile
- **Safe Areas**: iOS/Android safe area handling

---

## 🧪 Testing

### Test Coverage

- **Unit Tests**: 27+ test files (Jest + Testing Library)
- **E2E Tests**: 62+ tests (Playwright, 7 browser/device profiles)
- **Component Tests**: Storybook with interactions
- **Performance Tests**: 4 specialized benchmark files
- **Accessibility**: axe-core integration, WCAG 2.1 AA compliance

### Running Tests

```bash
# Unit tests with coverage
npm run test:coverage

# E2E tests (all browsers)
npm run test:e2e

# E2E tests (specific browser)
npm run test:e2e:chromium
npm run test:e2e:mobile

# Visual regression
npm run test:e2e:hints
```

---

## 🔧 Configuration

### Key Configuration Files

- `vite.config.ts` — Vite build configuration, code splitting
- `tsconfig.json` — TypeScript configuration
- `tailwind.config.ts` — Tailwind CSS theme
- `playwright.config.ts` — E2E test setup
- `jest.config.js` — Unit test setup
- `eslint.config.js` — Linting rules
- `lighthouserc.json` — Performance budgets

### Environment Variables

```env
SUPABASE_URL=           # Supabase project URL
SUPABASE_ANON_KEY=      # Supabase anonymous key
SUNO_API_KEY=           # Suno API key
TELEGRAM_BOT_TOKEN=     # Telegram bot token
MINI_APP_URL=           # Mini app URL
```

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Create feature branch from `main`
2. Make changes and test locally
3. Run `npm run lint` and `npm run format`
4. Commit with descriptive message
5. Push and create pull request

---

## 📈 Roadmap

### Q2 2026 (April-June)

- [x] ~~Platform integrations (Spotify, Apple Music)~~ — Research phase
- [x] ~~Public API development~~ — Planning
- [ ] Spec 032: Professional UI enhancements
- [ ] Spec 031: Mobile Studio V2

### Q3 2026 (July-September)

- [ ] Platform integrations launch
- [ ] Public API beta
- [ ] Advanced collaboration features
- [ ] Enhanced analytics dashboard

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🙏 Acknowledgments

- [Suno AI](https://suno.com) — Music generation API
- [Supabase](https://supabase.com) — Backend infrastructure
- [Telegram](https://telegram.org) — Mini App platform
- [shadcn/ui](https://ui.shadcn.com) — Component library
- [Radix UI](https://www.radix-ui.com) — Accessible primitives

---

<div align="center">

Made with ❤️ by MusicVerse Team

[Website](https://musicspace.vercel.app) • [Telegram](https://t.me/musicspaceapp) • [Twitter](https://twitter.com/musicspaceapp)

</div>