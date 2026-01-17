# Feature Specification: Mobile-First Minimalist UI Redesign

**Feature Branch**: `001-mobile-ui-redesign`
**Created**: 2026-01-17
**Status**: Draft
**Input**: User description: "изучи в деталях интерфейс приложения, его функционал и пути пользовател. составь спецификацию для доработки интерфейса, минимализм и стильный дизайн с ориентацией на мобильые"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Streamlined Mobile Home (Priority: P1)

Users want a clean, focused home screen that highlights the most important actions without overwhelming them with options. The current home page has too many sections and elements competing for attention.

**Why this priority**: The home screen is the primary entry point for 80% of users. A cluttered home screen creates cognitive load and reduces user engagement. This is the foundation for the entire redesign.

**Independent Test**: Can be tested by navigating to the home screen and verifying the simplified layout exists and all primary actions (generate, library, quick play) are accessible within 2 taps.

**Acceptance Scenarios**:

1. **Given** a user opens the app on mobile, **When** the home screen loads, **Then** they see a maximum of 4 primary content sections (Quick Create, Featured, Recent Plays, Quick Start)
2. **Given** a user is on the home screen, **When** they want to create music, **Then** the primary "Create" action is available within one tap via the FAB
3. **Given** a user is on the home screen, **When** they scroll down, **Then** sections load progressively with smooth animations
4. **Given** a user is on the home screen, **When** they view content, **Then** each section has a clear visual hierarchy with consistent spacing

---

### User Story 2 - Simplified Navigation System (Priority: P1)

Users want to navigate the app intuitively without confusion. The current bottom navigation with 5 tabs plus a floating FAB creates visual clutter and decision paralysis.

**Why this priority**: Navigation is used constantly. Poor navigation directly impacts user retention and task completion rates.

**Independent Test**: Can be tested by navigating between all main sections of the app and verifying each is reachable within 2 taps from any screen.

**Acceptance Scenarios**:

1. **Given** a user is on any screen, **When** they want to navigate, **Then** they see a maximum of 4 navigation items (5 including FAB)
2. **Given** a user is in a secondary section (settings, profile), **When** they tap the back button or swipe, **Then** they return to the previous screen smoothly
3. **Given** a user switches between tabs, **When** the tab changes, **Then** the transition is animated and provides visual feedback
4. **Given** a user is on the home screen, **When** they tap the FAB, **Then** they immediately see creation options without additional navigation steps

---

### User Story 3 - Minimalist Track Cards and Lists (Priority: P2)

Users want to browse and interact with their music library using a clean, focused interface. The current track cards have too much information, multiple variants, and inconsistent styling.

**Why this priority**: The library is the most frequently used feature after playback. Better information design improves scanning speed and reduces user fatigue.

**Independent Test**: Can be tested by viewing the track library and verifying all track information is readable, tappable, and visually consistent across all items.

**Acceptance Scenarios**:

1. **Given** a user opens their track library, **When** the list renders, **Then** each track card shows only essential information (title, style, duration, play button)
2. **Given** a user views track cards, **When** they look at the layout, **Then** all cards use consistent spacing (16-24px gaps) and alignment
3. **Given** a user interacts with a track card, **When** they tap it, **Then** the card responds with a subtle animation (scale or opacity change)
4. **Given** a user wants additional actions on a track, **When** they swipe or long-press, **Then** a contextual menu appears with relevant options (play, like, share, delete)

---

### User Story 4 - Focused Generation Form (Priority: P2)

Users want to generate music quickly without being overwhelmed by form fields. The current generation form has too many options visible at once, making it feel complex and intimidating.

**Why this priority**: Music generation is the core value proposition. A simpler form increases conversion rates and user satisfaction.

**Independent Test**: Can be tested by opening the generation form and completing a music generation using only essential fields.

**Acceptance Scenarios**:

1. **Given** a user opens the generation form, **When** it first appears, **Then** only the most essential fields are visible (prompt input, style selector)
2. **Given** a user is using the simple mode, **When** they want more options, **Then** they can expand to see advanced settings (lyrics, reference audio, custom parameters)
3. **Given** a user fills in the prompt field, **When** they submit, **Then** the form validates input and provides clear error messages if needed
4. **Given** a user selects a style, **When** the selection is made, **Then** they see a visual confirmation of their choice

---

### User Story 5 - Unified Player Experience (Priority: P2)

Users want a consistent player experience across all player states (compact, expanded, fullscreen). The current three-player model can be confusing and the transitions are not always smooth.

**Why this priority**: The player is used constantly. Inconsistent player states create confusion and reduce perceived polish.

**Independent Test**: Can be tested by playing a track and transitioning between all player states, verifying smooth animations and consistent controls.

**Acceptance Scenarios**:

