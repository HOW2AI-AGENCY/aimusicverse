# Z-Index Hierarchy Documentation

## Mobile Interface Z-Index Layering System

This document defines the z-index hierarchy used across the MusicVerse AI application to ensure proper stacking and visibility of UI elements, especially on mobile devices.

**Last Audit**: 2026-01-31

### Z-Index Layers (Updated 2026-01-31)

| Layer | Z-Index | Tailwind Class | Component Types | Examples |
|-------|---------|----------------|-----------------|----------|
| **Base Content** | 0 | `z-base` | Regular page content | Page backgrounds |
| **Raised Content** | 10 | `z-raised` | Cards, panels | Track cards, content cards |
| **Sticky Elements** | 20 | `z-sticky` | Headers, footers | `PageHeader`, sticky headers |
| **Floating** | 30 | `z-floating` | Small overlays | Floating buttons |
| **Overlay** | 40 | `z-overlay` | Backdrops | Sidebar backdrop |
| **Navigation** | 50 | `z-navigation` | Bottom nav, sidebar | `BottomNavigation`, `Sidebar` |
| **Player** | 60-61 | `z-player` | Music player | `CompactPlayer`, `ExpandedPlayer` |
| **Contextual Hints** | 70 | `z-contextual` | Smart hints | `ContextualHint` |
| **Fullscreen Overlays** | 90 | `z-fullscreen` | Major fullscreen UIs | `MobileFullscreenPlayer` |
| **Dialogs** | 140 | `z-dialog` | Modal dialogs | `Dialog`, `AlertDialog` |
| **Sheets** | 150-151 | `z-sheet-*` | Bottom sheets | `Sheet`, `Drawer`, `MobileBottomSheet` |
| **Dropdowns/Popovers** | 200 | `z-dropdown` | Floating menus | `DropdownMenu`, `PopoverContent` |
| **Tooltips** | 250 | `z-tooltip` | Tooltips | `TooltipContent` |
| **Toasts/System** | 300 | `z-toast` | Notifications | `Sonner`, system alerts |
| **Context Menu/Select** | 9999 | `z-max` | Context menus | `ContextMenuContent`, `SelectContent` |

### Implementation Details

#### Tailwind Config (tailwind.config.ts)

All z-index values are defined as semantic tokens:

```typescript
zIndex: {
  'base': '0',
  'raised': '10',
  'sticky': '20',
  'floating': '30',
  'overlay': '40',
  'navigation': '50',
  'player': '60',
  'contextual': '70',
  'fullscreen': '90',
  'dialog': '140',
  'sheet-backdrop': '150',
  'sheet-content': '151',
  'dropdown': '200',
  'popover': '200',
  'tooltip': '250',
  'toast': '300',
  'notification': '300',
  'max': '9999',
}
```

#### Constants File (src/constants/z-index.ts)

Use `Z_INDEX` object for programmatic access in JavaScript/TypeScript:

```typescript
import { Z_INDEX } from '@/constants/z-index';

// Usage
<div style={{ zIndex: Z_INDEX.player }}>...</div>
```

### Component-Specific Details

#### Navigation (z-50)
- **File**: `src/components/BottomNavigation.tsx`
- **Class**: `z-navigation` or `z-50`
- **Notes**: Island-style floating nav with blur backdrop

#### Compact Player (z-60)
- **File**: `src/components/player/CompactPlayer.tsx`
- **Class**: `z-player`
- **Notes**: Fixed bottom, above navigation

#### Contextual Hints (z-70)
- **File**: `src/components/hints/ContextualHint.tsx`
- **Class**: `z-[70]`
- **Notes**: Above player, below fullscreen

#### Fullscreen Player (z-90)
- **File**: `src/components/player/MobileFullscreenPlayer.tsx`
- **Class**: `z-fullscreen`
- **Notes**: Covers entire viewport

#### Sheets (z-150/151)
- **Files**: `src/components/ui/sheet.tsx`, `src/components/mobile/MobileBottomSheet.tsx`
- **Backdrop**: `z-[150]`
- **Content**: `z-[151]`
- **Notes**: Above fullscreen but below dropdowns

#### Dropdowns/Popovers (z-200)
- **Files**: `src/components/ui/dropdown-menu.tsx`, `src/components/ui/popover.tsx`
- **Class**: `z-dropdown` or `z-[200]`
- **Notes**: Must appear above all content including sheets

#### Context Menu (z-9999)
- **File**: `src/components/ui/context-menu.tsx`
- **Class**: `z-[9999]`
- **Notes**: Legacy high z-index for guaranteed visibility

#### Toasts (z-300)
- **File**: `src/components/ui/sonner.tsx`
- **Class**: `z-toast` or `z-[300]`
- **Notes**: System-level notifications

### Mobile Positioning Considerations

1. **Bottom Navigation Height**: Island navigation is ~4rem + safe-area-inset-bottom
2. **Safe Areas**: Use CSS variables for Telegram Mini App:
   - `var(--tg-safe-area-inset-bottom)`
   - `var(--tg-safe-area-inset-top)`
   - `env(safe-area-inset-bottom)` as fallback
3. **Centering**: Use `left-0 right-0 mx-auto` for horizontal centering
4. **Width**: Use `calc(100% - [margin])` for edge spacing

### Best Practices

1. **Use semantic Tailwind classes**: Prefer `z-player` over `z-60`
2. **Import constants for JS**: Use `Z_INDEX.player` for programmatic values
3. **Test on mobile**: Verify z-index changes on actual devices
4. **Document changes**: Update this file when adding new z-index levels
5. **Avoid arbitrary values**: Don't use random numbers like `z-[123]`

### Related Files

- `tailwind.config.ts` - Tailwind z-index tokens
- `src/constants/z-index.ts` - JS constants for z-index
- `src/components/BottomNavigation.tsx` - Mobile navigation
- `src/components/player/CompactPlayer.tsx` - Compact player
- `src/components/player/MobileFullscreenPlayer.tsx` - Fullscreen player
- `src/components/ui/sheet.tsx` - Sheet component
- `src/components/mobile/MobileBottomSheet.tsx` - Mobile bottom sheet
- `src/components/ui/dropdown-menu.tsx` - Dropdown menus
- `src/components/ui/sonner.tsx` - Toast notifications
- `src/index.css` - CSS utilities and island-nav styles
