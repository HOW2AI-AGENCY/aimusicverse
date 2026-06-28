# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Coding Rules (Will Fail Build or Lint)

- **Import wrappers (ERROR)**: `framer-motion` → `@/lib/motion`, `lucide-react` → `@/lib/icons`
- **No direct `supabase.from()`** in components — enforced via ESLint `no-restricted-syntax` rule
- **Custom ESLint plugin**: `./eslint-rules/section-tokens.js` with rule `section-tokens/no-saturated-brand`
- **Build chain**: `npm run check:design-tokens` runs before `vite build`
- **Mobile-first tokens**: No arbitrary px in className for spacing/padding/margin/gap or font-size/leading (exception: 1-2px hairline borders)
- **Console limited**: only `warn`/`error`, only in `src/lib/logger.ts`, `src/lib/sentry.ts`, `src/lib/debug/**`, `src/lib/icons.ts`, `src/lib/motion.ts`
- **Lazy loading tiers**: critical pages use `lazyWithRetry` from `@/lib/performance`; admin/heavy pages use `/* webpackChunkName: "..." */` naming
- **Single test**: `npx vitest run <path>` or `npm test -- <path>`
- **Full check**: `npm run check-all` (lint + format:check + typecheck + test)
- **size-limit**: 950KB total gzip across 11 chunks