1. **Given** a user plays a track, **When** the compact player appears, **Then** it shows essential controls (play/pause, progress, cover art)
2. **Given** the compact player is visible, **When** the user swipes up or taps it, **Then** it smoothly expands to show additional controls (queue, lyrics, version switcher)
3. **Given** the player is expanded, **When** the user continues swiping up, **Then** it transitions to fullscreen mode with full controls
4. **Given** the player is in any state, **When** the user interacts with controls, **Then** all buttons respond with haptic feedback and visual feedback

---

### User Story 6 - Simplified Studio Interface (Priority: P3)

Users want to edit their music in the studio without feeling overwhelmed by options. The current unified studio has many tabs and controls that can be confusing for casual users.

**Why this priority**: Studio is used by power users. Simplification helps reduce the learning curve for new users while maintaining power-user functionality.

**Independent Test**: Can be tested by opening a project in the studio and accessing key editing features (sections, mixer, actions) from a simplified interface.

**Acceptance Scenarios**:

1. **Given** a user opens a project in the studio, **When** the interface loads, **Then** they see a maximum of 4 primary editing tabs (Edit, Sections, Mixer, Export)
2. **Given** a user is in the studio, **When** they select a tab, **Then** the content appears smoothly with appropriate animations
3. **Given** a user wants to adjust mixing, **When** they open the Mixer tab, **Then** they see simplified controls (volume, mute/solo) for each stem
4. **Given** a user completes edits, **When** they export, **Then** the export options are presented clearly without overwhelming choices

---

### User Story 7 - Consistent Typography and Spacing (Priority: P3)

Users want the entire app to feel cohesive with consistent typography, spacing, and visual rhythm. The current app has some inconsistencies in font sizes, weights, and spacing across different screens.

**Why this priority**: Visual consistency builds trust and makes the app feel more polished and professional.

**Independent Test**: Can be tested by navigating through multiple screens and verifying consistent use of font sizes, line heights, and spacing.

**Acceptance Scenarios**:

1. **Given** a user navigates to any screen, **When** they view headings, **Then** all primary headings use the same font size (24px) and weight (600/700)
2. **Given** a user views any screen, **When** they look at spacing between elements, **Then** spacing follows a consistent 8px grid system (8, 16, 24, 32, 48px)
3. **Given** a user views text content, **When** they read body text, **Then** all body text uses the same font size (14-16px) and line height (1.5)
4. **Given** a user views different screens, **When** they compare layouts, **Then** all cards, buttons, and containers use consistent border radius (8-12px) and padding (12-16px)

---

### Edge Cases

- What happens when a user has a very long track title or artist name?
  - Text should truncate with ellipsis after 2 lines
- How does the system handle very small mobile screens (under 375px width)?
  - Layout should adapt with reduced padding and font scaling
- What happens when a user has no tracks in their library?
  - Show an empty state with a clear call-to-action to create music
- How does the system handle slow network conditions during generation?
  - Show loading states with skeleton screens and progress indicators
- What happens when a user's device doesn't support haptic feedback?
  - Visual feedback should still be provided for all interactions

## Requirements *(mandatory)*

### Functional Requirements

#### Home Screen
- **FR-001**: The home screen MUST display a maximum of 4 content sections above the fold
- **FR-002**: The home screen MUST prioritize the Quick Create section at the top
- **FR-003**: The home screen MUST provide a "Featured" section with maximum 6 tracks
- **FR-004**: The home screen MUST include a "Recent Plays" section that shows the last 5 played tracks
- **FR-005**: The home screen MUST use progressive loading for sections below the fold
- **FR-006**: The home screen MUST maintain consistent 16px vertical spacing between sections

#### Navigation
- **FR-007**: The bottom navigation MUST contain exactly 4 navigation items plus a central FAB
- **FR-008**: The navigation items MUST be: Home, Library, Projects, More
- **FR-009**: The FAB MUST use a gradient background with subtle glow effect
- **FR-010**: Navigation transitions MUST include smooth animations (200-300ms duration)
- **FR-011**: Active navigation state MUST be clearly indicated with icon color change
- **FR-012**: The navigation bar MUST use glassmorphism effect (backdrop blur)

#### Track Cards and Lists
- **FR-013**: Track cards MUST display only essential information: title, style, duration, play button
- **FR-014**: Track cards MUST use a consistent height of 72-80px in list view
- **FR-015**: Track cards MUST include a minimum 44px touch target for all interactive elements
- **FR-016**: Track cards MUST respond to touch with a subtle scale animation (0.98)
- **FR-017**: The library MUST use virtualization for lists with more than 50 items
- **FR-018**: Track cards MUST support swipe gestures for quick actions (like, delete)

#### Generation Form
- **FR-019**: The generation form MUST default to simple mode showing only prompt and style
- **FR-020**: Advanced options MUST be hidden behind a collapsible section
- **FR-021**: The form MUST provide real-time validation for required fields
- **FR-022**: The style selector MUST use a horizontal scrolling list with visual cards
- **FR-023**: The form MUST save draft input automatically with 30-minute expiry
- **FR-024**: Submit button MUST be disabled until valid input is provided

