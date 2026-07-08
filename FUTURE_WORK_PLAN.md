# План дальнейших работ MusicVerse AI

**Дата:** 2026-07-09
**Статус:** Sprint 057 ✅, CI green, tsc 0 errors, 1489 unit tests, E2E stable. Следующий review: 2026-07-13.
**Фокус:** i18n → Bundle optimization → API/Service unit tests → Design polish

---

## 🎯 Текущее состояние (верифицировано 2026-07-09)

| Метрика             | Значение                                  | Статус |
| ------------------- | ----------------------------------------- | ------ |
| Unit tests          | 1489 passing (122 files)                  | ✅     |
| TypeScript          | 0 errors                                  | ✅     |
| E2E specs           | 56 (CI green — Sprint 057)                | ✅     |
| Components          | 1161                                      | ✅     |
| Hooks               | 434                                       | ✅     |
| API files           | 30                                        | ✅     |
| Services            | 37 *.service.ts (12 top + 25 в subfolder) | ✅     |
| Stores              | 24                                        | ✅     |
| Suno edge functions | 46 (28/28 API — 100%)                     | ✅     |
| Files >800 LOC src/ | 0                                         | ✅     |
| `any` budget        | 0/50                                      | ✅     |
| Bundle eager JS     | ~508 KB gzip                              | ✅     |
| Total bundle        | 2.11 MB gzip                              | 🟡     |
| Branch Protection   | Phase 2 active (ruleset 18581121)         | ✅     |
| Design Score        | C+ (AI Slop: B)                           | 🟡     |

### ✅ Завершённые спринты

- **Sprint 051** — Test Debt: god-file decomposition 9/9, 1497 unit tests
- **Sprint 053** — Suno Sounds + MIDI Direct + Boost Style
- **Sprint 054** — Suno Details Suite (28/28 Suno API — 100%)
- **Sprint 055** — UX Critical Fixes (P0/P1 — 13/13)
- **Sprint 056** — GenerateSheet Redesign + Storybook (31 story)
- **Sprint 057** ✅ — E2E CI Green + Branch Protection (9Router cleanup, E2E stab, BP Phase 2)

---

## 📋 Sprint Backlog (июль–август 2026)

### Sprint 058 — i18n EN/RU Localization

**Задача:** Международный запуск требует английского перевода. Все UI-строки сейчас на русском.

- [ ] Установить `react-i18next` + `i18next-browser-languagedetector`
- [ ] Создать `src/i18n/locales/{en,ru}.json`
- [ ] Мигрировать `MASHUP_STRINGS` (пilot domain) → `t('mashup.*')`
- [ ] Переключатель языка в настройках профиля
- [ ] RU — primary (текущие строки), EN — перевод
- [ ] Мигрировать 2-й домен (studio или generation)
- [ ] Persist preference в `profiles.locale`

**Срок:** 5-7 дней
**Метрика:** 2 домена (mashup + generation) на 2 языках
**Риски:** Тонна строк (~800+), извлечение через codemod или grep-regex. Стратегия: namespace по домену, lazy-load namespaces.

---

### Sprint 059 — Bundle Optimization + API/Service unit tests

**Часть A — Bundle optimization:**

**Текущее:** 508 KB eager JS, 2.11 MB total. Цель: ≤1.8 MB total.

- [ ] `npm run size:why` — выявить oversized chunks
- [ ] Пересмотреть границы `manualChunks` в `vite.config.ts`
- [ ] Устранить barrel re-export циклы (check "Circular chunk" warnings)
- [ ] Tree-shaking для неиспользуемых экспортов
- [ ] Lazy-load admin/studio/charts/dnd/forms (если ещё не)
- [ ] Аудит framer-motion импортов — все через `@/lib/motion`

**Часть B — API/Service unit tests:**

**Текущее:** 1489 unit tests. Цель: 1800+.

