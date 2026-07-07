# Расширенный план работ — 07.07.2026

## Статус

| Фаза    | Задачи             | Статус         |
| ------- | ------------------ | -------------- |
| Phase 1 | CI Stabilization   | ✅ Complete    |
| Phase 2 | Sprint 050 Closure | ✅ Complete    |
| Phase 3 | Test Coverage      | ✅ 1525 tests  |
| Phase 4 | Infrastructure     | 🔄 In Progress |
| Phase 5 | Quality Polish     | 📋 Planned     |

---

## Phase 4: Infrastructure (текущая)

### 4.1 i18n EN/RU Pilot (3 дня)

**Задача:** Локализация mashup domain на EN/RU

| #    | Подзадача                                   | Оценка  | Скилл/Плагин   |
| ---- | ------------------------------------------- | ------- | -------------- |
| I4.1 | Создать src/i18n/locales/{en,ru}.json       | 0.5 дня | —              |
| I4.2 | Мигрировать MASHUP_STRINGS на t('mashup.*') | 1 день  | —              |
| I4.3 | Переключатель языка в настройках            | 0.5 дня | —              |
| I4.4 | Тестирование EN/RU                          | 0.5 дня | playwright-pro |

**Сабагент:** `explore` — поиск всех хардкодных строк в mashup компонентах

### 4.2 9Router Deep Integration (2-3 дня)

**Задача:** Интеграция 9Router в AI-ассистент

| #    | Подзадача                                             | Оценка  | Скилл/Плагин |
| ---- | ----------------------------------------------------- | ------- | ------------ |
| I5.1 | Заменить Supabase edge function на 9Router для lyrics | 1 день  | —            |
| I5.2 | Добавить генерацию обложек через 9Router image        | 0.5 дня | —            |
| I5.3 | A/B тестирование моделей (MIMO vs Claude vs Gemini)   | 1 день  | ab-testing   |
| I5.4 | Кэширование AI-ответов (Redis/LRU)                    | 0.5 дня | —            |

**Сабагент:** `general` — реализация интеграции

---

## Phase 5: Quality Polish (5-7 дней)

### 5.1 Service Worker + оффлайн (3 дня)

| #    | Подзадача                         | Оценка | Скилл/Плагин |
| ---- | --------------------------------- | ------ | ------------ |
| Q1.1 | Настроить Workbox для кэширования | 1 день | —            |
| Q1.2 | Оффлайн-режим для библиотеки      | 1 день | —            |
| Q1.3 | Sync при восстановлении сети      | 1 день | —            |

### 5.2 Export Service (3 дня)

| #    | Подзадача           | Оценка | Скилл/Плагин |
| ---- | ------------------- | ------ | ------------ |
| Q2.1 | WAV export          | 1 день | —            |
| Q2.2 | MP3 export (lamejs) | 1 день | —            |
| Q2.3 | FLAC export         | 1 день | —            |

### 5.3 Design Polish (2 дня)

| #    | Подзадача                  | Оценка   | Скилл/Плагин   |
| ---- | -------------------------- | -------- | -------------- |
| Q3.1 | Search box на главной      | 0.5 дня  | ui-engineering |
| Q3.2 | Skeleton loading states    | 0.5 дня  | —              |
| Q3.3 | Route transition animation | 0.5 дня  | —              |
| Q3.4 | Border-radius hierarchy    | 0.25 дня | —              |
| Q3.5 | Nav simplification         | 0.25 дня | —              |

**Сабагент:** `explore` — аудит текущего design system

### 5.4 WCAG AA Pass (2 дня)

| #    | Подзадача                   | Оценка | Скилл/Плагин |
| ---- | --------------------------- | ------ | ------------ |
| Q4.1 | Library accessibility audit | 1 день | a11y-audit   |
| Q4.2 | Studio accessibility audit  | 1 день | a11y-audit   |

**Сабагент:** `explore` — сканирование на accessibility issues

---

## Phase 6: New Features (Q3 2026)

### 6.1 Collaboration Features (5-8 дней)

| #    | Подзадача                             | Оценка | Скилл/Плагин |
| ---- | ------------------------------------- | ------ | ------------ |
| F1.1 | Realtime sessions (presence, cursors) | 3 дня  | —            |
| F1.2 | Lyrics co-editing                     | 2 дня  | —            |
| F1.3 | Waveform sync                         | 2 дня  | —            |

### 6.2 Marketplace MVP (5-7 дней)

| #    | Подзадача               | Оценка | Скилл/Плагин       |
| ---- | ----------------------- | ------ | ------------------ |
| F2.1 | Beats/loops marketplace | 3 дня  | —                  |
| F2.2 | Voice marketplace       | 2 дня  | —                  |
| F2.3 | Payment integration     | 2 дня  | stripe-integration |

### 6.3 Public Developer API (5-7 дней)

| #    | Подзадача          | Оценка | Скилл/Плагин      |
| ---- | ------------------ | ------ | ----------------- |
| F3.1 | API key management | 1 день | —                 |
| F3.2 | REST endpoints     | 2 дня  | api-designer      |
| F3.3 | Webhooks           | 2 дня  | —                 |
| F3.4 | Documentation      | 2 дня  | api-documentation |

---

## Инструменты и скиллы

### Скиллы для использования

| Скилл                      | Применение                     |
| -------------------------- | ------------------------------ |
| `playwright-pro`           | E2E тестирование               |
| `a11y-audit`               | Accessibility аудит            |
| `ab-testing`               | A/B тестирование моделей       |
| `api-designer`             | Дизайн API                     |
| `api-documentation`        | Документация API               |
| `stripe-integration`       | Платежи                        |
| `ui-engineering`           | UI polish                      |
| `seo`                      | SEO оптимизация                |
| `performance-optimization` | Оптимизация производительности |

### Сабагенты для использования

| Сабагент  | Применение                    |
| --------- | ----------------------------- |
| `explore` | Поиск кода, аудит, анализ     |
| `general` | Реализация задач, рефакторинг |

### MCP серверы

| MCP      | Применение                  |
| -------- | --------------------------- |
| Supabase | База данных, edge functions |
| GitHub   | Issues, PRs, Actions        |
| 9Router  | AI gateway                  |

---

## Timeline (обновлённый)

```
Week 1 (Jul 7-11): ✅ DONE
  Phase 1: CI stabilization
  Phase 2: Sprint 050 closure
  Phase 3: Test coverage verification
  Phase 4 start: 9Router integration

Week 2 (Jul 14-18):
  Phase 4: i18n pilot (mashup domain)
  Phase 4: 9Router deep integration
  Phase 5 start: Service Worker

Week 3 (Jul 21-25):
  Phase 5: Export service (WAV/MP3/FLAC)
  Phase 5: Design polish
  Phase 5: WCAG AA pass

Week 4 (Jul 28 - Aug 1):
  Phase 6 start: Collaboration features
  Phase 6: Marketplace MVP planning

Week 5-6 (Aug 4-15):
  Phase 6: Marketplace MVP
  Phase 6: Public Developer API
```

---

## Риски

| Риск                  | Вероятность | Митигация                           |
| --------------------- | ----------- | ----------------------------------- |
| 9Router downtime      | Низкая      | Fallback to Supabase edge functions |
| i18n breaking changes | Средняя     | Feature flag for language switch    |
| E2E flaky tests       | Средняя     | Retry + quarantine                  |
| npm vulnerabilities   | Низкая      | Dev-only, documented                |

---

_Составлено: 2026-07-07_
_Следующий review: 2026-07-14_
