# Design System Quickstart Guide

**Feature**: 032-professional-ui
**Date**: 2026-01-06

## Step 1: Apply Typography Scale

Use Tailwind classes from typography scale:
- `text-3xl font-bold` for H1 page titles
- `text-2xl font-semibold` for H2 sections
- `text-xl font-semibold` for H3 card titles
- `text-base` for body text
- `text-sm` for standard text
- `text-xs` for captions

## Step 2: Use Color Palette

Apply semantic colors:
- `text-primary` / `bg-primary` for primary actions
- `text-secondary` / `bg-secondary` for accents
- `bg-gradient-primary` for gradients

## Step 3: Apply Spacing

Use spacing scale:
- `p-4` for standard card padding
- `gap-2` for element spacing
- `space-y-6` for vertical spacing

## Step 4: Add Animations

Use animation variants from @/lib/motion-variants:
```typescript
import { fadeIn, scaleIn } from "@/lib/motion-variants";
<motion.div variants={scaleIn} />
```

## Step 5: Verify Touch Targets

Ensure minimum 44x44px:
- `min-w-[44px] min-h-[44px]` for buttons
- `p-3` (12px padding) for icon buttons

## Testing Checklist

- [ ] Typography hierarchy visible
- [ ] Color contrast WCAG AA compliant
- [ ] Spacing consistent
- [ ] Animations smooth (60 FPS)
- [ ] Touch targets >=44px
- [ ] Safe areas respected

## Performance Validation

- Run `npm run size` - bundle <950KB
- Run Lighthouse - Performance >85
- Test on iPhone 12 / Pixel 5