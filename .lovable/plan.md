# План оптимизации и улучшения MusicVerse AI

На основе аудита: 40+ страниц, 890+ компонентов, 200+ хуков, 80+ Edge Functions, Sprint 030 (98/100). Ниже — приоритизированный план работ.

---

## ЭТАП 1. Производительность и бандл (P0, 1–2 недели)

**Цель:** удержать бандл ≤ 950 KB, поднять LCP/INP на мобильных.

- Анализ `npm run size:why`, выделить топ-10 тяжёлых чанков.
- Перевести оставшиеся `framer-motion` импорты на `@/lib/motion`; запретить прямой импорт через ESLint-правило.
- Lazy-load для тяжёлых страниц: `studio-v2`, `LyricsStudio`, `GuitarStudio`, `Analytics`, `AdminDashboard`.
- Виртуализация всех списков > 50 элементов (`Library`, `Playlists`, `Community`, `Artists`) через `react-virtuoso`.
- Заменить `<img>` на `LazyImage` везде (audit-скрипт).
- Удалить `Index.tsx.backup` и прочие мёртвые файлы.
- Добавить preconnect/preload для критичных доменов (Supabase, CDN обложек).

**Метрики приёмки:** bundle ≤ 900 KB, LCP < 2.5s на 4G, INP < 200ms.

---

## ЭТАП 2. Аудио-система и плеер (P0, 1 неделя)

**Цель:** убрать iOS-краши и рассинхрон версий A/B.

- Аудит всех `new Audio()` в коде — оставить только `GlobalAudioProvider` + `audioElementPool`.
- Гарантировать cleanup (`pause()` + `src=''`) при unmount компонентов с превью.
- Атомарное переключение версий: транзакция `is_primary` + `active_version_id` через RPC.
- Кеш waveform в IndexedDB по `trackId` (проверить попадания).
- Тесты: Playwright-сценарии play/pause/switch/seek на Mobile Safari.

---

## ЭТАП 3. Мобильная UX и Telegram (P1, 1–2 недели)

- Унификация safe-area: `--tg-content-safe-area-inset-*` + `env(safe-area-inset-*)` через util-класс.
- Заменить оставшиеся `<Dialog>` на `MobileBottomSheet` (vaul) на мобильных.
- Touch targets ≥ 44×44 (axe + ручной чек на главных экранах).
- Haptic feedback на ключевых действиях (play, like, generate, switch version).
- Back Button и Main Button proxy hooks применить во всех вложенных экранах.
- E2E на ширинах 360/390/414/640/768 px для главной, библиотеки, студии, плеера.

---

## ЭТАП 4. Архитектура и качество кода (P1, 2 недели)

- Разбить «крупные» сторы/компоненты > 500 строк: `useUnifiedStudioStore` (38KB) → domain slices (playback, mixer, sections, stems).
- Заменить оставшиеся `console.*` на `logger` (ESLint-правило `no-console`).
- Привести API↔Service↔Hook слои к единому шаблону; удалить дубли (`useTracks` vs прямые запросы).
- Удалить дублирующие version-селекторы — оставить только `UnifiedVersionSelector`.
- Включить `strict` + `noUncheckedIndexedAccess` в `tsconfig`, починить ошибки.
- Покрытие unit-тестами критичных хуков (player, versioning, credits) до 70%.

---

## ЭТАП 5. Backend, безопасность, наблюдаемость (P1, 1 неделя)

- Линтер БД: `supabase linter` + фикс warning'ов.
- Аудит RLS на новых таблицах; e2e-тест «чужой пользователь не видит чужое».
- Привести все Edge Functions к общему скелету `_shared/auth.ts` + структурированному логу.
- Sentry: проверить sourcemaps, добавить release health, алерты по ошибкам плеера и генерации.
- Архивирование `api_usage_logs` / `error_logs` старше 30 дней (cron).

---

## ЭТАП 6. Доступность и SEO (P2, 3–5 дней)

- WCAG AA: focus-visible ring везде, контрасты, aria-label у иконочных кнопок.
- Семантика: один H1 на страницу, корректные landmark'и.
- SEO: meta description, OG/Twitter, JSON-LD (MusicGroup/MusicRecording) для публичных страниц трека и артиста.
- Canonical + sitemap.xml для публичных маршрутов.

---

## ЭТАП 7. Документация и DX (P2, постоянно)

- Обновить `KNOWLEDGE_BASE.md`, `PROJECT_STATUS.md`, `docs/PLAYER_ARCHITECTURE.md`.
- Storybook для базовых UI + плеера + версии-селектора.
- CI gate: `npm run lint && size && test && test:e2e:mobile` обязательны.

---

## Порядок выполнения

```text
Неделя 1: ЭТАП 1 + ЭТАП 2 (perf + audio)
Неделя 2: ЭТАП 3 (mobile/Telegram UX)
Неделя 3: ЭТАП 4 (refactor + types)
Неделя 4: ЭТАП 5 + ЭТАП 6 (backend/sec + a11y/seo)
Параллельно: ЭТАП 7
```

После твоего «ок» начну с ЭТАПА 1 (perf-аудит и lazy-loading) — или скажи, с какого этапа стартовать.