- [ ] `src/api/*.api.ts` (30 файлов) — по 3-5 тестов (mocked Supabase client)
- [ ] `src/services/*.service.ts` (37 файлов) — по 5-8 тестов
- [ ] TanStack Query mutations: useSunoMashup, useSunoPersona, useSunoFileUpload
- [ ] Edge functions декомпозиция (11 файлов >800 LOC в `supabase/functions/`)

**Срок:** 7-10 дней
**Метрика:** 1800+ unit tests, total bundle ≤1.8 MB

---

### Sprint 060 — Design Polish

**5 quick wins применены (2026-07-06):** color-scheme: dark, font consolidation, H2→H3.

- [ ] **Search box на главной** (high impact — music app needs search) — 1-2 дня
- [ ] **Skeleton loading states** (medium — content pops in) — 1 день
- [ ] **Route transition animation** (polish — SPA feels static) — 1 день
- [ ] **Border-radius hierarchy** (3 tiers: sm/md/lg) — 0.5 дня
- [ ] **Nav simplification** (group 10 tabs into primary/secondary) — 1 день

**Срок:** 5-7 дней
**Метрика:** Design score C+ → B+

---

### Backlog (после Sprint 060)

- **Edge Functions декомпозиция** — 11 файлов >800 LOC (telegram-bot 1871, suno-callback-handler ~1200, …). Изолированная задача, не блокирует другие.
- **Storybook Story покрытие** — 31 story, цель 50+
- **Лицензионный compliance** — `reuse-licenses.yml` workflow на русский текст
- **Translation pipeline** — CI для auto-перевода через какой-нибудь API
- **Performance budgets** — bundle-size, lighthouse, Core Web Vitals в CI
- **Sentry fixes** — 6 уязвимостей (1 high, 4 moderate, 1 low) — security review

---

## 📅 Timeline (июль–август 2026)

```
Week 1 (July 9-13):
  Mon-Tue:  Sprint 058 setup (react-i18next install, locales structure)
  Wed-Fri:  Pilot domain migration (MASHUP_STRINGS → t('mashup.*'))

Week 2 (July 14-20):
  Mon-Wed:  Sprint 058 completion (2nd domain, language switcher)
  Thu-Fri:  Sprint 059 part A — bundle analysis, size:why

Week 3 (July 21-27):
  Mon-Fri:  Sprint 059 part B — API/Service unit tests, edge function decomp

Week 4 (July 28 - Aug 3):
  Mon-Fri:  Sprint 060 — design polish (search, skeleton, transitions)

Week 5 (Aug 4-8):
  Backlog: Edge functions декомпозиция, Storybook coverage
```

---

## 🚀 Q3 2026 (после стабилизации)

| Sprint  | Фокус                                         | Статус       |
| ------- | --------------------------------------------- | ------------ |
| **057** | E2E CI green + Branch Protection complete     | ✅ ЗАВЕРШЁН  |
| **058** | i18n EN/RU (mashup + generation домены)       | 📋 Следующий |
| **059** | Bundle optimization + API/Service unit tests  | 📋 Planned   |
| **060** | Design polish (search, skeleton, transitions) | 📋 Planned   |

---

## 🔄 Ритуалы

- **Каждый PR:** tsc + lint + unit tests + size-limit
- **Еженедельно:** E2E smoke на main, bundle re-measure
- **При закрытии спринта:** обновить PROJECT_STATUS.md, CHANGELOG.md, CLAUDE.md, README.md
- **Каждые 2 недели:** Design review session, bundle re-measure, security audit

---

## 📝 Notes

- **Suno API 28/28 (100%)** — все категории реализованы, 46 edge functions
- **God-file decomposition завершена** — 0 файлов >800 LOC в `src/`
- **Design-review C+** — функциональный, не хватает search + motion polish
- **Branch protection Phase 2** — required checks active, force-push заблокирован
- **9Router fully removed** — Sprint 057 (использовался только как Claude skill, не код)
- **Collaboration features** — out of scope per user decision 2026-07-08

---

**Последнее обновление:** 2026-07-09 (Sprint 057 ✅)
**Следующий review:** 2026-07-13
</content>
</invoke>
