# Z-Index Hierarchy Documentation

## Mobile Interface Z-Index Layering System

This document defines the z-index hierarchy used across the MusicVerse AI application to ensure proper stacking and visibility of UI elements, especially on mobile devices.

### Z-Index Layers

| Layer | Z-Index | Component Types | Examples |
|-------|---------|-----------------|----------|
| **Base Content** | z-10 | Regular page content, cards, lists | Track cards, content grids |
| **Sidebar/Background** | z-40 | Background UI elements | Sidebar, persistent navigation |
| **Navigation** | z-50 | Bottom navigation bar | `BottomNavigation` (island-nav), Base `Sheet` components |
| **Contextual Hints** | z-[70] | Smart hints, tooltips | `ContextualHint` component |
| **Dialogs/Sheets** | z-[80] | Modal dialogs, bottom sheets | Dialog overlays, Sheet modals |
| **Fullscreen Overlays** | z-[90] | Major fullscreen experiences | `MobileFullscreenPlayer`, `SectionEditorMobile` |
| **System Notifications** | z-[100] | Critical system messages | `GlobalGenerationIndicator`, `EnhancedGenerationIndicator`, `Toast`, `OnboardingOverlay`, Gamification overlays |
| **Dropdown Menus** | z-[9999]+ | Temporary floating menus | `DropdownMenuSubContent` |

### Implementation Details

#### Contextual Hints (z-[70])
- **File**: `src/components/hints/ContextualHint.tsx`
- **Purpose**: Display smart contextual tips that appear above navigation but below fullscreen overlays
- **Position**: Fixed, centered horizontally with `left-1/2 -translate-x-1/2`
- **Mobile Bottom Position**: `bottom-[6.5rem]` (accounts for island-nav height + safe area)
- **Desktop Bottom Position**: `md:bottom-24`
- **Width**: `w-[calc(100%-1.5rem)]` on mobile, `md:w-[calc(100%-2rem)]` on desktop

#### Mobile Fullscreen Player (z-[90])
- **File**: `src/components/player/MobileFullscreenPlayer.tsx`
- **Purpose**: Fullscreen music player experience
- **Position**: Fixed, covering entire viewport (`inset-0`)
- **Z-Index Rationale**: Must appear above hints and navigation, but below system notifications

#### Section Editor Mobile (z-[90])
- **File**: `src/components/stem-studio/mobile/SectionEditorMobile.tsx`
- **Purpose**: Fullscreen section editing interface
- **Position**: Fixed, covering entire viewport (`inset-0`)
- **Z-Index Rationale**: Major overlay, same level as fullscreen player

### Mobile Positioning Considerations

1. **Bottom Navigation Height**: Island navigation is approximately 4rem in height plus safe-area-inset-bottom
2. **Safe Areas**: All mobile positioning should account for `env(safe-area-inset-bottom)` on devices with notches/gesture bars
3. **Centering**: Use `left-1/2 -translate-x-1/2` for horizontal centering
4. **Width**: Use `calc(100% - [margin])` to ensure proper spacing from edges

### Historical Issues Fixed

**2025-12-14**: Fixed z-index conflicts where:
- `ContextualHint` was at z-[60], causing conflicts with `MobileFullscreenPlayer` (also z-[60])
- Hints could appear behind the bottom navigation (z-50)
- Solution: Moved `ContextualHint` to z-[70], moved fullscreen overlays to z-[90]

### Best Practices

1. **Avoid arbitrary z-index values**: Use the documented layers
2. **Test on mobile**: Always verify z-index changes on mobile viewports
3. **Consider touch targets**: Ensure interactive elements aren't obscured
4. **Document changes**: Update this file when adding new z-index values
5. **Use semantic layering**: Group related components at the same z-index level

### Related Files

- `src/components/hints/ContextualHint.tsx` - Contextual hints system
- `src/components/player/MobileFullscreenPlayer.tsx` - Fullscreen music player
- `src/components/stem-studio/mobile/SectionEditorMobile.tsx` - Section editor
- `src/components/BottomNavigation.tsx` - Mobile navigation bar
- `src/index.css` - Island navigation styles (`.island-nav`)

### References

- [Mobile UI Component Memory](/docs/mobile-ui-components.md)
- [Telegram Safe Areas](/docs/telegram-safe-areas.md)
