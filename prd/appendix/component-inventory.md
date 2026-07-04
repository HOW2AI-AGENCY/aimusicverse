# Component Inventory

> **Complete Component Reference for MusicVerse AI**
>
> **Total Components:** 976+ TypeScript React components
>
> This appendix categorizes and documents key components by their architectural role and purpose.

---

## Table of Contents

- [Component Categories](#component-categories)
- [Core UI Components](#core-ui-components)
- [Layout Components](#layout-components)
- [Feature Components](#feature-components)
- [Audio & Player Components](#audio--player-components)
- [Form & Input Components](#form--input-components)
- [Admin Components](#admin-components)
- [Mobile Components](#mobile-components)
- [State Management](#state-management)
- [Performance & Optimization](#performance--optimization)

---

## Component Categories

| Category             | Component Count | Purpose                     | Examples                     |
| -------------------- | --------------- | --------------------------- | ---------------------------- |
| **Core UI**          | 45+             | Basic UI primitives         | Button, Input, Dialog        |
| **Layout**           | 35+             | Page structure & navigation | MainLayout, AppHeader        |
| **Feature**          | 200+            | Business logic features     | GenerateForm, Studio         |
| **Audio/Player**     | 25+             | Audio processing & playback | GlobalAudioProvider          |
| **Form/Input**       | 60+             | User input handling         | TextField, Select            |
| **Admin**            | 40+             | Administrative interface    | AdminDashboard, StatCard     |
| **Mobile**           | 80+             | Mobile-specific components  | MobileSkeletons              |
| **Performance**      | 30+             | Optimization components     | LazySection, VirtualizedList |
| **State Management** | 25+             | State & context providers   | Stores, Contexts             |
| **Utilities**        | 436+            | Helper components           | Icons, utils, hooks          |

---

## Core UI Components

### shadcn/ui Base Components

**Location:** `src/components/ui/`

| Component       | Purpose               | Props                                      | Usage                        |
| --------------- | --------------------- | ------------------------------------------ | ---------------------------- |
| **Button**      | Clickable actions     | `variant`, `size`, `children`              | Form submissions, navigation |
| **Input**       | Text input field      | `type`, `placeholder`, `value`, `onChange` | Forms, search bars           |
| **Textarea**    | Multi-line text input | `value`, `onChange`, `rows`                | Lyrics, style prompts        |
| **Select**      | Dropdown selection    | `value`, `onValueChange`, `options`        | Form selectors               |
| **Dialog**      | Modal overlay         | `open`, `onOpenChange`, `children`         | Confirmation dialogs         |
| **AlertDialog** | Alert dialogs         | `title`, `description`, `action`           | Critical confirmations       |
| **Tabs**        | Tabbed content        | `value`, `onValueChange`, `tabs[]`         | Settings, admin pages        |
| **Badge**       | Status indicator      | `variant`, `children`                      | User roles, counts           |
| **Card**        | Content container     | `children`, `className`                    | Track cards, stats           |
| **ScrollArea**  | Scrollable container  | `children`, `className`                    | Long lists, panels           |
| **Tooltip**     | Hover tooltip         | `children`, `content`                      | Help text, info              |
| **Popover**     | Floating content      | `open`, `content`, `trigger`               | Dropdowns, menus             |
| **Switch**      | Toggle switch         | `checked`, `onCheckedChange`               | Settings toggles             |
| **Slider**      | Range input           | `value`, `onValueChange`, `min`, `max`     | Audio controls, filters      |
| **Progress**    | Progress indicator    | `value`, `className`                       | Generation progress          |
| **Skeleton**    | Loading placeholder   | `className`                                | Content loading              |
| **Avatar**      | User image            | `src`, `alt`, `fallback`                   | User profiles                |
| **Separator**   | Visual divider        | `orientation`, `decorative`                | Section dividers             |

---

## Layout Components

### Page Structure

**Location:** `src/components/layout/`

| Component             | Purpose                           | Usage                   | Size      |
| --------------------- | --------------------------------- | ----------------------- | --------- |
| **MainLayout**        | Main page wrapper with bottom nav | Home, Library, Projects | 120 lines |
| **AppHeader**         | Top navigation bar                | Desktop pages           | 80 lines  |
| **SafeAreaContainer** | Safe area handling (notch/island) | All mobile pages        | 40 lines  |
| **PageContainer**     | Page content wrapper              | All pages               | 60 lines  |
| **PageTransition**    | Page transition animations        | Route transitions       | 45 lines  |
| **FixedOverlay**      | Fixed position overlay            | Modals, sheets          | 35 lines  |

### Navigation Components

**Location:** `src/components/navigation/`

| Component                     | Purpose                   | Features                            |
| ----------------------------- | ------------------------- | ----------------------------------- |
| **MobileBottomNav**           | Mobile bottom navigation  | 4 main tabs, safe areas             |
| **KeyboardShortcutsProvider** | Global keyboard shortcuts | Space (play/pause), Cmd+K (search)  |
| **NavigationProvider**        | Navigation context        | Current route, back button handling |

---

## Feature Components

### Music Generation

**Location:** `src/components/generate-form/`

| Component              | Purpose              | Key Props                      |
| ---------------------- | -------------------- | ------------------------------ |
| **GenerateFormCustom** | Full generation form | `onGenerate`, `initialValues`  |
| **GenerationWizard**   | Step-by-step wizard  | `steps`, `currentStep`         |
| **StyleSection**       | Style prompt input   | `value`, `onChange`, `aiBoost` |
| **TitleSection**       | Track title input    | `value`, `onChange`            |
| **LyricsChat**         | AI lyrics assistant  | `onLyricsGenerated`, `style`   |

### Library & Discovery

**Location:** `src/components/library/`

| Component                | Purpose                     | Features                     |
| ------------------------ | --------------------------- | ---------------------------- |
| **VirtualizedTrackList** | Virtualized track list      | react-virtuoso, 1000+ tracks |
| **LibraryFilterChips**   | Filter chips (type, status) | Active filters, clear button |
| **TrackDetailPanel**     | Desktop track detail panel  | Versions, stems, lyrics      |
| **PullToRefreshWrapper** | Pull-to-refresh gesture     | Mobile, haptic feedback      |
| **TrackStyleTags**       | Genre/style tags            | Clickable, filter support    |

### Studio Components

**Location:** `src/components/studio/unified/`

| Component           | Purpose                | Key Features                |
| ------------------- | ---------------------- | --------------------------- |
| **UnifiedStudio**   | Main studio interface  | Waveform editor, stem mixer |
| **StemMixer**       | Stem mixing controls   | Volume, pan, solo, mute     |
| **WaveformEditor**  | Audio waveform editing | Trim, split, sections       |
| **VersionSelector** | A/B version switching  | Instant switch, comparison  |
| **MIDIDisplay**     | MIDI notation viewer   | Sheet music display         |

---

## Audio & Player Components

### Global Audio System

**Location:** `src/components/` (root level)

| Component               | Purpose                        | Architecture            |
| ----------------------- | ------------------------------ | ----------------------- |
| **GlobalAudioProvider** | Single <audio> element manager | Context + Zustand store |
| **AudioVisualizer**     | Real-time audio visualization  | Canvas, frequency data  |
| **ResizablePlayer**     | Compact/expanded player        | Resizable, draggable    |

### Player Components

**Location:** `src/components/player/`

| Component            | Purpose                  | Features                     |
| -------------------- | ------------------------ | ---------------------------- |
| **CompactPlayer**    | Mini player at bottom    | Cover, title, controls       |
| **ExpandedPlayer**   | Medium player            | Queue, lyrics, full controls |
| **FullscreenPlayer** | Mobile fullscreen player | Waveform, chapters, share    |
| **ProgressBar**      | Playback progress        | Draggable, time display      |
| **LyricsPanel**      | Karaoke lyrics display   | Synchronized, word-level     |

### Audio Utilities

**Location:** `src/lib/` (utilities)

| Component/Module         | Purpose             | Notes                       |
| ------------------------ | ------------------- | --------------------------- |
| **audioElementPool.ts**  | Audio element reuse | iOS Safari: max 10 elements |
| **audioCache.ts**        | Waveform cache      | Pre-computed peaks          |
| **waveformGenerator.ts** | Waveform generation | AudioBuffer → peaks         |

---

## Form & Input Components

### Enhanced Form Components

**Location:** `src/components/mobile/forms/`

| Component           | Purpose                 | Mobile Optimizations     |
| ------------------- | ----------------------- | ------------------------ |
| **MobileFormField** | Labeled form field      | 44×44px touch targets    |
| **MobileSlider**    | Touch-friendly slider   | Haptic feedback          |
| **MobileTextarea**  | Auto-expanding textarea | Keyboard height tracking |

### Form Validation

**Integration:** React Hook Form + Zod

| Component              | Validation | Error Display         |
| ---------------------- | ---------- | --------------------- |
| **GenerateFormCustom** | Zod schema | Inline errors + toast |
| **ProfileEditForm**    | Zod schema | Field-level errors    |
| **SettingsForm**       | Zod schema | Validation on submit  |

---

## Admin Components

### Admin Dashboard

**Location:** `src/components/admin/`

| Component                  | Purpose              | Data Source            |
| -------------------------- | -------------------- | ---------------------- |
| **StatCard**               | Metric display card  | Admin stats API        |
| **GenerationStatsPanel**   | Generation analytics | generation_tasks table |
| **UserBalancesPanel**      | User credit balances | credits table          |
| **ModerationReportsPanel** | Moderation queue     | reports table          |
| **PerformanceDashboard**   | System performance   | Error logs, timing     |

### Admin Utilities

| Component           | Purpose            | Features               |
| ------------------- | ------------------ | ---------------------- |
| **AdminLayout**     | Admin page wrapper | Sidebar navigation     |
| **DateRangePicker** | Date selection     | Presets (7d, 30d, 90d) |
| **ExportButton**    | Data export        | CSV, JSON formats      |

---

## Mobile Components

### Mobile-Optimized Components

**Location:** `src/components/mobile/`

| Component                | Purpose              | Mobile Features              |
| ------------------------ | -------------------- | ---------------------------- |
| **MobileSkeletons**      | Loading placeholders | Optimized for small screens  |
| **MobilePageTransition** | Page transitions     | Slide animations             |
| **BottomSheet**          | Bottom sheet modal   | Vaul library, swipe to close |

### Gesture Components

**Library:** @use-gesture/react

| Component             | Gestures Supported         |
| --------------------- | -------------------------- |
| **SwipeableTrack**    | Swipe left/right (actions) |
| **PullToRefresh**     | Pull down (refresh)        |
| **LongPressCard**     | Long press (context menu)  |
| **DraggableWaveform** | Drag (trim, seek)          |

---

## State Management

### Zustand Stores

**Location:** `src/stores/`

| Store                     | Purpose                | Size | Key Actions             |
| ------------------------- | ---------------------- | ---- | ----------------------- |
| **playerStore**           | Audio playback         | 8KB  | play, pause, next, prev |
| **useUnifiedStudioStore** | Studio state           | 38KB | setTrack, addEdit, undo |
| **useLyricsHistoryStore** | Lyrics editing history | 5KB  | addChange, undo, redo   |
| **useMixerHistoryStore**  | Mixer state history    | 6KB  | saveState, undo         |
| **generationWizardStore** | Generation form flow   | 8KB  | nextStep, prevStep      |

### Context Providers

**Location:** `src/contexts/`

| Context                 | Purpose             | Provided Values              |
| ----------------------- | ------------------- | ---------------------------- |
| **AuthContext**         | Authentication      | user, login, logout          |
| **TelegramContext**     | Telegram Mini App   | webApp, user, hapticFeedback |
| **ThemeContext**        | Dark/light mode     | theme, setTheme              |
| **NotificationContext** | Toast notifications | toast, notify                |
| **GlobalAudioContext**  | Audio player access | play, pause, currentTrack    |

---

## Performance & Optimization

### Lazy Loading Components

**Location:** `src/components/lazy/`

| Component       | Purpose              | Load Trigger                   |
| --------------- | -------------------- | ------------------------------ |
| **LazySection** | Section lazy loading | Intersection Observer          |
| **LazyImage**   | Image lazy loading   | In viewport + blur placeholder |

### Virtualization

**Library:** react-virtuoso

| Component                | Purpose           | Performance                |
| ------------------------ | ----------------- | -------------------------- |
| **VirtualizedTrackList** | Large track lists | Renders 20 items at a time |
| **VirtualizedGrid**      | Image grids       | 100+ images without lag    |

### Code Splitting

**Strategy:** Route-based + feature-based

| Chunk                | Components            | Size Target |
| -------------------- | --------------------- | ----------- |
| `vendor-react`       | React + dependencies  | 200 KB      |
| `vendor-tone`        | Tone.js + audio       | 150 KB      |
| `feature-studio`     | All studio components | 200 KB      |
| `feature-generation` | Generation form       | 180 KB      |

---

## Component Architecture Patterns

### Component Size Distribution

| Size Range                 | Count | Examples              |
| -------------------------- | ----- | --------------------- |
| **Micro (<50 lines)**      | 600+  | UI primitives, icons  |
| **Small (50-200 lines)**   | 300+  | Feature components    |
| **Medium (200-500 lines)** | 60+   | Pages, complex forms  |
| **Large (500+ lines)**     | 16+   | Main pages, providers |

### Largest Components (Complexity Hotspots)

| Component                | Lines | Purpose          | Maintenance     |
| ------------------------ | ----- | ---------------- | --------------- |
| **UnifiedStudio**        | 800+  | Studio interface | Needs splitting |
| **GenerateFormCustom**   | 650+  | Generation form  | Well-structured |
| **GlobalAudioProvider**  | 625   | Audio management | Stable          |
| **VirtualizedTrackList** | 450   | Track list       | Optimized       |
| **AdminLayout**          | 400   | Admin wrapper    | Clear structure |

---

## Component Dependencies

### Dependency Graph (Key Relationships)

```
GlobalAudioProvider (root)
├── AudioVisualizer
├── CompactPlayer
├── ExpandedPlayer
└── MobileFullscreenPlayer

UnifiedStudio (page)
├── WaveformEditor
├── StemMixer
├── VersionSelector
└── MIDIDisplay

GenerateFormCustom (modal)
├── StyleSection
├── TitleSection
├── LyricsChat
└── AdvancedSettings
```

---

## Appendix: Component Creation Guidelines

### When to Create New Components

**✅ Create new component when:**

- Reusable UI pattern appears 3+ times
- Complex logic needs isolation
- Performance optimization required (memo, virtualization)
- State management needs encapsulation

**❌ Avoid creating components when:**

- Single-use functionality
- Simple wrapper around existing component
- Adds unnecessary abstraction

### Component Size Guidelines

| Target                 | Lines         | Reason                |
| ---------------------- | ------------- | --------------------- |
| **UI Components**      | <100 lines    | Simple, focused       |
| **Feature Components** | 100-300 lines | Balanced complexity   |
| **Page Components**    | 300-500 lines | Manageable complexity |
| **Large Pages**        | 500+ lines    | Consider splitting    |

---

**Total Key Components Documented:** 100+ (of 976 total)

**Documentation Strategy:** Focus on architecturally significant components rather than exhaustive listing of all 976 components.

---

_For the complete component list, refer to the source code in `src/components/`._
