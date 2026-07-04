# MusicVerse AI - Developer Guide

**Last Updated**: 2026-01-04
**Target Audience**: Developers joining the project or contributing

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment](#development-environment)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Code Style & Standards](#code-style--standards)
6. [Testing](#testing)
7. [Debugging](#debugging)
8. [Common Tasks](#common-tasks)
9. [Performance Guidelines](#performance-guidelines)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- **Node.js**: v18+ (LTS recommended)
- **npm**: v9+
- **Git**: Latest version
- **VS Code**: Recommended IDE
- **Telegram**: For testing Mini App integration

### Initial Setup

```bash
# 1. Clone the repository
git clone https://github.com/HOW2AI-AGENCY/aimusicverse.git
cd aimusicverse

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# 4. Start development server
npm run dev

# 5. Open in browser
# Visit http://localhost:8080
```

### Required Environment Variables

```env
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...

# Sentry (Optional - for error tracking)
VITE_SENTRY_DSN=https://...@sentry.io/...

# Telegram (Server-side only)
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...  # DO NOT expose client-side
SUNO_API_KEY=sk-...                   # DO NOT expose client-side
```

---

## Development Environment

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "orta.vscode-jest",
    "unifiedjs.vscode-mdx"
  ]
}
```

### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### Browser DevTools

**React DevTools**

- Install browser extension
- Use Components tab to inspect React tree
- Use Profiler tab for performance analysis

**Redux DevTools**

- Works with Zustand via middleware
- Enable in development mode only

---

## Project Structure

### Directory Overview

```
aimusicverse/
├── .github/             # GitHub Actions, templates, agents
├── .kilocode/           # Kilocode workflows
├── .specify/            # Specification templates
├── ADR/                 # Architecture Decision Records
├── docs/                # Documentation
│   ├── architecture/    # System architecture docs
│   ├── guides/          # How-to guides
│   ├── integrations/    # Integration docs
│   └── archive/         # Historical docs
├── specs/               # Technical specifications
│   ├── sprint-011-social-features/
│   ├── sprint-014-platform-integration-export/
│   └── sprint-015-quality-testing-performance/
├── SPRINTS/             # Sprint planning and tracking
│   ├── completed/       # Completed sprint archives
│   └── *.md             # Active sprint docs
├── public/              # Static assets
│   ├── service-worker.js
│   └── assets/
├── src/                 # Application source code
│   ├── assets/          # Images, fonts
│   ├── components/      # React components (92 subdirs)
│   │   ├── ui/          # shadcn/ui components
│   │   ├── player/      # Audio player components
│   │   ├── library/     # Track library
│   │   ├── stem-studio/ # Stem separation
│   │   └── ...
│   ├── contexts/        # React Context providers (10 contexts)
│   ├── hooks/           # Custom hooks (263 hooks)
│   │   ├── audio/       # Audio system hooks
│   │   ├── studio/      # Studio production hooks
│   │   ├── generation/  # Generation hooks
│   │   └── ...
│   ├── pages/           # Page components (33+ pages)
│   ├── stores/          # Zustand stores (8 stores)
│   ├── services/        # Business logic services
│   ├── lib/             # Utility functions
│   ├── types/           # TypeScript types
│   ├── config/          # Configuration files
│   ├── constants/       # Constants
│   ├── integrations/    # Third-party integrations
│   │   └── supabase/    # Supabase client & queries
│   ├── styles/          # Global styles
│   └── workers/         # Web Workers
├── supabase/            # Backend code
│   ├── functions/       # Edge Functions (100+)
│   └── migrations/      # Database migrations (50+)
├── tests/               # Test files
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── e2e/             # Playwright E2E tests
├── coverage/            # Test coverage reports
└── dist/                # Build output (gitignored)
```

### Key Files

```
aimusicverse/
├── README.md                 # Project overview
├── PROJECT_STATUS.md         # Single source of truth
├── DOCUMENTATION_INDEX.md    # Documentation map
├── CHANGELOG.md              # Version history
├── CONTRIBUTING.md           # Contribution guidelines
├── package.json              # Dependencies & scripts
├── tsconfig.json             # TypeScript config
├── vite.config.ts            # Vite build config
├── tailwind.config.ts        # Tailwind CSS config
├── .eslintrc.js              # ESLint rules
├── .prettierrc.json          # Prettier config
├── playwright.config.ts      # E2E test config
└── jest.config.cjs           # Unit test config
```

---

## Development Workflow

### Daily Workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Start dev server
npm run dev

# 4. Make changes
# ... code, code, code ...

# 5. Run tests
npm test
npm run test:e2e

# 6. Check linting
npm run lint

# 7. Format code
npm run format

# 8. Commit changes
git add .
git commit -m "feat: add new feature"

# 9. Push to remote
git push origin feature/my-feature

# 10. Create Pull Request
# ... create PR on GitHub ...
```

### Branch Naming Convention

```
feature/description    # New features
fix/description        # Bug fixes
refactor/description   # Code refactoring
docs/description       # Documentation updates
test/description       # Test additions/updates
chore/description      # Maintenance tasks
```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Testing
- `chore`: Maintenance

**Examples**:

```
feat(player): add crossfade between tracks

Implements crossfade functionality using Web Audio API.
Duration is configurable (default 0.3s).

Closes #123

---

fix(stem-studio): prevent audio drift in multi-track playback

Adds drift detection and automatic re-sync when drift exceeds 0.1s.

Fixes #456
```

---

## Code Style & Standards

### TypeScript Guidelines

**1. Always use strict mode**

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**2. Prefer interfaces over types for objects**

```typescript
// ✅ Good
interface Track {
  id: string;
  title: string;
  duration: number;
}

// ❌ Avoid (for objects)
type Track = {
  id: string;
  title: string;
  duration: number;
};
```

**3. Use explicit return types for functions**

```typescript
// ✅ Good
function calculateDuration(start: number, end: number): number {
  return end - start;
}

// ❌ Avoid
function calculateDuration(start: number, end: number) {
  return end - start;
}
```

**4. Use const assertions for literal types**

```typescript
// ✅ Good
const AUDIO_FORMATS = ["mp3", "wav", "ogg"] as const;
type AudioFormat = (typeof AUDIO_FORMATS)[number];

// ❌ Avoid
const AUDIO_FORMATS = ["mp3", "wav", "ogg"];
```

### React Component Guidelines

**1. Use function components with hooks**

```typescript
// ✅ Good
function TrackCard({ track }: { track: Track }) {
  const [isPlaying, setIsPlaying] = useState(false);
  return <div>...</div>;
}

// ❌ Avoid class components
class TrackCard extends React.Component {
  // ...
}
```

**2. Extract complex logic into custom hooks**

```typescript
// ✅ Good
function TrackCard({ track }) {
  const { isPlaying, play, pause } = useAudioPlayer(track);
  return <button onClick={isPlaying ? pause : play}>...</button>;
}

// ❌ Avoid inline complex logic
function TrackCard({ track }) {
  const [audio] = useState(() => new Audio(track.url));
  useEffect(() => {
    // ... complex audio logic ...
  }, []);
}
```

**3. Use React.memo for expensive components**

```typescript
export const TrackCard = React.memo(
  ({ track }: { track: Track }) => {
    return <div>...</div>;
  },
  (prev, next) => prev.track.id === next.track.id
);
```

**4. Prefer compound components for complex UI**

```typescript
export const Dialog = ({ children }) => <div>{children}</div>;
Dialog.Title = ({ children }) => <h2>{children}</h2>;
Dialog.Content = ({ children }) => <div>{children}</div>;
Dialog.Actions = ({ children }) => <div>{children}</div>;

// Usage
<Dialog>
  <Dialog.Title>Delete Track</Dialog.Title>
  <Dialog.Content>Are you sure?</Dialog.Content>
  <Dialog.Actions>
    <Button>Cancel</Button>
    <Button>Delete</Button>
  </Dialog.Actions>
</Dialog>
```

### Styling Guidelines

**1. Use Tailwind CSS utilities**

```tsx
// ✅ Good
<div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-md">
  ...
</div>

// ❌ Avoid inline styles
<div style={{ display: 'flex', padding: '16px' }}>
  ...
</div>
```

**2. Use cn() for conditional classes**

```typescript
import { cn } from '@/lib/utils';

<button
  className={cn(
    'rounded-lg px-4 py-2',
    isActive && 'bg-primary text-white',
    isDisabled && 'opacity-50 cursor-not-allowed'
  )}
>
  Click me
</button>
```

**3. Extract repeated styles into components**

```typescript
// src/components/ui/card.tsx
export const Card = ({ className, ...props }) => (
  <div
    className={cn('rounded-lg border bg-card p-6 shadow-sm', className)}
    {...props}
  />
);
```

### State Management Guidelines

**1. Use Zustand for global state**

```typescript
// src/stores/playerStore.ts
import { create } from "zustand";

interface PlayerState {
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isPlaying: false,
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
}));
```

**2. Use TanStack Query for server state**

```typescript
import { useQuery } from "@tanstack/react-query";

function useTrack(trackId: string) {
  return useQuery({
    queryKey: ["track", trackId],
    queryFn: () => fetchTrack(trackId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

**3. Use React Hook Form for form state**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  prompt: z.string().min(10),
  style: z.string(),
});

function GenerateForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  return <form>...</form>;
}
```

---

## Testing

### Unit Testing (Jest)

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test:coverage

# Run specific test file
npm test src/hooks/usePlayerStore.test.ts
```

**Example Test**:

```typescript
// src/hooks/usePlayerStore.test.ts
import { renderHook, act } from "@testing-library/react";
import { usePlayerStore } from "./usePlayerStore";

describe("usePlayerStore", () => {
  it("should play track", () => {
    const { result } = renderHook(() => usePlayerStore());

    act(() => {
      result.current.play();
    });

    expect(result.current.isPlaying).toBe(true);
  });

  it("should pause track", () => {
    const { result } = renderHook(() => usePlayerStore());

    act(() => {
      result.current.play();
      result.current.pause();
    });

    expect(result.current.isPlaying).toBe(false);
  });
});
```

### E2E Testing (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Run mobile tests
npm run test:e2e:mobile

# Interactive UI mode
npm run test:e2e:ui

# View test report
npm run test:e2e:report
```

**Example E2E Test**:

```typescript
// tests/e2e/player.spec.ts
import { test, expect } from "@playwright/test";

test("should play track", async ({ page }) => {
  await page.goto("/library");

  // Click first track
  await page.locator('[data-testid="track-card"]').first().click();

  // Click play button
  await page.locator('[data-testid="play-button"]').click();

  // Verify playing state
  await expect(page.locator('[data-testid="pause-button"]')).toBeVisible();
});
```

---

## Debugging

### Browser DevTools

**Console Logging** (use logger utility):

```typescript
import { logger } from "@/lib/logger";

// Development only
logger.debug("Detailed debug info", { userId, trackId });
logger.info("Informational message");
logger.warn("Warning message");
logger.error("Error message", error);

// Production: only errors are logged to Sentry
```

**React DevTools**:

- Inspect component props and state
- Trace component re-renders
- Profile performance

**Network Tab**:

- Monitor API requests
- Check request/response payloads
- Debug failed requests

### VS Code Debugging

**Launch Configuration** (`.vscode/launch.json`):

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:8080",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

### Common Debug Scenarios

**1. Audio not playing**

```typescript
// Check audio element state
const audio = audioRef.current;
console.log({
  src: audio.src,
  readyState: audio.readyState,
  error: audio.error,
  volume: audio.volume,
  muted: audio.muted,
});
```

**2. React Query cache issues**

```typescript
import { useQueryClient } from "@tanstack/react-query";

function Debug() {
  const queryClient = useQueryClient();

  // Inspect cache
  console.log(queryClient.getQueryData(["tracks"]));

  // Invalidate cache
  queryClient.invalidateQueries(["tracks"]);
}
```

**3. Zustand store state**

```typescript
import { usePlayerStore } from "@/stores/playerStore";

function Debug() {
  const state = usePlayerStore();
  console.log("Player state:", state);
}
```

---

## Common Tasks

### Adding a New Page

```bash
# 1. Create page component
touch src/pages/MyNewPage.tsx
```

```typescript
// src/pages/MyNewPage.tsx
export default function MyNewPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">My New Page</h1>
    </div>
  );
}
```

```typescript
// 2. Add route in App.tsx
import MyNewPage from './pages/MyNewPage';

<Route path="/my-new-page" element={<MyNewPage />} />
```

### Adding a New Hook

```typescript
// src/hooks/useMyHook.ts
import { useState, useEffect } from "react";

export function useMyHook() {
  const [value, setValue] = useState(null);

  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    };
  }, []);

  return { value, setValue };
}
```

### Adding a Database Migration

```bash
# Create migration file
# Format: supabase/migrations/YYYYMMDDHHMMSS_description.sql
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_add_new_column.sql
```

```sql
-- Add column
ALTER TABLE tracks ADD COLUMN new_field TEXT;

-- Create index
CREATE INDEX idx_tracks_new_field ON tracks(new_field);
```

### Adding an Edge Function

```bash
# Create function directory
mkdir -p supabase/functions/my-function

# Create function file
touch supabase/functions/my-function/index.ts
```

```typescript
// supabase/functions/my-function/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { data } = await req.json();

  return new Response(JSON.stringify({ result: "success" }), { headers: { "Content-Type": "application/json" } });
});
```

---

## Performance Guidelines

### 1. Lazy Load Heavy Components

```typescript
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
```

### 2. Memoize Expensive Computations

```typescript
const sortedTracks = useMemo(() => {
  return tracks.sort((a, b) => a.title.localeCompare(b.title));
}, [tracks]);
```

### 3. Use Virtual Scrolling for Long Lists

```typescript
import { Virtuoso } from 'react-virtuoso';

<Virtuoso
  data={tracks}
  itemContent={(index, track) => <TrackRow track={track} />}
/>
```

### 4. Optimize Images

```typescript
<LazyImage
  src={track.cover_url}
  alt={track.title}
  className="h-48 w-48"
/>
```

### 5. Debounce User Input

```typescript
import { useDebouncedValue } from "use-debounce";

const [searchTerm, setSearchTerm] = useState("");
const [debouncedTerm] = useDebouncedValue(searchTerm, 300);
```

---

## Troubleshooting

### Common Issues

**1. "Cannot access 't' before initialization" (Tone.js)**

```typescript
// ❌ BAD - imports Tone at module level
import * as Tone from "tone";

// ✅ GOOD - dynamic import
async function useSynth() {
  const Tone = await import("tone");
  const synth = new Tone.Synth().toDestination();
}
```

**2. React Query cache not updating**

```typescript
// Invalidate after mutation
mutate(data, {
  onSuccess: () => {
    queryClient.invalidateQueries(["tracks"]);
  },
});
```

**3. Audio playback issues in iOS**

```typescript
// Require user interaction before playing
const playAudio = async () => {
  try {
    await audio.play();
  } catch (error) {
    // iOS requires user gesture
    console.error("Playback failed:", error);
  }
};
```

**4. Telegram WebApp API not available**

```typescript
// Check if running in Telegram
if (window.Telegram?.WebApp) {
  const telegram = window.Telegram.WebApp;
  telegram.ready();
} else {
  console.warn("Not running in Telegram WebApp");
}
```

---

## Resources

### Official Documentation

- [React 19 Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://github.com/pmndrs/zustand)

### Project Documentation

- [Architecture Guide](../ARCHITECTURE_HUB.md)
- [Hooks Reference](./HOOKS_REFERENCE.md)
- API Reference (см. [SUNO_API.md](./SUNO_API.md))
- [Database Schema](./DATABASE.md)

### Community

- [GitHub Issues](https://github.com/HOW2AI-AGENCY/aimusicverse/issues)
- [Telegram Support](https://t.me/musicverse_support)

---

**Happy Coding! 🎵**