#### Player
- **FR-025**: The compact player MUST occupy 64-72px height at bottom of screen
- **FR-026**: Player transitions MUST use smooth, continuous animations
- **FR-027**: All player controls MUST provide haptic feedback on touch
- **FR-028**: The player MUST maintain playback state across all screen transitions
- **FR-029**: Fullscreen player MUST hide navigation bar for immersive experience
- **FR-030**: Player MUST display waveform visualization with progress indicator

#### Studio Interface
- **FR-031**: The studio MUST display maximum 4 primary editing tabs
- **FR-032**: Studio tabs MUST be: Edit, Sections, Mixer, Export
- **FR-033**: Each studio tab MUST use a bottom sheet for content on mobile
- **FR-034**: The mixer MUST simplify to volume fader + mute/solo per stem
- **FR-035**: The studio MUST provide undo/redo functionality
- **FR-036**: Export options MUST default to the most common format (MP3, 320kbps)

#### Visual Design System
- **FR-037**: All headings MUST use consistent font size (24px for H1, 20px for H2, 16px for H3)
- **FR-038**: All body text MUST use 14-16px font size with 1.5 line height
- **FR-039**: All spacing MUST follow 8px grid system (8, 16, 24, 32, 48px)
- **FR-040**: All cards MUST use consistent border radius of 8-12px
- **FR-041**: All buttons MUST use minimum 44px height for touch targets
- **FR-042**: All containers MUST use consistent padding of 12-16px
- **FR-043**: The app MUST maintain consistent color usage for features (purple for generate, blue for library, teal for projects)
- **FR-044**: All interactive elements MUST provide visual feedback on touch (scale, opacity, or color change)

#### Responsive Behavior
- **FR-045**: The app MUST adapt layout for screens smaller than 375px width
- **FR-046**: The app MUST maintain safe area insets for notched devices
- **FR-047**: The app MUST support landscape orientation with appropriate layout adjustments
- **FR-048**: Touch targets MUST remain minimum 44px regardless of screen size

#### Loading and Empty States
- **FR-049**: All loading states MUST use skeleton screens instead of spinners
- **FR-050**: Empty states MUST include an illustration, title, and call-to-action
- **FR-051**: Loading skeletons MUST use subtle shimmer animation
- **FR-052**: Error states MUST provide a clear message and retry action

### Key Entities

- **Track**: Represents a music track with attributes (title, style, duration, cover art, version information, stem availability)
- **Project**: Represents a music creation project with attributes (name, associated tracks, creation date, last modified)
- **Style Preset**: Represents a music generation style with attributes (name, description, category, example tracks)
- **User Session**: Represents user's current app state with attributes (recent plays, drafts, preferences)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate from home to any primary section within 3 seconds
- **SC-002**: Users can initiate music generation within 2 taps from the home screen
- **SC-003**: Users can find and play any track in their library within 5 seconds
- **SC-004**: 90% of users successfully complete the music generation flow on first attempt
- **SC-005**: The app loads the home screen and displays primary content within 2 seconds on standard mobile connection (4G)
- **SC-006**: User satisfaction score for visual design improves by 30% (measured via post-redesign survey)
- **SC-007**: Average time spent in the app per session increases by 20% (indicating better engagement)
- **SC-008**: Bounce rate from home screen decreases by 25% (indicating improved navigation clarity)
- **SC-009**: Support tickets related to navigation and UI confusion decrease by 40%
- **SC-010**: 95% of users can identify and use the primary Create action without assistance

## Assumptions

1. The app is primarily accessed via mobile devices (as indicated by "ориентацией на мобильые")
2. Users are familiar with standard mobile navigation patterns (bottom tabs, swipe gestures)
3. The app will continue to be a Telegram Mini App with associated platform constraints
4. The existing color scheme (purple for generate, blue for library, etc.) should be maintained for consistency
5. The current feature set should remain the same; this is a visual redesign, not a feature change
6. Users prefer simplicity over having all options visible at once
7. Progressive disclosure (showing advanced options on demand) is preferred over showing everything
8. Haptic feedback is expected on modern mobile devices
9. The app should work on a wide range of screen sizes (375px and above)
10. Dark mode will remain the default theme

## Dependencies

1. Existing component library (shadcn/ui) will be reused where possible
2. Current state management (Zustand stores) will be maintained
3. Telegram Mini App SDK integration will remain unchanged
4. Existing backend API endpoints will remain unchanged
5. Current routing structure will be preserved

## Out of Scope

The following items are explicitly out of scope for this redesign:

1. Changes to core functionality (music generation, playback, editing)
2. New feature additions (only redesigning existing features)
3. Desktop/tablet specific design changes (mobile-first focus)
3. Backend API changes
4. Database schema changes
5. Audio processing changes
6. Telegram bot integration changes
7. Performance optimizations beyond what's needed for the new UI
8. Accessibility audit and remediation (though new designs should be accessible)
