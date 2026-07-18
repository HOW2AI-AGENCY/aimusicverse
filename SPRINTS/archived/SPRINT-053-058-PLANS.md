# Sprint 053-058: Detailed Plans

## Sprint 053: Suno Sounds + MIDI + Boost

**Статус:** ⏳ Запланирован  
**Приоритет:** Средний  
**Дата начала:** 2026-08-06 (предполагаемая)

### Задачи

| ID   | Название                     | Статус     | Описание                     |
| ---- | ---------------------------- | ---------- | ---------------------------- |
| T057 | Edge: `suno-sounds` callback | ⏳ Planned | SFX генерация callback       |
| T058 | Edge: `suno-midi` callback   | ⏳ Planned | MIDI транскрипция callback   |
| T059 | Edge: `suno-midi-details`    | ⏳ Planned | Детали MIDI генерации        |
| T060 | UI: `SfxGeneratorSheet`      | ⏳ Planned | MobileBottomSheet для SFX    |
| T061 | Telegram: `/sfx` команда     | ⏳ Planned | Bot команда для SFX          |
| T062 | Replace Replicate SFX с Suno | ⏳ Planned | Миграция с Replicate на Suno |

### Технические детали

**Suno API Endpoints:**

- `POST /suno-sounds` - генерация sound effects
- `GET /suno-sounds/{id}/callback` - статус
- `POST /suno-midi` - MIDI транскрипция
- `GET /suno-midi/{id}/callback` - статус

**UI Components:**

- `SfxGeneratorSheet` - выбор темпа, тональности, длительности
- `usePreviewAudio` - превью SFX

---

## Sprint 054: Klangio Integration + Transcription

**Статус:** ⏳ Запланирован  
**Приоритет:** Высокий  
**Дата начала:** 2026-08-16 (предполагаемая)

### Задачи

| ID   | Название                             | Статус     | Описание                         |
| ---- | ------------------------------------ | ---------- | -------------------------------- |
| T063 | Edge: Klangio transcription callback | ⏳ Planned | Обработка результатов            |
| T064 | UI: MIDI transcription в Studio      | ⏳ Planned | Интеграция в редактор            |
| T065 | 6 AI моделей для транскрипции        | ⏳ Planned | Piano, Guitar, Drums, Bass, etc. |
| T066 | Integration с track editing          | ⏳ Planned | MIDI → track notes               |

### Технические детали

**Klangio API:**

- `POST /transcribe` - загрузка аудио
- `GET /transcribe/{id}` - статус транскрипции
- WebSocket -实时 прогресс

**Модели:**

- Piano transcription
- Guitar tablature
- Drum transcription
- Bass line extraction
- Strings separation
- Vocal melody extraction

---

## Sprint 055: UX Audit Findings Implementation

**Статус:** ⏳ Запланирован  
**Приоритет:** Высокий  
**Дата начала:** 2026-08-26 (предполагаемая)

### Задачи

| ID   | Название                          | Статус      | Описание              |
| ---- | --------------------------------- | ----------- | --------------------- |
| T067 | Fix Save Draft functionality      | 🔄 Critical | Сохранение черновиков |
| T068 | Mobile touch targets optimization | ⏳ Planned  | Минимум 44×44px       |
| T069 | Reduce friction в generation flow | ⏳ Planned  | Упрощение формы       |
| T070 | Improve mobile navigation         | ⏳ Planned  | Улучшение UX          |
| T071 | Optimize form fields for mobile   | ⏳ Planned  | Адаптация полей       |

### Критические проблемы

**Save Draft (T067):**

- Текущая проблема: Черновики не сохраняются
- Решение: localStorage + Supabase backup
- Приоритет: Критический

**Touch Targets (T068):**

- Текущий baseline: Некоторые элементы <44px
- Цель: Все интерактивные элементы ≥44×44px
- Метрика: iOS HIG compliance

---

## Sprint 056: Generate Sheet Redesign

**Статус:** ⏳ Запланирован  
**Приоритет:** Средний  
**Дата начала:** 2026-09-05 (предполагаемая)

### Задачи

