<div align="center">

# 📝 Журнал изменений

**Все значимые изменения в MusicVerse AI документируются в этом файле.**

Формат основан на [Keep a Changelog 1.1.0](https://keepachangelog.com/ru/1.1.0/) и проект следует [Семантическому версионированию](https://semver.org/lang/ru/).

<p>
  <img alt="Формат" src="https://img.shields.io/badge/Keep_a_Changelog-1.1-9333EA?style=for-the-badge"/>
  <img alt="SemVer" src="https://img.shields.io/badge/SemVer-2.0-26A5E4?style=for-the-badge"/>
</p>

<p>
  <a href="README.md">🏠 Главная</a> ·
  <a href="DOCUMENTATION_INDEX.md">📚 Документация</a> ·
  <a href="ROADMAP.md">🗺 Дорожная карта</a> ·
  <a href="PROJECT_STATUS.md">📊 Статус</a>
</p>

</div>

---

## [Unreleased]

### 🔧 Спринт 037 — Infrastructure Hardening & Developer Experience (2026-06-29)

#### Добавлено

- **21 unit-тест AudioElementPool** — singleton, acquire/release, priority eviction, статистика, releaseAll
- **4 Storybook stories** — LazyImage, EmptyState, Button, LoadingSpinner с autodocs
- **tsconfig.strict.json** — инкрементальная миграция на строгий TypeScript (noUnusedLocals, noUnusedParameters, strictNullChecks, и др.)
- **docs/FSM_STATE_SCHEMA.md** — документация всех 4 state machines (Modal, Player, Generation, AudioContext)

#### Исправлено

- **TDZ краш админ-панели** (`Cannot access 'ft'/'ht' before initialization`) — устранена циклическая зависимость barrel export + слияние 8 взаимозависимых чанков в `feature-admin-studio` в `vite.config.ts`. Импорт `useGenerateForm` теперь прямой из модуля-источника.
- Добавлены правила 10-11 в Common Pitfalls CLAUDE.md для предотвращения повторения

#### Изменено

- `vite.config.ts` manualChunks: слияние page-admin, feature-generation-form, feature-stem-studio, feature-lyrics-wizard, feature-studio, feature-studio-unified, store-studio, page-lyrics-studio → единый `feature-admin-studio`
- `src/components/library/DesktopLibrarySidebar.tsx`: прямой импорт `useGenerateForm` из `@/hooks/generation/useGenerateForm`
- SPRINTS/SPRINT-PROGRESS.md: Sprint 037 → ✅ COMPLETE, обновлены метрики
- CLAUDE.md: обновлены дата, метрики, 2 новых правила для предотвращения barrel-циклов

### 📚 Спринт 035 — Редизайн документации репозитория

#### Добавлено

- **Новый README.md** — профессиональная витрина с шилдсами, скриншотами, прогрессом, секцией для инвесторов.
- **Ролевая навигация в DOCUMENTATION_INDEX.md** — пути для разработчика, дизайнера, инвестора, клиента, контрибьютора.
- **Единый стиль футеров** — навигация «← Предыдущий · ↑ Индекс · Следующий →» во всех корневых .md файлах.
- **Скриншоты приложения** — 4 скриншота (главная, плеер, студия, библиотека) в `public/screenshots/`.
- **Playwright скрипт** — автоматическая генерация скриншотов `scripts/capture-screenshots.ts`.
- **Обновлён PROJECT_STATUS.md** — завершение 033-mobile-ui-improvements (114/114), новый спринт 035.

#### Изменено

- **KNOWLEDGE_BASE.md** — удалён (733 строки), информация перенесена в целевые документы.
- **MAINTENANCE.md** — полностью актуализирован, добавлены чек-листы.
- **ROADMAP.md** — добавлен спринт 035.
- **REPOSITORY_STRUCTURE.md** — обновлён с `public/screenshots/`.

### ✨ Спринт 034 — Надёжность генерации

#### Добавлено

- **Dashboard метрик генерации** — `/admin/generation-metrics` с визуализацией failure rate, retry count, параметров генерации.
- **Auto-retry в handleGenerate()** — 2 попытки с exponential backoff, интегрировано в основной flow генерации.
- **Structured failure tracking** — категории ошибок (`failure_category`), счётчик ретраев (`retry_count`), параметры генерации (`generation_params`).
- **Prompt pre-validation** — проверка длины, кодировки и запрещённого контента перед отправкой в Suno API.
- **A/B framework** — эксперименты `PROMPT_SUGGESTIONS` и `WIZARD_STEPS` (50/50 split), хук `useExperiment`.
- **Generation queue position UI** — отображение позиции в очереди с учётом rate-limit.
- **Failure pattern analysis RPC** — `get_generation_failure_patterns` для серверного анализа паттернов ошибок.
- **Failure rate alerts** — Edge Function + уведомления в Telegram для админов при превышении порога.
- **A/B тест 2-step vs 4-step wizard** — эксперимент `WIZARD_STEPS` для оптимизации конверсии.
- **Delivery tracking** — статус `partial_delivery`, хук `useDeliveryTracking` для отслеживания доставки A/B клипов.
- **Sentry breadcrumbs** — полный flow генерации покрыт breadcrumbs для диагностики.

#### Исправлено

- TDZ-ошибка в analytics chunk из-за циклической зависимости lucide-react.
- Централизация экспортов lucide-react для оптимизации бандла.
- Конфликт в lyricspanel.tsx после merge.

### 🔧 Инфраструктура

- Миграция тестов с Jest на Vitest + Husky pre-commit hooks.
- Удаление мёртвого кода (chore/remove-dead-code).
- Автоматическое обновление version badges в README.

---

### ✨ Спринт 033 — Аудит интерфейса и UX-переработка

#### Добавлено

- **Режим Studio Lite/Pro** — переключатель в StudioShellHeader для скрытия продвинутых функций (стемы, MIDI, аранжировка) от начинающих. Сохраняется в localStorage через ViewStore.
- **Комментарии с таймкодами** — комментарии с привязкой к времени воспроизведения (как в SoundCloud). Бейджи с таймкодами отображаются инлайново в CommentItem.
- **Анимация взрыва при лайке** — 6 частиц разлетаются радиально при нажатии лайка в QuickLikeButton.
- **Пульсирующее кольцо pull-to-refresh** — индикатор пульсации при достижении порога pull-to-refresh.
- **Троттлинг монетизации** — UpsellStrategy ограничивает проактивные баннеры до 1 за сессию и пейволлы до 5-минутного кулдауна. Интегрировано в ProactiveUpsellBanner и SmartPaywallDialog.

#### Изменено

- **Визард генерации 6→4 шага** — объединены Стиль+Настройки в StyleSettingsStep, Вокал+Тексты в VocalsLyricsStep. Новый тип `WizardStep` в сторе.
- **Dialog → BottomSheet на мобильных** — значение `mobileSheet` по умолчанию изменено с `false` на `true` в DialogContent. Все 56+ диалогов автоматически рендерятся как vaul Drawer на мобильных (<640px).
- **Инлайн-фильтры библиотеки** — удалён LibraryFilterModal на мобильных, заменён на инлайн-выпадающий список сортировки в CompactFilterBar.
- **BottomNavigation** — иконки увеличены до 20px, подписи до 11px для лучшей читаемости.
- **Упрощённый онбординг** — удалена 10-шаговая страница Onboarding, QuickStartOverlay (3 шага) обрабатывает онбординг. Маршрут перенаправляет на `/`.

#### Исправлено

- Области касания < 44px в QuickLikeButton, PaymentButton, LyricsVisualEditor, AudioActionDialog, SmartPromptSuggestions.
- Добавлены ARIA-метки в компоненты навигации (MenuSearch, QuickActionsBar, MoreMenuSheet).
- `console.log` заменён на `logger` в SortableTrackList.
- Конфиг commitlint переименован в `.cjs` для совместимости с ESM, разрешён конфликт правил header-case и subject-case.

### 📚 Документация

- **Редизайн документации репозитория** — унифицированные шаблоны хедеров/футеров/бейджей, mermaid-диаграммы, карта онбординга по ролям в `DOCUMENTATION_INDEX`.
- Архивированы 9 дублирующих документов в `docs/archive/2026-06-27/`.
- Новый отчёт аудита: `docs/_audit/REPO_DOCS_AUDIT_2026-06-27.md`.

### ✅ Добавлено

- Защита dev-overlay от IME, принудительная видимость, E2E покрытие ориентации.
- CI разделён на задачи `e2e` + `e2e-mobile` с повторами.

### 🛠 Изменено

- `SmartAlertProvider` больше не открывает автоматически модалку «Стемы готовы».

---

## [1.30.0] — 2026-06-15 — _Спринт 030: Unified Studio Mobile_

### Добавлено

- Мобильный DAW-стиль в едином окне.
- Стемы-панель с паритетом микшера.
- UX перегенерации секций на мобильных.

### Исправлено

- z-index для порталированных диалогов поверх фиксированных оверлеев.
- Тапы на модалке формы генерации на мобильных.

## [1.29.0] — 2026-05-22

### Добавлено

- Студия клонирования голоса (6-шаговый процесс).
- Эндпоинты Suno `upload-extend` и `upload-cover`.

### Производительность

- Бандл: 1.02 МБ → 918 КБ.

## [1.28.0] — 2026-04-10

### Добавлено

- Разделение стемов (4 стема) с полным микшером.
- MIDI-транскрипция (6 ИИ-моделей).

### Безопасность

- Паттерн `has_role()` security-definer для админских маршрутов.

## [1.27.0] — 2026-03-04

### Добавлено

- A/B версионирование треков (`is_primary` + `active_version_id`).
- Оптимистичный UI для лайков/прослушиваний/переключения версий.

## [1.26.0] — 2026-02-08

### Добавлено

- Оплата через Telegram Stars + тарифные подписки.
- Геймификация: серии, XP, 20+ достижений.

## [1.25.0] — 2026-01-12

### Добавлено

- Первый релиз Telegram Mini App на продакшн-домене.

---

> [!TIP]
> Детали по спринтам см. в [`SPRINTS/`](SPRINTS/). Историю по фичам — в соответствующих документах [`docs/`](docs/).

---

<div align="center">

### 🔗 Связанная документация

|            📚 Указатель             |      🗺 Дорожная карта       |          📊 Статус          |             🪲 Проблемы             |         🤝 Контрибуция         |
| :---------------------------------: | :--------------------------: | :-------------------------: | :---------------------------------: | :----------------------------: |
| [Указатель](DOCUMENTATION_INDEX.md) | [Дорожная карта](ROADMAP.md) | [Статус](PROJECT_STATUS.md) | [Проблемы](KNOWN_ISSUES_TRACKED.md) | [Контрибуция](CONTRIBUTING.md) |

<sub>Последнее обновление: 2026-06-29</sub>

</div>
