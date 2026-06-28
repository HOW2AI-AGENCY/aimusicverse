# Migration Guide: Mobile UI/UX Improvements

**Feature**: 033-mobile-ui-improvements
**Date**: 2026-01-06
**Audience**: Developers implementing this feature

## Overview

This guide helps developers migrate the codebase to support the new mobile UI/UX improvements, including queue management, gesture settings, notification system, accessibility enhancements, and design system adoption.

## Table of Contents

1. [Queue Migration](#1-queue-migration)
2. [Gesture Settings Introduction](#2-gesture-settings-introduction)
3. [Notification Permission Request Flow](#3-notification-permission-request-flow)
4. [Accessibility Features](#4-accessibility-features)
5. [Typography Component Migration](#5-typography-component-migration)
6. [Spacing Token Migration](#6-spacing-token-migration)
7. [Testing Checklist](#7-testing-checklist)

---

## 1. Queue Migration

### Background

The playback queue currently lives in `playerStore` (Zustand). We're moving it to `localStorage` for persistence across sessions and to reduce Zustand store complexity.

### Migration Steps

**Step 1: Create queue storage utilities**

Create `src/lib/queueStorage.ts`:

```typescript
import { PlaybackQueueSchema, type PlaybackQueue } from '@/types/queue';

const QUEUE_STORAGE_KEY = 'musicverse-queue';

export function loadQueue(): PlaybackQueue | null {
  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);
    return PlaybackQueueSchema.parse(data);
  } catch (error) {
    console.error('Failed to load queue:', error);
    return null;
  }
}

export function saveQueue(queue: PlaybackQueue): void {
  try {
    const data = PlaybackQueueSchema.parse(queue);
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save queue:', error);
  }
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_STORAGE_KEY);
}
```

**Step 2: Add migration script to `src/lib/migration.ts`**

```typescript
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { saveQueue, clearQueue as clearQueueStorage } from './queueStorage';

export function migrateQueueFromPlayerStore() {
  // Check if already migrated
  const existing = localStorage.getItem('musicverse-queue');
  if (existing) return;

  // Migrate from playerStore
  const playerStore = usePlayerStore.getState();
  const { queue, currentIndex } = playerStore;

  if (!queue || queue.length === 0) return;

  const queueData = {
    version: 1,
    queue: queue.map(track => track.id),
    currentIndex,
    timestamp: Date.now(),
  };

  saveQueue(queueData);

  // Clear from playerStore (one-time)
  playerStore.setQueue([]);
  playerStore.setCurrentIndex(-1);

  console.log('Queue migrated from playerStore to localStorage');
}
```

**Step 3: Call migration on app load**

Update `src/main.tsx`:

```typescript
import { migrateQueueFromPlayerStore } from '@/lib/migration';

// In app initialization
migrateQueueFromPlayerStore();
```

**Step 4: Update playerStore to use localStorage**

Modify `src/hooks/audio/usePlayerState.ts`:

```typescript
import { loadQueue, saveQueue } from '@/lib/queueStorage';

// In store initialization
const QueueStore = create<QueueState>((set, get) => ({
  queue: [],
  currentIndex: -1,

  // Load from localStorage on init
  hydrate: () => {
    const stored = loadQueue();
    if (stored) {
      set({
        queue: stored.queue.map(id => ({ id })), // Fetch full tracks later
        currentIndex: stored.currentIndex,
      });
    }
  },

  // Save to localStorage on change
  addToQueue: (track) => {
    const { queue, currentIndex } = get();
    const newQueue = [...queue, track];
    set({ queue: newQueue });

    // Persist
    saveQueue({
      version: 1,
      queue: newQueue.map(t => t.id),
      currentIndex,
      timestamp: Date.now(),
    });
  },

  // ... other methods, save after each change
}));
```

### Verification

- [ ] Queue loads from localStorage on app start
- [ ] Queue persists across app restart
- [ ] Old queue migrates from playerStore (one-time)
- [ ] Queue clears when user logs out

---

## 2. Gesture Settings Introduction

### Background

We're adding gesture settings to allow users to customize gesture behavior in the fullscreen player.

### Implementation Steps

**Step 1: Create gesture settings utilities**

Create `src/lib/gestureSettings.ts`:

```typescript
import { GestureSettingsSchema } from '@/types/gestures';

const GESTURES_STORAGE_KEY = 'musicverse-gestures';

export const DEFAULT_GESTURE_SETTINGS = {
  doubleTapSeek: {
    enabled: true,
    seekAmount: 10,
    leftSideEnabled: true,
    rightSideEnabled: true,
  },
  horizontalSwipe: {
    enabled: true,
    threshold: 80,
    velocityThreshold: 400,
  },
  hintOverlay: {
    shown: false,
    dismissed: false,
  },
  keyboard: {
    enabled: true,
    seekAmount: 10,
  },
  version: 1,
  lastUpdated: Date.now(),
};

export function loadGestureSettings() {
  try {
    const stored = localStorage.getItem(GESTURES_STORAGE_KEY);
    if (!stored) return DEFAULT_GESTURE_SETTINGS;

    return GestureSettingsSchema.parse(JSON.parse(stored));
  } catch (error) {
    console.error('Failed to load gesture settings:', error);
    return DEFAULT_GESTURE_SETTINGS;
  }
}

export function saveGestureSettings(settings: any) {
  try {
    const data = GestureSettingsSchema.parse(settings);
    localStorage.setItem(GESTURES_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save gesture settings:', error);
  }
}
```

**Step 2: Create GestureSettingsPanel component**

Create `src/components/gestures/GestureSettingsPanel.tsx`:

```typescript
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { loadGestureSettings, saveGestureSettings } from '@/lib/gestureSettings';

export function GestureSettingsPanel() {
  const [settings, setSettings] = useState(loadGestureSettings);

  const handleToggle = (key: string, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveGestureSettings(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Double-tap to seek</Label>
        <Switch
          checked={settings.doubleTapSeek.enabled}
          onCheckedChange={(v) => handleToggle('doubleTapSeek', v)}
        />
      </div>

      {settings.doubleTapSeek.enabled && (
        <div className="space-y-2">
          <Label>Seek amount: {settings.doubleTapSeek.seekAmount}s</Label>
          <Slider
            value={[settings.doubleTapSeek.seekAmount]}
            onValueChange={([v]) => {
              const updated = {
                ...settings,
                doubleTapSeek: { ...settings.doubleTapSeek, seekAmount: v }
              };
              setSettings(updated);
              saveGestureSettings(updated);
            }}
            min={5}
            max={30}
            step={5}
          />
        </div>
      )}

      {/* Add other settings... */}
    </div>
  );
}
```

**Step 3: Add gesture settings to Settings page**

Update `src/pages/Settings.tsx`:

```typescript
import { GestureSettingsPanel } from '@/components/gestures/GestureSettingsPanel';

// In settings sections list
{{
  id: 'gestures',
  label: 'Жесты',
  icon: Hand,
  component: GestureSettingsPanel,
}}
```

**Step 4: Show hint overlay on first open**

Update `src/components/player/MobileFullscreenPlayer.tsx`:

```typescript
import { loadGestureSettings, saveGestureSettings } from '@/lib/gestureSettings';
import { GestureHintOverlay } from '@/components/gestures/GestureHintOverlay';

export function MobileFullscreenPlayer() {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const settings = loadGestureSettings();
    if (!settings.hintOverlay.shown && settings.hintOverlay.enabled) {
      setShowHint(true);
    }
  }, []);

  const handleHintDismiss = () => {
    const settings = loadGestureSettings();
    saveGestureSettings({
      ...settings,
      hintOverlay: { ...settings.hintOverlay, shown: true, dismissed: true }
    });
    setShowHint(false);
  };

  return (
    <div>
      {/* Player content */}

      <AnimatePresence>
        {showHint && (
          <GestureHintOverlay onDismiss={handleHintDismiss} />
        )}
      </AnimatePresence>
    </div>
  );
}
```

### Verification

- [ ] Gesture settings load from localStorage
- [ ] Hint overlay shows on first fullscreen player open
- [ ] Hint overlay dismisses and doesn't show again
- [ ] Settings panel allows customizing gestures
- [ ] Disabled gestures don't trigger

---

## 3. Notification Permission Request Flow

### Background

We're requesting notification permissions on first generation completion (not on app launch) to increase grant rates.

### Implementation Steps

**Step 1: Create notification manager**

Create `src/lib/notificationManager.ts`:

```typescript
import { toast } from 'sonner';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  // Request permission
  const result = await Notification.requestPermission();

  // Update user preferences
  const prefs = loadUserPreferences();
  saveUserPreferences({
    ...prefs,
    notificationPermission: result,
    lastUpdated: Date.now(),
  });

  return result === 'granted';
}

export function showGenerationCompleteNotification(track: Track) {
  // Show in-app notification
  toast('Трек готов!', {
    description: `"${track.title}" завершен`,
    action: {
      label: 'Слушать',
      onClick: () => navigate(`/library?track=${track.id}`),
    },
  });

  // Try push notification
  if (Notification.permission === 'granted') {
    new Notification('MusicVerse AI', {
      body: `"${track.title}" готов!`,
      icon: '/icon-192.png',
      tag: track.id,
    });
  }
}
```

**Step 2: Request permission on first generation**

Update `src/hooks/useGenerationRealtime.ts`:

```typescript
import { requestNotificationPermission, showGenerationCompleteNotification } from '@/lib/notificationManager';

useEffect(() => {
  if (prevStatus === 'generating' && currentStatus === 'completed') {
    // Request notification permission on first completion
    const prefs = loadUserPreferences();
    if (prefs.notificationPermission === 'default') {
      requestNotificationPermission();
    }

    // Show notification
    showGenerationCompleteNotification(track);
  }
}, [prevStatus, currentStatus, track]);
```

**Step 3: Add permission request UI (optional)**

For better UX, show an in-app message before requesting:

```typescript
function NotificationPermissionPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const prefs = loadUserPreferences();
    const completedCount = getUserCompletedGenerationsCount();

    // Show on first completion if permission not requested
    if (completedCount === 1 && prefs.notificationPermission === 'default') {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 bg-card border border-border rounded-lg p-4 shadow-lg">
      <p className="text-sm mb-2">
        Получайте уведомления о готовности треков!
      </p>
      <div className="flex gap-2">
        <Button onClick={handleRequestPermission}>Разрешить</Button>
        <Button variant="ghost" onClick={handleDismiss}>Напомнить позже</Button>
      </div>
    </div>
  );
}
```

### Verification

- [ ] Permission requests on first generation completion
- [ ] In-app notification shows with "Listen Now" button
- [ ] Push notification sends if permission granted
- [ ] Graceful degradation if permission denied
- [ ] Permission state persists in UserPreferences

---

## 4. Accessibility Features

### Background

We're implementing WCAG AA accessibility features including minimum text size, focus indicators, ARIA labels, and keyboard navigation.

### Implementation Steps

**Step 1: Update minimum text size**

Replace all 12px text with 14px:

```typescript
// Before:
<Text variant="caption" className="text-xs">...</Text>

// After:
<Text variant="caption" className="text-sm">...</Text>
```

Update `src/styles/typography.css`:

```css
.text-caption {
  font-size: 0.875rem; /* Was 0.75rem (12px) */
  line-height: 1.4;
}
```

**Step 2: Add visible focus indicators**

Create `src/styles/accessibility.css`:

```css
/* Visible focus indicators */
*:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

/* Ensure focus indicators are visible on dark backgrounds */
.dark *:focus-visible {
  outline-color: hsl(var(--primary) / 0.8);
}

/* Skip links for accessibility */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

Import in `src/main.tsx`:

```typescript
import './styles/accessibility.css';
```

**Step 3: Add ARIA labels to icon-only buttons**

```typescript
// Before:
<Button size="icon">
  <Play className="w-4 h-4" />
</Button>

// After:
<Button size="icon" aria-label="Воспроизвести трек" title="Воспроизвести">
  <Play className="w-4 h-4" aria-hidden="true" />
</Button>
```

**Step 4: Implement keyboard navigation for gestures**

Update `src/components/player/MobileFullscreenPlayer.tsx`:

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const settings = loadGestureSettings();
    if (!settings.keyboard.enabled) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        seek(-settings.keyboard.seekAmount);
        break;
      case 'ArrowRight':
        e.preventDefault();
        seek(settings.keyboard.seekAmount);
        break;
      case 'Shift+ArrowLeft':
        e.preventDefault();
        previousTrack();
        break;
      case 'Shift+ArrowRight':
        e.preventDefault();
        nextTrack();
        break;
      case ' ':
        e.preventDefault();
        togglePlay();
        break;
      case 'Escape':
        e.preventDefault();
        closeFullscreenPlayer();
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [seek, previousTrack, nextTrack, togglePlay, closeFullscreenPlayer]);
```

### Verification

- [ ] All text is >= 14px (check with axe-core)
- [ ] Focus indicators visible on all interactive elements
- [ ] Icon-only buttons have aria-labels
- [ ] Keyboard navigation works in fullscreen player
- [ ] Skip links allow bypassing navigation

---

## 5. Typography Component Migration

### Background

We're migrating from inline Tailwind text classes to design system Typography components for consistency.

### Migration Steps

**Step 1: Install Typography components**

Already created in `src/components/ui/typography.tsx` (from 032-professional-ui).

**Step 2: Common migration patterns**

```typescript
// BEFORE: Inline classes
<h1 className="text-2xl font-bold">Заголовок</h1>
<p className="text-sm text-muted-foreground">Описание</p>

// AFTER: Typography components
<Heading level="h2">Заголовок</Heading>
<Text variant="body" className="text-muted-foreground">Описание</Text>
```

**Step 3: SectionHeader migration**

```typescript
// BEFORE
<div className="flex items-center justify-between">
  <h2 className="text-xl font-semibold">Мои треки</h2>
  <span className="text-xs text-muted-foreground">12 треков</span>
</div>

// AFTER
<SectionHeader
  icon={Music2}
  title="Мои треки"
  subtitle="12 треков"
  variant="default"
/>
```

**Step 4: Card content migration**

```typescript
// BEFORE
<h3 className="text-base font-semibold">{track.title}</h3>
<p className="text-sm text-muted-foreground">{track.style}</p>

// AFTER
<Heading level="h4" className="font-semibold">{track.title}</Heading>
<Text variant="body" className="text-muted-foreground">{track.style}</Text>
```

**Step 5: Add ESLint rule (optional)**

Create `.eslintrc.js` rule:

```javascript
module.exports = {
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'JSXElement[name^="h"][name!(/Heading$/)]',
        message: 'Use Typography Heading component instead of h1-h6',
      },
    ],
  },
};
```

### Verification

- [ ] Typography components used for all headings
- [ ] Typography components used for body text
- [ ] No inline font-size or font-weight classes
- [ ] Consistent text hierarchy across app

---

## 6. Spacing Token Migration

### Background

We're migrating from fractional spacing (gap-2.5, p-3.5) to standard 4px grid tokens (gap-3, p-4).

### Migration Steps

**Step 1: Common spacing replacements**

| Old | New | Token |
|-----|-----|-------|
| `gap-2.5` | `gap-3` | 12px |
| `gap-3.5` | `gap-4` | 16px |
| `p-2.5` | `p-3` | 12px |
| `p-3.5` | `p-4` | 16px |
| `px-3.5` | `px-4` | 16px horizontal |
| `py-2.5` | `py-3` | 12px vertical |

**Step 2: Component migration examples**

```typescript
// BEFORE: BottomNavigation
<div className="flex items-center gap-2.5 sm:gap-3">

// AFTER: BottomNavigation
<div className="flex items-center gap-3 sm:gap-4">
```

**Step 3: Use spacing utilities**

Create `src/lib/spacing-utils.ts`:

```typescript
export const SPACING = {
  xs: '4px',   // 0.25rem
  sm: '8px',   // 0.5rem
  md: '12px',  // 0.75rem
  lg: '16px',  // 1rem
  xl: '24px',  // 1.5rem
  '2xl': '32px', // 2rem
} as const;

export function getGapClass(size: keyof typeof SPACING): string {
  const map = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
    xl: 'gap-6',
    '2xl': 'gap-8',
  };
  return map[size];
}
```

**Step 4: Add ESLint rule (optional)**

```javascript
module.exports = {
  rules: {
    'tailwindcss/classnames-order': 'error',
    'tailwindcss/no-custom-classname': 'error',
    'tailwindcss/no-contradicting-classname': 'error',
  },
};
```

### Verification

- [ ] No fractional spacing classes (gap-X.5, p-X.5)
- [ ] All spacing uses 4px grid scale
- [ ] Consistent spacing across components
- [ ] Spacing utilities used where appropriate

---

## 7. Testing Checklist

### Manual Testing

**Navigation Consistency**
- [ ] "More" menu hint shows on first open
- [ ] Active tab indicator is clear and persistent
- [ ] Back button works consistently across all pages
- [ ] "Recently Used" section shows in More menu

**Gesture Discoverability**
- [ ] Gesture hint overlay shows on first fullscreen player open
- [ ] Hint dismisses on tap and doesn't show again
- [ ] Double-tap seek shows visual feedback
- [ ] Horizontal swipe shows chevron indicator
- [ ] Gesture settings allow customizing behavior

**Loading States**
- [ ] Skeleton loaders have shimmer animation
- [ ] Generation progress shows in nav badge
- [ ] Timeout indicators show after 10s
- [ ] Retry buttons work without page refresh

**Error Recovery**
- [ ] Error states show friendly messages
- [ ] Retry buttons preserve form data
- [ ] Support contact shows in critical flows
- [ ] Timeout indicators explain unusual delays

**Notifications**
- [ ] In-app notifications show with action buttons
- [ ] "Listen Now" navigates to Library with track selected
- [ ] Push notifications send if permission granted
- [ ] Multiple notifications group into single

**Accessibility**
- [ ] All text is >= 14px (verified with DevTools)
- [ ] Focus indicators visible on all interactive elements
- [ ] Icon-only buttons have aria-labels
- [ ] Keyboard navigation works in fullscreen player
- [ ] axe-core audit passes with 95%+ compliance

**Queue Management**
- [ ] "Add to Queue" action available on track cards
- [ ] Queue persists across app restarts
- [ ] Queue reordering works via drag-and-drop
- [ ] Queue limit (100 tracks) enforced
- [ ] "Play Next" inserts after current track

**Visual Polish**
- [ ] Typography components used consistently
- [ ] Spacing follows 4px grid scale
- [ ] Page transitions have smooth animations
- [ ] Touch targets are >= 44px
- [ ] Shadows use elevation system

**Empty States**
- [ ] Friendly illustrations show
- [ ] Primary CTA buttons guide users
- [ ] Secondary actions provide alternatives
- [ ] Help links available
- [ ] Context preserved when action taken

**Recently Played**
- [ ] Section shows on homepage (max 6 tracks)
- [ ] Tracks deduplicated (most recent wins)
- [ ] Section hides if no tracks played
- [ ] Data persists across sessions
- [ ] Tap plays track immediately

### Automated Testing

```bash
# Accessibility audit
npm run test:a11y

# Touch target compliance
npm run test:touch-targets

# Bundle size check
npm run size

# TypeScript compilation
npx tsc --noEmit

# E2E tests
npm run test:e2e:mobile
```

---

## Rollout Plan

1. **Week 1-2**: Implement P1 critical improvements (navigation, gestures, errors, accessibility)
2. **Week 3-4**: Implement P2 high priority (loading, notifications, queue, polish)
3. **Week 5-6**: Implement P3 polish (empty states, recently played)
4. **Week 7**: Testing and QA
5. **Week 8**: Gradual rollout with feature flags
6. **Week 9**: Monitor metrics and iterate

### Feature Flags

```typescript
// Feature flags for gradual rollout
const FEATURES = {
  gestureHints: true,      // Show gesture hints (default: true)
  notifications: true,     // Enable notifications (default: true)
  queueManagement: true,   // Enable queue (default: true)
  recentlyPlayed: true,    // Show recently played (default: true)
};
```

### Monitoring

Track these metrics after rollout:
- Gesture hint dismissal rate vs. gesture usage
- Notification permission grant rate
- Queue management adoption rate
- Error retry click-through rate
- User satisfaction score (survey)

---

## Support

For questions or issues during migration:
1. Check this guide first
2. Review the [research.md](research.md) for design decisions
3. Check the [data-model.md](data-model.md) for entity definitions
4. Ask in team chat or create issue

---

**Last Updated**: 2026-01-06
