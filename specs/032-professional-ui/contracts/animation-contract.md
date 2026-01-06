# Animation Contract

**Feature**: 032-professional-ui

## Variant API

```typescript
// Available variants from @/lib/motion-variants
export const variants = {
  fadeIn: { initial, animate, exit },
  slideUp: { initial, animate, exit },
  scaleIn: { initial, animate, exit }
};
```

## Usage

```typescript
import { motion } from "@/lib/motion";
import { scaleIn } from "@/lib/motion-variants";

<motion.div
  variants={scaleIn}
  initial="initial"
  animate="animate"
  exit="exit"
/>
```

## Timing

- Fast: 150ms (micro-interactions)
- Standard: 200ms (modals, sheets)
- Slow: 300ms (page transitions)

## Reduced Motion

All animations respect prefers-reduced-motion.