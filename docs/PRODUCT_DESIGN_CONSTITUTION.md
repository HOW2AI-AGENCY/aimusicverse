# 🎯 Product Design Constitution: MusicVerse AI

> **Version:** 2.0 Enterprise  
> **Level:** Apple + Linear + Spotify + OpenAI + Vercel  
> **Status:** Production-Ready  
> **Last Updated:** 2026-06-27

---

## 📋 Table of Contents

1. [Product Principles](#1-product-principles)
2. [Entity Model](#2-entity-model)
3. [Jobs To Be Done](#3-jobs-to-be-done)
4. [Design Constraints](#4-design-constraints)
5. [UX Laws](#5-ux-laws)
6. [Navigation Hierarchy](#6-navigation-hierarchy)
7. [Object Relationships](#7-object-relationships)
8. [Action Priority Matrix](#8-action-priority-matrix)
9. [Screen Inventory](#9-screen-inventory)
10. [Empty States](#10-empty-states)
11. [Motion System](#11-motion-system)
12. [AI UX Architecture](#12-ai-ux-architecture)
13. [Information Density](#13-information-density)
14. [Card Hierarchy](#14-card-hierarchy)
15. [Adaptive Rules](#15-adaptive-rules)
16. [Content Strategy](#16-content-strategy)
17. [Monetization UX](#17-monetization-ux)
18. [Notification System](#18-notification-system)
19. [Search Architecture](#19-search-architecture)
20. [Accessibility Standards](#20-accessibility-standards)

---

# 1. PRODUCT PRINCIPLES

## The Constitution of Interface Design

Эти принципы — **конституция** интерфейса MusicVerse AI. Они неизменны и обязательны для исполнения при любых дизайнерских решениях.

---

### Principle 1: Creation First

> **任何行动都应尽可能快地让用户创作音乐**

**Definition:**

- Главная ценность продукта — создание музыки
- Каждый экран должен вести к созданию
- Время от идеи до трека — минимизировано

**Implementation:**

- Глобальный FAB "Create" всегда доступен
- Ручной ввод → AI-ассистент → One-tap presets
- Максимальный path к creation: 2 taps
- Quick actions на каждом экране

**Anti-Patterns:**
❌ Скрытие создания за 3+ clicks  
❌ Navigation без creative CTA  
❌ Empty states без CTA to create

---

### Principle 2: Everything is a Project

> **任何生成都会自动成为项目的一部分**

**Definition:**

- Генерации не существуют в вакууме
- Всё organised into projects
- Projects — main organizing unit

**Implementation:**

- Каждая генерация → automatic project creation
- Generations grouped by context/prompt/style
- Projects auto-named from first prompt
- Manual project creation optional

**Entity Structure:**

```
Workspace
└── Projects
    ├── Auto-created (from generations)
    └── Manual (user-initiated)
```

**Anti-Patterns:**
❌ Generations без project context  
❌ Lost generations (no parent project)  
❌ Manual project organization required

---

### Principle 3: Never Lose Context

> **用户从不丢失工作历史**

**Definition:**

- Всё автоматически сохраняется
- History always accessible
- No dead ends, no lost work

**Implementation:**

- Auto-save на каждые 30 секунд
- Infinite undo/redo stack
- Session restoration (reload → recover state)
- Draft persistence (30 days expiry)
- Activity feed per project

**Anti-Patterns:**
❌ "Are you sure you want to leave?"  
❌ Lost drafts on crash  
❌ No revision history

---

### Principle 4: One Source of Truth

> **每个实体只存在于一个地方**

**Definition:**

- Entities exist once
- References only
- No duplication

**Implementation:**

- Track в library → reference from project
- Project timeline → references to generations
- AI Artist profile → reference from tracks
- Single pane of glass for each entity type

**Entity Rules:**

```
Track: Lives in Library, referenced elsewhere
Generation: Lives in Project, referenced in Library
Version: Lives in Track, referenced in Studio
```

**Anti-Patterns:**
❌ Same entity in multiple places  
❌ Copies instead of references  
❌ Desynced states

---

### Principle 5: Progressive Disclosure

> **界面只显示必要信息**

**Definition:**

- Show minimum required
- Reveal complexity on demand
- Cognitive load minimization

**Implementation:**

- Primary screen: essential actions only
- Secondary: revealed via gestures/menus
- Tertiary: advanced options
- Expert mode: toggle for full control

**Disclosure Layers:**

```
Layer 1 (Always Visible): Play, Create, Navigate
Layer 2 (On Tap): Like, Share, Duplicate
Layer 3 (Long Press): Rename, Delete, Export
Layer 4 (Advanced): Studio, Analytics, Settings
```

**Anti-Patterns:**
❌ Dashboard со всем сразу  
❌ More than 3 primary CTAs  
❌ No indication of hidden features

---

### Principle 6: Zero Dead Ends

> **任何屏幕都包含下一步**

**Definition:**

- Every screen has forward momentum
- No terminal states
- Clear next action

**Implementation:**

- Empty state → CTA to create
- Error state → Retry or alternative path
- Success state → Next action (share, play, edit)
- Completion state → Suggested next steps

**Screen Flow:**

```
Empty → [Create First Track]
Success → [Share] [Create Another] [Edit in Studio]
Error → [Retry] [Contact Support]
Detail → [Play] [Edit] [Share] [Delete]
```

**Anti-Patterns:**
❌ "No tracks found" без action  
❌ Success toast без follow-up  
❌ Modal без primary CTA

---

### Principle 7: AI First

> **所有手动操作都有AI对应物**

**Definition:**

- Manual actions → AI alternatives
- AI suggested by default
- Human + AI collaboration

**Implementation:**

- Prompt: "Help me write lyrics" button
- Style: AI suggestions based on context
- Structure: AI arrangement of sections
- Mixing: AI stem balancing
- Mastering: AI enhancement

**AI Integration Layers:**

```
Layer 1: AI Assistance (optional, suggested)
Layer 2: AI Co-creation (collaborative)
Layer 3: AI Automation (one-tap generation)
```

**Anti-Patterns:**
❌ Pure manual flows  
❌ AI features hidden  
❌ No AI suggestions

---

### Principle 8: One Hand UX

> **主要动作可以用拇指完成**

**Definition:**

- Thumb zone for primary actions
- Reachability for all key features
- Gesture-first interaction

**Implementation:**

- Primary actions: bottom 1/3 of screen
- FAB: bottom-right corner
- Navigation: bottom tab bar
- Gestures: swipe, tap, long press

**Thumb Zone Map:**

```
┌────────────────────────┐
│  Top Bar (stretch)     │ ← Hard to reach
├────────────────────────┤
│  Content (scrollable)   │ ← Reachable
├────────────────────────┤
│  Bottom Nav (easy)     │ ← Primary zone
│  [FAB] (thumb zone)    │ ← Most important
└────────────────────────┘
```

**Anti-Patterns:**
❌ Primary CTAs at top  
❌ Two-handed requirements  
❌ No gesture alternatives

---

### Principle 9: Reduce Cognitive Load

> **屏幕上不超过一个主要CTA**

**Definition:**

- One primary action per screen
- Secondary actions de-emphasized
- Clear visual hierarchy

**Implementation:**

- Primary: largest, most prominent
- Secondary: smaller, less visible
- Tertiary: hidden until interaction
- Visual hierarchy: size, color, position

**Visual Hierarchy:**

```
Primary Button:    100% opacity, largest size
Secondary Button:  70% opacity, medium size
Tertiary Action:   40% opacity, small size (icon)
```

**Anti-Patterns:**
❌ Multiple equal-weighted buttons  
❌ No clear primary action  
❌ Visual clutter

---

### Principle 10: Always Recoverable

> **任何动作都可以撤销**

**Definition:**

- No permanent actions without confirmation
- Undo available for all destructive actions
- Recovery from mistakes

**Implementation:**

- Delete → Undo toast (5 seconds)
- Major changes → Confirmation dialog
- Edit history → Infinite undo
- Soft delete with 30-day recovery

**Undo Architecture:**

```
Action → Immediate UI Update
       ↓
     Undo Toast (5s window)
       ↓
   Background Commit
       ↓
   Revision History
```

**Anti-Patterns:**
❌ Permanent delete without confirmation  
❌ No undo for destructive actions  
❌ Lost work on error

---

# 2. ENTITY MODEL

## Core Entity Hierarchy

```
Workspace (User's universe)
├── Projects (Creative containers)
│   ├── Sessions (Work sessions)
│   ├── Generations (AI outputs)
│   ├── Versions (A/B variants)
│   └── Assets (Associated files)
├── AI Artists (Virtual personas)
│   ├── Voices (Voice clones)
│   ├── Personas (Characteristics)
│   ├── Styles (Musical preferences)
│   └── Discography (Output catalog)
├── Library (Personal collection)
│   ├── Tracks (Owned music)
│   ├── Albums (Grouped releases)
│   ├── Playlists (Curated collections)
│   └── Favorites (Liked items)
├── Marketplace (Community)
│   ├── Public Tracks
│   ├── AI Artists
│   ├── Templates
│   └── Presets
├── Publishing (Distribution)
│   ├── Releases
│   ├── Platforms
│   └── Analytics
├── Monetization (Economy)
│   ├── Credits
│   ├── Subscriptions
│   ├── Earnings
│   └── Transactions
├── Social (Community)
│   ├── Followers
│   ├── Following
│   ├── Activity Feed
│   └── Notifications
└── Account (User profile)
    ├── Profile
    ├── Settings
    ├── Billing
    └── Analytics
```

## Entity Relationships

```
User
├─ HAS MANY Projects
├─ HAS MANY AI Artists
├─ HAS MANY Tracks (Library)
├─ HAS MANY Playlists
├─ HAS MANY Notifications
│
Project
├─ BELONGS TO User
├─ HAS MANY Generations
├─ HAS MANY Sessions
├─ HAS MANY Assets
│
Generation
├─ BELONGS TO Project
├─ HAS MANY Versions (A/B)
├─ CREATES Track
├─ USES AI Artist (optional)
├─ USES Style
└─ HAS Lyrics (optional)
│
Track
├─ BELONGS TO User (Library)
├─ COMES FROM Generation
├─ HAS MANY Versions
├─ HAS MANY Stems
├─ MAY BE IN Playlist
├─ MAY HAVE MIDI
└─ HAS Analytics
│
AI Artist
├─ BELONGS TO User
├─ HAS Voice
├─ HAS Persona
├─ HAS Style Profile
├─ HAS Discography (Tracks)
└─ HAS Followers
│
Playlist
├─ BELONGS TO User
├─ HAS MANY Tracks
├─ MAY BE Public
└─ HAS Analytics
```

## Entity Lifecycles

### Generation Lifecycle

```
Draft → Planning → Generating → Streaming → Completed → Published → Archived
```

### Track Lifecycle

```
Generated → Edited → Versioned → Released → Published → Monetized → Archived
```

### Project Lifecycle

```
Created → Active → Completed → Published → Archived → Deleted
```

### AI Artist Lifecycle

```
Created → Configured → Active → Published → Monetized → Archived
```

---

# 3. JOBS TO BE DONE

## Core JTBD Framework

### Primary Jobs (Must-Have)

#### JTBD 1: Create a Track

**When:** I have an idea or mood  
**Want to:** Quickly generate music  
**Expect:** AI handles complexity, I guide direction

**Solution:** Generation form with AI assistance

---

#### JTBD 2: Iterate on a Track

**When:** Generated track is close but not perfect  
**Want to:** Refine, regenerate parts, adjust  
**Expect:** Preserve progress, easy experimentation

**Solution:** Studio with section regeneration

---

#### JTBD 3: Write Lyrics

**When:** I have themes but no words  
**Want to:** AI to generate or suggest lyrics  
**Expect:** Context-aware, style-appropriate

**Solution:** Lyrics studio with AI assistant

---

#### JTBD 4: Create an AI Artist

**When:** I want a consistent musical identity  
**Want to:** Define voice, style, persona  
**Expect:** Coherent output across generations

**Solution:** AI Artist creation wizard

---

#### JTBD 5: Clone a Voice

**When:** I have a reference voice  
**Want to:** Use it for generations  
**Expect:** High-quality voice matching

**Solution:** Voice cloning with reference upload

---

#### JTBD 6: Organize Music

**When:** I have many tracks  
**Want to:** Group, find, manage  
**Expect:** Flexible organization, fast search

**Solution:** Projects, playlists, library

---

#### JTBD 7: Publish & Share

**When:** Track is ready  
**Want to:** Distribute, share, get feedback  
**Expect:** One-click publishing, social sharing

**Solution:** Publishing wizard, social integration

---

#### JTBD 8: Discover Music

**When:** I want inspiration  
**Want to:** Browse community, trending  
**Expect:** Quality discovery, personalized

**Solution:** Marketplace, community feed, recommendations

---

#### JTBD 9: Monetize

**When:** I have audience  
**Want to:** Earn from creations  
**Expect:** Transparent monetization, fair splits

**Solution:** Monetization dashboard, revenue sharing

---

#### JTBD 10: Analyze Performance

**When:** I want to understand impact  
**Want to:** See stats, trends, insights  
**Expect:** Clear analytics, actionable

**Solution:** Analytics dashboard, performance metrics

---

### Secondary Jobs (Nice-to-Have)

- Collaborate with others
- Create albums/releases
- Build discography
- Manage multiple AI artists
- Customize UI preferences
- Export to different formats
- Integrate with DAWs
- Schedule releases
- A/B test versions
- Batch process

---

# 4. DESIGN CONSTRAINTS

## Hard Limits (Mandatory)

### Navigation Items

```
Maximum Bottom Nav Items: 5
Maximum Sidebar Items: 7
Maximum Tabs: 5
Maximum Breadcrumb Levels: 3
```

### Buttons

```
Maximum Primary Buttons: 1 per screen
Maximum FABs: 1 per screen
Maximum Buttons in Group: 3
Maximum Buttons in Modal: 2 (Primary + Cancel)
```

### Content

```
Maximum Card Lines: 2 lines of text
Maximum List Items: 20 before pagination
Maximum Nested Menus: 3 levels
Maximum Form Fields: 5 per screen
```

### Quick Actions

```
Maximum Quick Actions: 6
Maximum Bottom Sheet Actions: 5
Maximum Context Menu Items: 6
```

### CTAs

```
Maximum Simultaneous CTAs: 4 per screen
Maximum CTA Length: 25 characters
Maximum CTA Hierarchy Levels: 3
```

### Visual

```
Maximum Columns: 4 (desktop), 2 (tablet), 1 (mobile)
Maximum Card Size: 400×400px
Maximum Icon Size: 64×64px
Minimum Touch Target: 44×44px
```

## Soft Limits (Guidelines)

```
Recommended Screen Density: Comfortable (70%)
Recommended Form Length: 3-5 fields
Recommended List Density: 10-15 items
Recommended Navigation Depth: 3 levels
Recommended Modal Size: 90% viewport
```

---

# 5. UX LAWS

## Mandatory Application

### Fitts's Law

**Law:** Time to acquire target = distance + size  
**Application:**

- Primary targets → largest, closest
- Critical actions → thumb zone
- Destructive actions → harder to reach

**Implementation:**

```
Primary Button (FAB): Bottom-right, largest
Secondary Actions: Bottom-left, medium
Tertiary Actions: Top-right, small (stretch)
```

---

### Hick's Law

**Law:** More choices = longer decision time  
**Application:**

- Limit simultaneous options
- Progressive disclosure
- Default selections

**Implementation:**

```
Generation Form: Show 3 styles initially, "More" expands
Menus: Max 6 visible items, others scroll
Filters: Max 4 active at once
```

---

### Jakob's Law

**Law:** Users spend most time on other sites  
**Application:**

- Follow platform conventions
- Familiar patterns
- Mental models

**Implementation:**

```
Mobile: Bottom nav (standard)
Desktop: Left sidebar (standard)
Gestures: Swipe to back (standard)
Icons: Universal meanings
```

---

### Miller's Law

**Law:** Working memory = 7±2 items  
**Application:**

- Chunk information
- Limit simultaneous items
- Visual grouping

**Implementation:**

```
Lists: Max 7-9 items before grouping
Forms: Max 5 fields per screen
Options: Group related choices
Navigation: Max 5 top-level items
```

---

### Tesler's Law

**Law:** Complexity conservation  
**Application:**

- Push complexity to system
- Simplify user experience
- AI handles complexity

**Implementation:**

```
Generation: User types intent, AI handles parameters
Mixing: User sets mood, AI balances stems
Publishing: User clicks publish, AI handles distribution
```

---

### Peak-End Rule

**Law:** Memory = peak + final moments  
**Application:**

- End interactions positively
- Create memorable peaks
- Smooth transitions

**Implementation:**

```
Generation: Celebratory success screen
Export: Optimistic progress + completion toast
Error: Helpful message + clear next step
```

---

### Serial Position Effect

**Law:** Remember first + last items best  
**Application:**

- Critical items at edges
- Secondary items middle
- Strategic placement

**Implementation:**

```
Lists: Most important first
Menus: Cancel button last (right)
Navigation: Home left, Profile right
```

---

### Zeigarnik Effect

**Law:** Remember incomplete tasks  
**Application:**

- Show in-progress items
- Clear completion states
- Resume capability

**Implementation:**

```
Projects: Active ones shown first
Generations: In-progress at top
Drafts: Persistent until complete
```

---

### Doherty Threshold

**Law:** Productivity ↑ when response < 400ms  
**Application:**

- Instant feedback (<100ms)
- Optimistic updates
- Progressive loading

**Implementation:**

```
Tap: Visual feedback immediately (<100ms)
API: Show skeleton, reveal when ready (<400ms)
Generation: Show progress, stream results
```

---

### Aesthetic-Usability Effect

**Law:** Beautiful design = more usable  
**Application:**

- Consistent visual language
- Polished animations
- Attention to detail

**Implementation:**

```
Motion: Smooth transitions (40% ease)
Spacing: Consistent gaps (8px grid)
Typography: Clear hierarchy (line-height 1.5)
```

---

# 6. NAVIGATION HIERARCHY

## Layer System

```
GLOBAL NAVIGATION (Level 0)
├── Bottom Navigation Bar (Mobile)
├── Sidebar Navigation (Desktop)
└── Top Navigation Bar (Tablet)
    ↓
WORKSPACE NAVIGATION (Level 1)
├── Tabs (Projects, Library, Artists)
├── Segmented Control (All, Active, Archived)
└── Filter Chips (Type, Status, Tag)
    ↓
PROJECT NAVIGATION (Level 2)
├── Project Header (Title, Actions)
├── Timeline (Sessions, Generations)
├── Tab Bar (Overview, Generations, Versions)
└── Quick Actions (Add, Share, Export)
    ↓
GENERATION NAVIGATION (Level 3)
├── Generation Header (Prompt, Status)
├── Version Selector (A, B, C, ...)
├── Action Bar (Play, Edit, Share, Delete)
└── Context Menu (More options)
    ↓
TRACK NAVIGATION (Level 4)
├── Track Card (Cover, Title, Artist)
├── Playback Controls (Play, Pause, Next)
├── Version Switcher (A/B comparison)
└── Action Menu (Like, Download, More)
    ↓
CONTEXT MENU (Level 5)
├── Quick Actions (Edit, Duplicate, Share)
├── Destructive Actions (Delete, Archive)
└── Advanced Actions (Export, Analytics)
    ↓
BOTTOM SHEET (Level 6)
├── Sheet Header (Title, Close)
├── Scrollable Content (Forms, Lists)
└── Sheet Footer (Primary, Cancel)
    ↓
DIALOG (Level 7)
├── Dialog Header (Title, Description)
├── Dialog Content (Form, Info)
└── Dialog Footer (Actions)
```

## Navigation Patterns

### Mobile Navigation

```
┌──────────────────────────────────────┐
│ Top Bar: Logo, Search, Notifications  │ ← Level 0
├──────────────────────────────────────┤
│                                      │
│  [Content Area with Sheet/Modal]      │ ← Levels 1-6
│                                      │
├──────────────────────────────────────┤
│ [Home] [Create] [Library] [Profile]  │ ← Level 0
│         ↓            ↓                │
│       FAB        Active Indicator      │
└──────────────────────────────────────┘
```

### Desktop Navigation

```
┌──────────┬────────────────────────────┐
│ Sidebar  │ Top Bar: Breadcrumbs      │ ← Level 0
│ Nav      ├────────────────────────────┤
│          │                            │
│ - Home   │  [Content Area]            │ ← Levels 1-6
│ - Create │  [Dialogs/Modals]          │
│ - Library│                            │
│ - Artists│                            │
│ - Profile│                            │
└──────────┴────────────────────────────┘
```

---

# 7. OBJECT RELATIONSHIPS

## Relationship Rules

### One-to-Many (1:N)

```
User → Projects
User → AI Artists
User → Tracks
Project → Generations
Project → Sessions
Track → Versions
AI Artist → Tracks
```

### Many-to-Many (N:M)

```
Tracks ↔ Playlists
Users ↔ Followers
Projects ↔ Tags
Generations ↔ Styles
```

### Hierarchical

```
Workspace → Projects → Generations → Versions
User → Profile → Settings → Preferences
```

### Reference-based

```
Generation references AI Artist
Track references Generation
Playlist references Tracks
Release references Tracks
```

## Relationship Constraints

### Ownership Rules

```
- User owns all their Projects
- User owns all their AI Artists
- User owns all their Tracks (unless published)
- Published Tracks belong to community but credited to User
```

### Visibility Rules

```
Private Projects: Visible only to owner
Public Tracks: Visible to everyone
AI Artists: Public by default (discoverable)
Playlists: Private by default (opt-in public)
```

### Deletion Rules

```
Delete User → Delete all owned entities (cascade)
Delete Project → Delete all generations (soft delete)
Delete Track → Keep in projects (reference only)
Delete AI Artist → Keep in tracks (reference only)
```

---

# 8. ACTION PRIORITY MATRIX

## Tier System

### Tier 1: Critical (Always Visible)

```
Priority: MUST HAVE
Visibility: Always visible
Placement: Thumb zone, primary position

Actions:
- Create Track (FAB)
- Continue Project (Resume CTA)
- Play (Primary action on track)
```

### Tier 2: High (One Tap Away)

```
Priority: SHOULD HAVE
Visibility: On tap or swipe
Placement: Bottom sheet, quick actions

Actions:
- Edit (Tap → Studio)
- Duplicate (Long press → Duplicate)
- Share (Share button)
- Like (Heart icon)
```

### Tier 3: Medium (In Menus)

```
Priority: NICE TO HAVE
Visibility: In overflow menu
Placement: Context menu, more actions

Actions:
- Rename (Long press → Rename)
- Move to project (Menu → Move)
- Add to playlist (Menu → Add)
- Download (Menu → Download)
```

### Tier 4: Low (Advanced)

```
Priority: OPTIONAL
Visibility: In advanced menu
Placement: Settings, advanced options

Actions:
- Archive (Settings → Archive)
- Export MIDI (Advanced menu)
- View analytics (Profile → Analytics)
- Delete (Long press → Delete)
```

### Tier 5: Rare (Destructive)

```
Priority: RESTRICTED
Visibility: Hidden until confirmation
Placement: Confirmation dialogs

Actions:
- Delete permanently (Confirmation → Delete)
- Unpublish (Confirmation → Unpublish)
- Remove voice (Confirmation → Remove)
```

## Action Placement Rules

```
FAB: Tier 1 actions only
Bottom Nav: Tier 1 navigation
Bottom Sheet: Tier 1-2 actions
Context Menu: Tier 2-3 actions
Settings: Tier 4-5 actions
Dialog: Tier 1-5 (depending on context)
```

---

# 9. SCREEN INVENTORY

## Complete Screen List (63 Screens)

### Onboarding & Auth (4 screens)

```
1. Splash Screen
2. Onboarding (Feature intro)
3. Auth (Telegram login)
4. Profile Setup (First-time config)
```

### Home & Generation (3 screens)

```
5. Home (Dashboard)
6. Generation Form (Create track)
7. Generation Result (Success screen)
```

### Projects (6 screens)

```
8. Projects List
9. Project Detail
10. Project Settings
11. Project Timeline
12. Project Sessions
13. Project Analytics
```

### Library (8 screens)

```
14. Library Home
15. Track Detail
16. Album Detail
17. Playlist Detail
18. Favorites
19. Recently Played
20. Downloads
21. Library Settings
```

### AI Artists (7 screens)

```
22. Artists List
23. Artist Profile
24. Artist Creation
25. Artist Settings
26. Voice Library
27. Voice Cloning
28. Voice History
```

### Studio (8 screens)

```
29. Studio Hub
30. New Project
31. Unified Studio
32. Stem Mixer
33. Waveform Editor
34. Lyrics Studio
35. MIDI Editor
36. Export Options
```

### Marketplace (6 screens)

```
37. Marketplace Home
38. Trending
39. New Releases
40. Community
41. Templates
42. Presets
```

### Publishing (5 screens)

```
43. Publishing Wizard
44. Release Setup
45. Distribution
46. Monetization Settings
47. Release Analytics
```

### Social (5 screens)

```
48. Feed
49. Notifications
50. Followers
51. Following
52. Messages
```

### Profile & Settings (6 screens)

```
53. User Profile
54. Edit Profile
55. Account Settings
56. App Settings
57. Billing
58. Subscription
```

### Admin (5 screens)

```
59. Admin Dashboard
60. User Management
61. Content Moderation
62. Analytics
63. System Settings
```

---

# 10. EMPTY STATES

## Empty State Requirements

### Format

```
┌────────────────────────────────┐
│                                │
│        [Illustration]          │ ← Friendly visual
│                                │
│     Headline (2-3 words)       │ ← Clear message
│                                │
│  Description (1-2 sentences)   │ ← Context
│                                │
│    [Primary CTA]               │ ← Action
│                                │
└────────────────────────────────┘
```

### Empty State Catalog

#### No Tracks

```
Headline: No tracks yet
Description: Create your first AI-generated track
CTA: Create Track
```

#### No Credits

```
Headline: Out of credits
Description: Purchase credits to continue creating
CTA: Buy Credits
```

#### No Projects

```
Headline: No projects yet
Description: Start creating to organize your music
CTA: Create First Track
```

#### No Library

```
Headline: Your library is empty
Description: Generated tracks will appear here
CTA: Create Music
```

#### No Internet

```
Headline: No connection
Description: Check your internet and try again
CTA: Retry
```

#### No Search Results

```
Headline: No results found
Description: Try different keywords or filters
CTA: Clear Search
```

#### No Notifications

```
Headline: All caught up!
Description: You'll see updates here
CTA: Explore Community
```

#### No Followers

```
Headline: No followers yet
Description: Share your profile to gain followers
CTA: Share Profile
```

---

# 11. MOTION SYSTEM

## Animation Principles

### Timing Standards

```
Instant: 100ms (button feedback)
Fast: 200ms (toggle, menu open)
Standard: 300ms (page transition)
Slow: 500ms (hero animations)
Deliberate: 800ms (complex sequences)
```

### Easing Functions

```
Ease In: - → decelerate (entry)
Ease Out: accelerate → - (exit)
Ease In-Out: - → accelerate → decelerate (both)
Custom: 40% ease (standard)
```

## Transition Types

### Push

```
Next screen slides in from right
Current screen slides out to left
Duration: 300ms
Easing: 40% ease
```

### Modal

```
Overlay fades in (0% → 100%)
Modal scales up (90% → 100%)
Duration: 200ms
Easing: ease-out
```

### Bottom Sheet

```
Sheet slides up from bottom
Overlay fades in
Duration: 300ms
Easing: 40% ease
```

### Hero

```
Shared element morphs between screens
Content cross-fades
Duration: 400ms
Easing: ease-in-out
```

### Shared Element

```
Hero image expands to detail
Text cross-fades
Background morphs
Duration: 500ms
Easing: custom bezier
```

## Micro Animations

### Loading

```
Spinner: 1s rotation loop
Skeleton: shimmer 1.5s loop
Pulse: 2s fade loop
Progress bar: smooth fill
```

### Morph

```
Icon → Icon: 200ms shape morph
Button → FAB: 300ms expand/collapse
Card → Sheet: 400ms unfold
```

### FAB Expand

```
FAB → Sheet: 300ms expansion
Button reveals options
Background fades in
Duration: 300ms
Easing: ease-out
```

## Motion Guidelines

```
DO:
- Use motion to guide attention
- Maintain 60fps performance
- Respect reduced motion preference
- Keep transitions consistent

DON'T:
- Animate without purpose
- Use jarring or sudden movements
- Over-animate (motion sickness)
- Animate layout shifts
```

---

# 12. AI UX ARCHITECTURE

## AI State System

### Generation States

#### Thinking

```
Definition: AI is processing prompt
Duration: 1-3s
UI: Pulse animation, "Thinking..."
```

#### Planning

```
Definition: AI is structuring generation
Duration: 2-5s
UI: Progress steps, "Planning structure..."
```

#### Reasoning

```
Definition: AI is making creative decisions
Duration: 3-10s
UI: Thought bubbles, "Selecting style..."
```

#### Generating

```
Definition: AI is creating audio
Duration: 30-60s
UI: Progress bar, "Generating music..."
```

#### Retrying

```
Definition: AI is retrying failed generation
Duration: Variable
UI: Retry indicator, "Retrying..."
```

#### Streaming

```
Definition: Audio is streaming in real-time
Duration: Until complete
UI: Progressive waveform, "Streaming..."
```

#### Queued

```
Definition: Request is in queue
Duration: Until capacity
UI: Queue position, "Queued: #3"
```

#### Waiting

```
Definition: Awaiting user input
Duration: Until response
UI: Prompt, "Waiting for input..."
```

### AI Feedback System

#### Progress Indicators

```
Determinate: Known duration (progress bar)
Indeterminate: Unknown duration (spinner)
Estimated: Approximate duration ("~45s remaining")
```

#### Thought Display

```
Transparency: Show AI reasoning
Confidence: Display certainty level
Alternatives: Suggest options
```

#### Error Recovery

```
Auto-retry: For transient failures
Fallback: To alternative approaches
Guidance: Suggest user action
```

## AI Interaction Patterns

### Co-creation Mode

```
User → Input prompt
AI → Suggests refinements
User → Accepts or edits
AI → Generates based on feedback
```

### Assistance Mode

```
User → Starts action
AI → Offers help
User → Accepts assistance
AI → Completes action
```

### Automation Mode

```
User → Sets goal
AI → Executes autonomously
AI → Reports progress
User → Reviews result
```

---

# 13. INFORMATION DENSITY

## Density Levels

### Minimal (25%)

```
Use: Onboarding, empty states, splash
Elements: Large text, generous spacing
White space: 75% of screen
Examples: Welcome screen, success states
```

### Comfortable (50%)

```
Use: Main screens, dashboards, forms
Elements: Balanced sizes, moderate spacing
White space: 50% of screen
Examples: Home, library, projects
```

### Dense (75%)

```
Use: Lists, tables, analytics
Elements: Compact sizes, tight spacing
White space: 25% of screen
Examples: Track list, admin dashboard
```

### Developer (100%)

```
Use: Technical interfaces, logs
Elements: Maximum information, minimal spacing
White space: 10% of screen
Examples: Admin logs, system status
```

## Density Guidelines

```
Mobile: Comfortable → Dense
Tablet: Comfortable
Desktop: Minimal → Comfortable → Dense (user choice)
```

---

# 14. CARD HIERARCHY

## Card Types

### Hero Card

```
Size: Full-width, large
Content: Cover, title, subtitle, actions
Use: Featured content, promotions
Example: New release, trending track
```

### Primary Card

```
Size: Medium-large
Content: Cover, title, metadata, actions
Use: Main content display
Example: Track card, artist card
```

### Secondary Card

```
Size: Medium
Content: Cover, title, brief metadata
Use: Supporting content
Example: Playlist card, album card
```

### Compact Card

```
Size: Small
Content: Cover, title (truncated)
Use: Dense displays
Example: Grid view, quick access
```

### List Card

```
Size: Full-width, short
Content: Icon, title, metadata, actions
Use: List views
Example: Track row, notification item
```

### Metric Card

```
Size: Variable
Content: Label, value, change indicator
Use: Analytics, stats
Example: Play count, likes, revenue
```

### Media Card

```
Size: Variable, focus on media
Content: Large cover, minimal text
Use: Visual-first displays
Example: Cover art, voice preview
```

### AI Card

```
Size: Variable
Content: AI status, progress, controls
Use: AI interactions
Example: Generation status, AI assistant
```

---

# 15. ADAPTIVE RULES

## Screen Types

### Phone (<640px)

```
Navigation: Bottom nav (5 items max)
Layout: Single column
Touch: 44×44px minimum
Density: Comfortable → Dense
Cards: Compact → Primary
```

### Foldable (640-768px)

```
Navigation: Bottom nav or sidebar
Layout: Single or dual column
Touch: 44×44px minimum
Density: Comfortable
Cards: Primary → Secondary
```

### Tablet (768-1024px)

```
Navigation: Sidebar
Layout: Dual column
Touch: 44×44px minimum
Density: Comfortable
Cards: Primary → Hero
```

### Desktop (1024-1280px)

```
Navigation: Sidebar
Layout: Multi-column
Mouse: Standard pointers
Density: Minimal → Comfortable
Cards: Hero → Primary → Secondary
```

### UltraWide (>1280px)

```
Navigation: Sidebar
Layout: Multi-column, max-width
Mouse: Standard pointers
Density: Minimal → Comfortable → Dense
Cards: Hero → Primary → Secondary → Compact
```

---

# 16. CONTENT STRATEGY

## Content Types

### Recents

```
Definition: Last accessed items
Algorithm: Chronological (most recent first)
Limit: 10 items
Update: Real-time
```

### Continue

```
Definition: In-progress items
Algorithm: Priority (active → draft → recent)
Limit: 5 items
Update: Real-time
```

### Trending

```
Definition: Most popular in period
Algorithm: Engagement score (likes, plays, shares)
Period: 7 days, 30 days, all time
Limit: 20 items
Update: Daily
```

### Templates

```
Definition: Pre-made starting points
Algorithm: Curated + personalized
Categories: Genre, mood, use case
Limit: 50 templates
Update: Weekly
```

### AI Suggestions

```
Definition: AI-recommended content
Algorithm: Collaborative filtering
Personalization: User history + preferences
Limit: 10 items
Update: Real-time
```

### Recommended Voices

```
Definition: Suggested voice clones
Algorithm: Similarity to user's favorites
Categories: Genre, language, style
Limit: 15 voices
Update: Weekly
```

### Community

```
Definition: User-generated content
Algorithm: Quality score + engagement
Filtering: Safe content, policy compliant
Limit: Unlimited (paginated)
Update: Real-time
```

---

# 17. MONETIZATION UX

## Monetization Elements

### Credits

```
Display: Badge with count
Action: Buy more, earn, watch ad
Warning: Low credit alert
```

### Subscription

```
Display: Tier badge (Free, Pro, Premium)
Action: Upgrade, manage, billing
Benefits: Feature highlights
```

### Marketplace

```
Display: Price, commission
Action: Buy, sell, negotiate
History: Transaction list
```

### Boost

```
Display: Boost button
Action: Pay to promote
Result: Increased visibility
```

### Premium

```
Display: Premium badge
Action: Upgrade to access
Features: Exclusive content
```

### Paywall

```
Display: Upgrade screen
Action: Subscribe or purchase
Benefits: Feature comparison
```

### Referral

```
Display: Referral code
Action: Share, earn rewards
Tracking: Referral analytics
```

---

# 18. NOTIFICATION SYSTEM

## Notification Types

### Toast

```
Duration: 3s
Position: Bottom-center
Style: Minimal, icon + text
Use: Success, confirmation
```

### Snackbar

```
Duration: 5s
Position: Bottom-center
Style: Text + action button
Use: Undo, retry
```

### Badge

```
Display: Number indicator
Position: Top-right of icon
Style: Red circle with count
Use: Unread count
```

### Push

```
Delivery: OS notification
Action: Open to relevant screen
Permission: Optional (request on first use)
Use: Important updates
```

### Inbox

```
Display: Notification list
Position: Dedicated screen
Style: Full notification detail
Use: All notifications history
```

### Activity Feed

```
Display: Chronological stream
Position: Home, community
Style: Rich cards with actions
Use: Social updates
```

---

# 19. SEARCH ARCHITECTURE

## Search Scope

### Universal Search

```
Scope: All entity types
Results: Grouped by type
Ranking: Relevance + popularity
```

### Tracks Search

```
Fields: Title, style, tags
Filters: Type, status, date
Sorting: Relevance, recent, popular
```

### Projects Search

```
Fields: Name, description
Filters: Status, date
Sorting: Recent, name
```

### Artists Search

```
Fields: Name, style
Filters: Genre, popularity
Sorting: Relevance, popular
```

### Voices Search

```
Fields: Name, description
Filters: Language, style
Sorting: Relevance, recent
```

### Lyrics Search

```
Fields: Lyrics text
Filters: Language, genre
Sorting: Relevance
```

### Community Search

```
Fields: Title, artist, tags
Filters: Type, date, popularity
Sorting: Trending, recent, popular
```

### Marketplace Search

```
Fields: Title, description, tags
Filters: Category, price, rating
Sorting: Relevance, popular, price
```

---

# 20. ACCESSIBILITY STANDARDS

## WCAG 2.1 AA Compliance

### Visual

```
Color Contrast: 4.5:1 (normal), 3:1 (large)
Text Resizing: 200% zoomable
Text Spacing: 1.5 line height, 0.12em letter spacing
Focus Indicators: Visible, clear
```

### Auditory

```
Captions: For all audio content
Audio Control: Adjustable volume, mute
Audio Alternatives: Text transcripts
```

### Keyboard

```
Navigation: Full keyboard access
Focus Order: Logical, predictable
Shortcuts: Standard shortcuts (Space, Enter, Esc)
No Keyboard Traps: Easy exit
```

### Screen Reader

```
ARIA Labels: All interactive elements
ARIA Descriptions: Complex widgets
Live Regions: Dynamic updates
Semantic HTML: Proper landmarks
```

### Motion

```
Reduced Motion: Respect prefers-reduced-motion
Pause Control: Stop animation on request
Duration: No auto-play > 5s
```

### Touch

```
Target Size: 44×44px minimum
Spacing: 8px between targets
Gestures: Alternative controls available
No Motion: Essential functions don't require motion
```

### Cognitive

```
Error Prevention: Clear input validation
Error Recovery: Helpful messages, undo
Consistent Navigation: Predictable layouts
Timeouts: Warnings, extendable
```

---

## END OF CONSTITUTION

This document is the **single source of truth** for all product design decisions at MusicVerse AI.

**Amendment Process:**

1. Proposal submitted to product council
2. Impact analysis across all entities
3. Stakeholder review
4. A/B testing for significant changes
5. Version update with changelog

**Current Version:** 2.0 Enterprise  
**Status:** Production-Ready  
**Maintainer:** Product Design Team  
**Review Cycle:** Quarterly

---

**Generated for:** MusicVerse AI Platform  
**Level:** Apple + Linear + Spotify + OpenAI + Vercel  
**Last Updated:** 2026-06-27
