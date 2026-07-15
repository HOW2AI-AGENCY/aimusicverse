# Sprint 063: Accessibility + Polish (Q3 2026)

**Дата плана:** 2026-07-13
**Зависимость:** Sprint 062 ✅

---

## P0 — Accessibility

| #    | Задача                             | Файл              | Оценка  |
| ---- | ---------------------------------- | ----------------- | ------- |
| P0-1 | text-tertiary contrast — WCAG AA   | tailwind/theme    | ~20 мин |
| P0-2 | PrivacyToggle touch target ≥44px   | PrivacyToggle.tsx | ~15 мин |
| P0-3 | WCAG compliance — focus indicators | components/ui     | ~1 ч    |
| P0-4 | Accessibility audit — ARIA labels  | key components    | ~2 ч    |

## P1 — Polish

| #    | Задача                  | Файл           | Оценка  |
| ---- | ----------------------- | -------------- | ------- |
| P1-1 | Color consistency audit | tailwind/theme | ~30 мин |
| P1-2 | Spacing consistency     | design tokens  | ~30 мин |

## P2 — Documentation

| #    | Задача                    | Оценка  |
| ---- | ------------------------- | ------- |
| P2-1 | Update accessibility docs | ~20 мин |

---

## Phase A: P0 Accessibility

### A-1: Text tertiary contrast

**Что:** Проверить `--text-tertiary` соответствует WCAG AA (4.5:1 для normal text).

### A-2: PrivacyToggle touch target

**Файл:** `src/components/generate-form/sections/PrivacyToggle.tsx`
**Что:** button/toggle ≥44px.

### A-3: Focus indicators

**Что:** Все interactive elements имеют visible focus states.

### A-4: ARIA audit

**Что:** Проверить key components на наличие aria-labels, roles.

---

## Verification

1. `npm run build` — 0 errors
2. `npm run test -- --run` — all passing
3. Lighthouse accessibility score ≥90

---

## DoD

- [ ] P0 accessibility issues fixed
- [ ] Touch targets ≥44px
- [ ] Focus indicators visible
- [ ] ARIA labels present
