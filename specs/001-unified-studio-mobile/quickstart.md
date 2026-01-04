# Quickstart Guide: Unified Studio Mobile

**Feature**: Sprint 030 - Unified Studio Mobile  
**Branch**: `001-unified-studio-mobile`  
**Date**: 2026-01-04  
**For**: Developers implementing or extending the unified studio

---

## Overview

This guide helps you quickly set up, understand, and work with the Unified Studio Mobile codebase. It covers installation, architecture overview, common workflows, and troubleshooting.

**Read time**: 15 minutes  
**Prerequisites**: Node.js 18+, basic React/TypeScript knowledge

---

## Table of Contents

1. [Setup](#setup)
2. [Architecture Overview](#architecture-overview)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Testing](#testing)
6. [Common Tasks](#common-tasks)
7. [Troubleshooting](#troubleshooting)
8. [Resources](#resources)

---

## Setup

### 1. Install Dependencies

```bash
cd /path/to/aimusicverse
npm install
```

**New dependency (Phase 2)**:
```bash
npm install react-window @types/react-window
```

### 2. Environment Variables

No new environment variables required. Uses existing `.env.local`:

```bash
# Already configured
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database Setup

**Feature flag table** (run in Supabase SQL editor):

```sql
-- Create feature_flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INTEGER DEFAULT 0 
    CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert unified studio flag
INSERT INTO feature_flags (flag_name, enabled, rollout_percentage)
VALUES ('unified_studio_mobile_enabled', FALSE, 0)
ON CONFLICT (flag_name) DO NOTHING;
```

### 4. Start Development Server

```bash
npm run dev
```

Navigate to: `http://localhost:5173/studio/track/123?unified=true`

**Query param `unified=true`** forces unified studio (bypasses feature flag).

---

## Architecture Overview

### Component Hierarchy

```
UnifiedStudioMobile (Root)
├─ UnifiedStudioHeader
├─ MobileStudioLayout (Tabs)
│  └─ TabContent (lazy-loaded)
│     ├─ PlayerTab
│     ├─ SectionsTab
│     ├─ StemsTab
│     ├─ MixerTab
│     └─ ActionsTab
├─ MobileDAWTimeline
└─ AIActionsFAB
```

### State Management

- **Zustand Store**: `useUnifiedStudioStore` (global state)
- **TanStack Query**: Server state (tracks, stems, versions)
- **Local Storage**: UI preferences (activeTab, zoom)

**Key store slices**:
- `playback` - Audio player state
- `tracks` - Track control state (mute/solo/volume)
- `ui` - Tab navigation, timeline, FAB, loading
- `history` - Undo/redo stacks
- `effects` - Audio effect chains
- `aiOperations` - Active AI tasks

### Data Flow

```
Component
  ↓ uses
Hook (useUnifiedStudio)
  ↓ reads/writes
Zustand Store
  ↓ persists
LocalStorage (UI only)

Component
  ↓ fetches
TanStack Query
  ↓ calls
Supabase Client
  ↓ queries
Database
```

---

## Project Structure

```
specs/001-unified-studio-mobile/
├── plan.md              # Implementation plan (this sprint)
├── research.md          # Technical research
├── data-model.md        # Data structures
├── quickstart.md        # This guide
└── contracts/           # TypeScript contracts
    ├── components.ts    # Component prop interfaces
    ├── hooks.ts         # Hook API contracts
    └── stores.ts        # Store interfaces

src/
├── components/
│   ├── studio/
│   │   ├── unified/              # NEW unified studio
│   │   │   ├── UnifiedStudioMobile.tsx
│   │   │   ├── MobileStudioLayout.tsx
│   │   │   ├── AIActionsFAB.tsx
│   │   │   └── ...
│   │   ├── timeline/
│   │   │   ├── MobileDAWTimeline.tsx
│   │   │   ├── TimelineGestureHandler.tsx
│   │   │   └── ...
│   │   └── tabs/                # Tab content
│   │       ├── PlayerTab.tsx
│   │       ├── SectionsTab.tsx
│   │       ├── StemsTab.tsx
│   │       ├── MixerTab.tsx
│   │       └── ActionsTab.tsx
│   └── stem-studio/             # REUSE (no changes)
│       ├── QuickCompare.tsx
│       ├── TrimDialog.tsx
│       └── ...
├── hooks/
│   └── studio/
│       ├── useUnifiedStudio.ts      # Main hook
│       ├── useSwipeNavigation.ts
│       ├── useStudioPerformance.ts
│       └── ...
├── stores/
│   └── useUnifiedStudioStore.ts     # EXTEND (add UI slice)
└── types/
    └── studio.ts                    # Type definitions

tests/
├── unit/
│   └── components/studio/unified/   # Component tests
├── integration/
│   └── studio/                      # Integration tests
└── e2e/
    └── unified-studio/              # Playwright tests
```

---

## Development Workflow

### Phase-by-Phase Approach

**Current Status**: Phase 0 Complete ✅  
**Next**: Phase 1 (Design & Contracts) → Phase 2 (Implementation)

**Workflow**:
1. **Read spec** (`spec.md`) - Understand requirements
2. **Read plan** (`plan.md`) - Understand implementation strategy
3. **Check contracts** (`contracts/`) - See TypeScript interfaces
4. **Start implementation** - Follow phase tasks in plan.md
5. **Write tests first** (TDD for P1 components)
6. **Implement component**
7. **Run tests** - Ensure passing
8. **Manual test** - Verify in browser
9. **Create Storybook story** (optional but recommended)
10. **Code review** - 2 approvals required

### TDD Workflow (for P1 Components)

```bash
# 1. Create test file
touch src/components/studio/unified/__tests__/UnifiedStudioMobile.test.tsx

# 2. Write failing test
# (See example below)

# 3. Run test - should FAIL ❌
npm test UnifiedStudioMobile

# 4. Implement component
# (Component code)

# 5. Run test - should PASS ✅
npm test UnifiedStudioMobile

# 6. Refactor if needed (tests still passing)
```

**Example TDD test**:

```typescript
// src/components/studio/unified/__tests__/UnifiedStudioMobile.test.tsx
import { render, screen } from '@testing-library/react';
import { UnifiedStudioMobile } from '../UnifiedStudioMobile';

describe('UnifiedStudioMobile', () => {
  it('should render with default player tab active', () => {
    render(<UnifiedStudioMobile trackId="123" mode="track" />);
    
    // Should render header
    expect(screen.getByRole('banner')).toBeInTheDocument();
    
    // Should render player tab as active
    const playerTab = screen.getByRole('tab', { name: /player/i });
    expect(playerTab).toHaveAttribute('aria-selected', 'true');
  });
  
  it('should lazy load tab content on tab switch', async () => {
    const { getByRole } = render(<UnifiedStudioMobile trackId="123" mode="track" />);
    
    // Click sections tab
    fireEvent.click(getByRole('tab', { name: /sections/i }));
    
    // Should show loading skeleton
    expect(screen.getByTestId('tab-skeleton')).toBeInTheDocument();
    
    // Wait for lazy load
    await waitFor(() => {
      expect(screen.getByTestId('sections-tab-loaded')).toBeInTheDocument();
    });
  });
});
```

### Git Workflow

```bash
# 1. Create feature branch (already done)
git checkout 001-unified-studio-mobile

# 2. Make changes
# ... edit files ...

# 3. Stage & commit
git add src/components/studio/unified/UnifiedStudioMobile.tsx
git commit -m "feat(studio): implement UnifiedStudioMobile shell"

# 4. Push to remote
git push origin 001-unified-studio-mobile

# 5. Create PR when phase complete
# (via GitHub UI)
```

**Commit message format** (Conventional Commits):
- `feat(studio): add MobileDAWTimeline component`
- `fix(studio): resolve touch gesture conflict`
- `test(studio): add UnifiedStudioMobile tests`
- `refactor(studio): optimize tab switching performance`

---

## Testing

### Run Tests

```bash
# All tests
npm test

# Specific file
npm test UnifiedStudioMobile

# Watch mode
npm test -- --watch

# Coverage report
npm test:coverage
```

### Test Types

**Unit Tests** (40 tests target):
- Component rendering
- Hook state changes
- Pure functions
- Isolated logic

**Integration Tests** (15 tests target):
- Tab switching with state
- Audio playback across tabs
- Undo/redo functionality
- AI actions triggering

**E2E Tests** (5 tests target):
- Full user journeys
- Touch gestures
- Performance measurements
- Feature flag toggling

### Writing Tests

**Component test template**:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnifiedStudioMobile } from '../UnifiedStudioMobile';

describe('UnifiedStudioMobile', () => {
  it('should ...', () => {
    // Arrange
    const props = { trackId: '123', mode: 'track' as const };
    
    // Act
    render(<UnifiedStudioMobile {...props} />);
    
    // Assert
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
```

**Hook test template**:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useUnifiedStudio } from '../useUnifiedStudio';

describe('useUnifiedStudio', () => {
  it('should toggle play/pause', () => {
    const { result } = renderHook(() => 
      useUnifiedStudio({ mode: 'track', id: '123' })
    );
    
    // Initially not playing
    expect(result.current.playback.isPlaying).toBe(false);
    
    // Play
    act(() => {
      result.current.play();
    });
    
    expect(result.current.playback.isPlaying).toBe(true);
  });
});
```

---

## Common Tasks

### 1. Add a New Tab

**Steps**:

1. **Create tab component**:
   ```typescript
   // src/components/studio/tabs/NewTab.tsx
   export interface NewTabProps {
     trackId: string;
   }
   
   export function NewTab({ trackId }: NewTabProps) {
     return <div>New Tab Content</div>;
   }
   ```

2. **Add to TabType**:
   ```typescript
   // contracts/components.ts
   export type TabType = 'player' | 'sections' | 'stems' | 'mixer' | 'actions' | 'newtab';
   ```

3. **Import in MobileStudioLayout**:
   ```typescript
   const NewTab = lazy(() => import('../tabs/NewTab'));
   ```

4. **Add tab to UI**:
   ```typescript
   <Tabs.List>
     {/* ... existing tabs ... */}
     <Tabs.Trigger value="newtab">New Tab</Tabs.Trigger>
   </Tabs.List>
   
   <Tabs.Content value="newtab">
     <Suspense fallback={<TabSkeleton tabType="newtab" />}>
       <NewTab trackId={trackId} />
     </Suspense>
   </Tabs.Content>
   ```

### 2. Add an AI Action

**Steps**:

1. **Add to AIActionType**:
   ```typescript
   // contracts/components.ts
   export type AIActionType = /* existing */ | 'new-action';
   ```

2. **Add handler in useUnifiedStudio**:
   ```typescript
   const newAction = async () => {
     await startAIOperation('new-action', { trackId, /* params */ });
   };
   
   return { /* ... */, newAction };
   ```

3. **Add to AIActionsFAB**:
   ```typescript
   <AIActionCard
     action="new-action"
     label="New Action"
     icon="Sparkles"
     onTrigger={newAction}
   />
   ```

### 3. Debug Performance Issues

**Tools**:

1. **React DevTools Profiler**:
   - Open React DevTools
   - Go to "Profiler" tab
   - Click "Record"
   - Perform action (e.g., tab switch)
   - Stop recording
   - Analyze flame graph

2. **Chrome Performance Tab**:
   - Open DevTools → Performance
   - Record
   - Perform action
   - Stop
   - Look for long tasks (>50ms)

3. **useStudioPerformance hook**:
   ```typescript
   const { fps, memoryUsage, measureTabSwitch } = useStudioPerformance();
   
   const latency = await measureTabSwitch(() => {
     setActiveTab('stems');
   });
   
   console.log(`Tab switch took ${latency}ms`);
   ```

### 4. Test Feature Flag

**Enable unified studio**:

```sql
-- In Supabase SQL editor
UPDATE feature_flags
SET enabled = TRUE, rollout_percentage = 100
WHERE flag_name = 'unified_studio_mobile_enabled';
```

**Or use query param**:
```
http://localhost:5173/studio/track/123?unified=true
```

**Or programmatically**:
```typescript
const { isEnabled } = useFeatureFlag({
  flagName: 'unified_studio_mobile_enabled',
  defaultValue: false,
});

if (isEnabled) {
  return <UnifiedStudioMobile />;
} else {
  return <LegacyStudioShell />;
}
```

---

## Troubleshooting

### Issue: Touch gestures not working

**Cause**: Gesture handler not bound to element.

**Fix**:
```typescript
const { bind } = useSwipeNavigation(options);

return <div {...bind()}>Content</div>;
```

### Issue: Audio context suspended (iOS)

**Cause**: iOS suspends AudioContext automatically.

**Fix**:
```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden && audioContext.state === 'suspended') {
      audioContext.resume();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [audioContext]);
```

### Issue: Memory leak on tab switch

**Cause**: Forgot to dispose audio buffer.

**Fix**:
```typescript
useEffect(() => {
  if (activeTab === 'player') {
    loadAudioBuffer();
  }
  
  return () => {
    if (audioBuffer) {
      disposeAudioBuffer();
    }
  };
}, [activeTab]);
```

### Issue: TypeScript errors in contracts

**Cause**: Circular import or missing type.

**Fix**:
```typescript
// Use `import type` for type-only imports
import type { Track } from './components';

// Or use forward declaration
export interface Track; // declared later
```

### Issue: Tests failing in CI but passing locally

**Cause**: Timing issue or missing mock.

**Fix**:
```typescript
// Add waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
}, { timeout: 5000 });

// Mock timers if needed
jest.useFakeTimers();
```

---

## Resources

### Documentation

- [Implementation Plan](./plan.md) - Complete implementation plan
- [Research Document](./research.md) - Technical decisions
- [Data Model](./data-model.md) - Data structures and state shape
- [Contracts](./contracts/) - TypeScript interfaces
- [ADR-011](../../ADR/ADR-011-UNIFIED-STUDIO-ARCHITECTURE.md) - Architecture decision

### External References

- [React Query Docs](https://tanstack.com/query/latest)
- [Zustand Guide](https://github.com/pmndrs/zustand)
- [Radix UI Tabs](https://www.radix-ui.com/docs/primitives/components/tabs)
- [@use-gesture Docs](https://use-gesture.netlify.app/)
- [Telegram Web App API](https://core.telegram.org/bots/webapps)
- [React Testing Library](https://testing-library.com/react)

### Internal Tools

- **Storybook**: `npm run storybook` - Component documentation
- **TypeScript**: `npm run type-check` - Type checking
- **Lint**: `npm run lint` - Code quality
- **Format**: `npm run format` - Code formatting

### Getting Help

- **Slack**: `#sprint-030-unified-studio` - Implementation questions
- **Code Review**: Tag @frontend-lead for review
- **Bugs**: Create issue with `bug` label
- **Questions**: Create issue with `question` label

---

## Next Steps

1. ✅ **Phase 0 complete** - Research and technical decisions made
2. 📋 **Phase 1 next** - Read data-model.md and contracts/
3. 🔨 **Phase 2** - Start implementing UnifiedStudioMobile shell
4. ✅ **Phase 3-5** - Continue with remaining phases per plan.md

**Happy coding!** 🚀

---

**Document Status**: ✅ COMPLETE  
**Last Updated**: 2026-01-04  
**Maintainer**: Frontend Team