| ID   | Название                       | Статус     | Описание             |
| ---- | ------------------------------ | ---------- | -------------------- |
| T072 | Redesign generation form UI    | ⏳ Planned | Новый дизайн формы   |
| T073 | Improve form validation UX     | ⏳ Planned | Real-time валидация  |
| T074 | Mobile-first form optimization | ⏳ Planned | Адаптация под mobile |
| T075 | Add loading states             | ⏳ Planned | Индикация загрузки   |

### Дизайн-принципы

**Mobile-First:**

- Progressive disclosure
- Minimal form fields
- Clear error messages
- Loading feedback

**UX Patterns:**

- Single-column layout
- Large touch targets
- Clear visual hierarchy

---

## Sprint 057: Performance Optimization Bundle

**Статус:** ⏳ Запланирован  
**Приоритет:** Высокий  
**Дата начала:** 2026-09-15 (предполагаемая)

### Задачи

| ID   | Название                       | Статус     | Описание                      |
| ---- | ------------------------------ | ---------- | ----------------------------- |
| T076 | Bundle size analysis           | ⏳ Planned | Цель: <950KB eager            |
| T077 | Code splitting optimization    | ⏳ Planned | Lazy load heavy chunks        |
| T078 | Tree-shaking improvements      | ⏳ Planned | Удаление неиспользуемого кода |
| T079 | Lazy loading implementation    | ⏳ Planned | Кодовое разделение            |
| T080 | Production build optimizations | ⏳ Planned | Минимизация                   |

### Цели по производительности

**Bundle Metrics:**

- Eager load: <500KB gzip
- Total chunks: <2.5MB gzip
- First Contentful Paint: <1.5s
- Time to Interactive: <3s

**Техники:**

- Route-based code splitting
- Component lazy loading
- Dynamic imports
- Bundle analysis

---

## Sprint 058: Storybook Design System Completion

**Статус:** ⏳ Запланирован  
**Приоритет:** Средний  
**Дата начала:** 2026-09-25 (предполагаемая)

### Задачи

| ID   | Название                        | Статус     | Описание                    |
| ---- | ------------------------------- | ---------- | --------------------------- |
| T081 | Add 50+ Storybook stories       | ⏳ Planned | Покрытие компонентов        |
| T082 | Component documentation         | ⏳ Planned | Docs для всех компонентов   |
| T083 | Design system tokens            | ⏳ Planned | Цвета, отступы, типографика |
| T084 | Component accessibility testing | ⏳ Planned | A11y тестирование           |

### Storybook Stories

**Компоненты для документирования:**

- Buttons (all variants)
- Inputs (text, number, select)
- Cards (track, artist, project)
- Modals и dialogs
- Lists и virtualization
- Audio components
- Navigation elements

**A11y Testing:**

- Keyboard navigation
- Screen reader compatibility
- Color contrast WCAG AA
- Touch target sizes

---

## Общий Timeline

```
Sprint 051: 2026-07-21 - 2026-08-05 (2 weeks)
Sprint 053: 2026-08-06 - 2026-08-15 (1.5 weeks)
Sprint 054: 2026-08-16 - 2026-08-25 (1.5 weeks)
Sprint 055: 2026-08-26 - 2026-09-10 (2.5 weeks)
Sprint 056: 2026-09-05 - 2026-09-12 (1 week) - overlaps 055
Sprint 057: 2026-09-15 - 2026-09-25 (1.5 weeks)
Sprint 058: 2026-09-25 - 2026-10-05 (2 weeks)
```

## Итого

- **Sprint 051:** 6 задач
- **Sprint 053:** 6 задач
- **Sprint 054:** 4 задач
- **Sprint 055:** 5 задач
- **Sprint 056:** 4 задач
- **Sprint 057:** 5 задач
- **Sprint 058:** 4 задач

**Всего:** 34 задачи (совпадает с добавленными в BACKLOG.md T051-T092)

## Зависимости

- Sprint 051 → Sprint 053 (базовая стабильность)
- Sprint 053 → Sprint 054 (API покрытие)
- Sprint 055 → Sprint 056 (UX перед редизайном)
- Все спринты → Sprint 058 (документация компонентов)

## Критерии успеха

Все спринты завершены когда:

- [ ] Все задачи выполнены
- [ ] CI зелёный
- [ ] Документация обновлена
- [ ] E2E тесты проходят
